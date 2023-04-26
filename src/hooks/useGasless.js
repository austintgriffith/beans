import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { ExecutionLib } from "../helpers/executionLib";
import { SignatureTransfer } from "@uniswap/permit2-sdk";

const REACT_APP_RELAYER_URL = process.env.REACT_APP_RELAYER_URL;
const REACT_APP_ECO_TOKEN_ADDRESS = process.env.REACT_APP_ECO_TOKEN_ADDRESS;

const EIP2612_TYPES = {
  Permit: [
    {
      name: "owner",
      type: "address",
    },
    {
      name: "spender",
      type: "address",
    },
    {
      name: "value",
      type: "uint256",
    },
    {
      name: "nonce",
      type: "uint256",
    },
    {
      name: "deadline",
      type: "uint256",
    },
  ],
};

const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
const SPONSOR_ADDRESS = process.env.REACT_APP_SPONSOR_ADDRESS;

// 5 tokens
const SPONSOR_FEE_AMOUNT = ethers.constants.WeiPerEther.mul(5);

const ERC20_PERMIT_TOKEN_ABI = [
  "function transfer(address _to, uint256 _value) public returns (bool success)",
  "function nonces(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

const ECO_TOKEN = {
  name: "ECO",
  address: REACT_APP_ECO_TOKEN_ADDRESS,
};

function getTimestamp(add = 0) {
  return Math.floor(Date.now() / 1000) + add;
}

class Relayer {
  static async initialize(signer) {
    const erc20 = Relayer.#getContract(signer);

    const address = await signer.getAddress();
    const network = await signer.provider.getNetwork();
    const nonce = await erc20.nonces(address);

    const domain = {
      version: "1",
      name: ECO_TOKEN.name,
      chainId: network.chainId,
      verifyingContract: ECO_TOKEN.address,
    };

    const message = {
      owner: address,
      spender: PERMIT2_ADDRESS,
      nonce: nonce.toString(),
      value: ethers.constants.MaxUint256.toHexString(),
      deadline: getTimestamp(1800).toString(),
    };

    const signatureRaw = await signer._signTypedData(domain, EIP2612_TYPES, message);
    const signature = ethers.utils.splitSignature(signatureRaw);

    const payload = { ...message, ...signature };

    const response = await Relayer.#request(`/relayer/permit2/eco/init`, payload);

    // Wait 3s while indexing transaction
    await new Promise(resolve => setTimeout(resolve, 3000));

    const tx = await signer.provider.getTransaction(response.transaction.hash);

    if (tx) await tx.wait();

    return response;
  }

  static async transfer(signer, to, amount) {
    const from = await signer.getAddress();
    const network = await signer.provider.getNetwork();

    const nonce = Relayer.#getNonce();
    const spender = await Relayer.#getRelayerAddress();
    const deadline = getTimestamp(1800).toString();

    const permit = {
      spender,
      deadline,
      nonce: nonce.toString(),
      permitted: { amount: amount.toString(), token: ECO_TOKEN.address },
    };

    const { domain, types, values } = SignatureTransfer.getPermitData(permit, PERMIT2_ADDRESS, network.chainId);
    const signature = await signer._signTypedData(domain, types, values);

    const payload = { from, to, permit, signature };
    const response = await Relayer.#request(`/relayer/permit2/eco/transfer`, payload);

    // Wait 3s while indexing transaction
    await new Promise(resolve => setTimeout(resolve, 3000));

    const tx = await signer.provider.getTransaction(response.transaction.hash);

    if (tx) await tx.wait();

    return response;
  }

  static async sponsorTransfer(signer, to, amount) {
    const execution = await Relayer.#getExecutionForSingleTransfer(signer, to, amount);
    const network = await signer.provider.getNetwork();

    const permit = {
      spender: SPONSOR_ADDRESS,
      permitted: execution.tokens,
      nonce: execution.nonce,
      deadline: execution.deadline,
    };

    const { domain } = SignatureTransfer.getPermitData(permit, PERMIT2_ADDRESS, network.chainId);
    const message = ExecutionLib.hashTypedData(
      domain,
      ExecutionLib.hashWithWitness(permit, ExecutionLib.hash(execution)),
    );

    // Avoid messageHash function
    execution.signature = ethers.utils.joinSignature(signer._signingKey().signDigest(message));

    const payload = { sponsor: SPONSOR_ADDRESS, execution };
    const response = await Relayer.#request(`/relayer/sponsor/eco/transfer`, payload);

    // Wait 3s while indexing transaction
    await new Promise(resolve => setTimeout(resolve, 3000));

    const tx = await signer.provider.getTransaction(response.transaction.hash);
    if (tx) await tx.wait();
    return response;
  }

  static async isEnabled(_token, signer) {
    const erc20 = Relayer.#getContract(signer);
    const address = await signer.getAddress();
    const allowance = await erc20.allowance(address, PERMIT2_ADDRESS);
    return allowance.gt(ethers.constants.Zero);
  }

  static async #getExecutionForSingleTransfer(signer, to, amount) {
    const sender = await signer.getAddress();
    const eco = Relayer.#getContract(signer);

    const { data } = await eco.populateTransaction.transfer(to, amount);

    return {
      sender: sender,
      nonce: Relayer.#getNonce(),
      deadline: getTimestamp(1800).toString(),
      conditions: [],
      operations: [{ to: ECO_TOKEN.address, data }],
      payment: { token: ECO_TOKEN.address, amount: SPONSOR_FEE_AMOUNT.toHexString() },
      tokens: [{ token: ECO_TOKEN.address, amount: amount.add(SPONSOR_FEE_AMOUNT).toHexString() }],
    };
  }

  static #getNonce() {
    return ethers.BigNumber.from(ethers.utils.randomBytes(32)).toHexString();
  }

  static #getContract(signer) {
    return new ethers.Contract(ECO_TOKEN.address, ERC20_PERMIT_TOKEN_ABI, signer.provider);
  }

  static #getUrl(path) {
    return new URL(path, REACT_APP_RELAYER_URL).toString();
  }

  static #getRelayerAddress() {
    return fetch(Relayer.#getUrl("/relayer/address")).then(response => response.text());
  }

  static #request(path, data) {
    const url = Relayer.#getUrl(path);
    return fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }).then(response =>
      response.json().then(data => {
        if (response.ok) return data;
        throw new Error(data.error || data);
      }),
    );
  }
}

export const useGasless = signer => {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(null);
  const [lastTx, setLastTx] = useState(null);

  const [loading, setLoading] = useState(false);
  const [enabling, setEnabling] = useState(false);

  useEffect(() => {
    if (signer) Relayer.isEnabled("eco", signer).then(setEnabled);
  }, [signer]);

  const enable = async () => {
    if (enabled || enabling) return;
    setError(null);
    setEnabling(true);
    try {
      await Relayer.initialize(signer);
      setEnabled(true);
    } catch (e) {
      console.error("[gasless:error:enable]", e);
      setError(e.message);
      throw e;
    } finally {
      setEnabling(false);
    }
  };

  const transfer = async (to, amount) => {
    if (loading) return;
    setError(null);
    setLastTx(null);
    setLoading(true);
    try {
      // If gasless feature is not enabled, enable it
      if (!enabled) await enable();

      const { transaction } = await Relayer.sponsorTransfer(signer, to, amount);
      setLastTx({ type: "transfer", transaction });
    } catch (e) {
      console.error("[gasless:error:transfer]", e);
      setError(e.message);
    }
    setLoading(false);
  };

  return { enabled, enabling, loading, error, lastTx, transfer };
};
