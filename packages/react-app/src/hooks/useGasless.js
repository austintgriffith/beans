import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { SignatureTransfer } from "@uniswap/permit2-sdk";

const REACT_APP_RELAYER_URL = process.env.REACT_APP_RELAYER_URL;
const REACT_APP_ECO_TOKEN_ADDRESS = process.env.REACT_APP_ECO_TOKEN_ADDRESS;
const REACT_APP_STAKED_ECOX_TOKEN_ADDRESS = process.env.REACT_APP_STAKED_ECOX_TOKEN_ADDRESS;

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

const ERC20_PERMIT_TOKEN_ABI = [
  "function nonces(address owner) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

const PERMIT2_ABI = ["function nonceBitmap(address owner, uint256 nonce) external view returns (uint256)"];

const TOKENS = {
  eco: {
    name: "ECO",
    address: REACT_APP_ECO_TOKEN_ADDRESS,
  },
  secox: {
    name: "Staked ECOx",
    address: REACT_APP_STAKED_ECOX_TOKEN_ADDRESS,
  },
};

function getTimestamp(add = 0) {
  return Math.floor(Date.now() / 1000) + add;
}

class Relayer {
  static async initialize(_token, signer) {
    const token = Relayer.#getToken(_token);
    const erc20 = Relayer.#getContract(token, signer);

    const address = await signer.getAddress();
    const network = await signer.provider.getNetwork();
    const nonce = await erc20.nonces(address);

    const domain = {
      version: "1",
      name: token.name,
      chainId: network.chainId,
      verifyingContract: token.address,
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

    const response = await Relayer.#request(`/relayer/permit2/${_token}/init`, payload);

    // Wait 3s while indexing transaction
    await new Promise(resolve => setTimeout(resolve, 3000));

    const tx = await signer.provider.getTransaction(response.transaction.hash);

    if (tx) await tx.wait();

    return response;
  }

  static async #getNonce() {
    return ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
  }

  static async transfer(_token, signer, to, amount) {
    const token = Relayer.#getToken(_token);

    const from = await signer.getAddress();
    const network = await signer.provider.getNetwork();

    const nonce = await Relayer.#getNonce(token, signer);
    const spender = await Relayer.#getRelayerAddress();
    const deadline = getTimestamp(1800).toString();

    const permit = {
      spender,
      deadline,
      nonce: nonce.toString(),
      permitted: { amount: amount.toString(), token: token.address },
    };

    const { domain, types, values } = SignatureTransfer.getPermitData(permit, PERMIT2_ADDRESS, network.chainId);
    const signature = await signer._signTypedData(domain, types, values);

    const payload = { from, to, permit, signature };
    const response = await Relayer.#request(`/relayer/permit2/${_token}/transfer`, payload);

    // Wait 3s while indexing transaction
    await new Promise(resolve => setTimeout(resolve, 3000));

    const tx = await signer.provider.getTransaction(response.transaction.hash);

    if (tx) await tx.wait();

    return response;
  }

  static async isEnabled(_token, signer) {
    const token = Relayer.#getToken(_token);
    const erc20 = Relayer.#getContract(token, signer);
    const address = await signer.getAddress();
    const allowance = await erc20.allowance(address, PERMIT2_ADDRESS);
    return allowance.gt(ethers.constants.Zero);
  }

  static #getToken(_token) {
    return TOKENS[_token];
  }

  static #getContract(token, signer) {
    return new ethers.Contract(token.address, ERC20_PERMIT_TOKEN_ABI, signer.provider);
  }

  static #getPermit2Contract(signer) {
    return new ethers.Contract(PERMIT2_ADDRESS, PERMIT2_ABI, signer.provider);
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
      await Relayer.initialize("eco", signer);
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
    setLoading(true);
    try {
      // If gasless feature is not enabled, enable it
      if (!enabled) await enable();

      const { transaction } = await Relayer.transfer("eco", signer, to, amount);
      setLastTx({ type: "transfer", transaction });
    } catch (e) {
      console.error("[gasless:error:enable]", e);
      setError(e.message);
    }
    setLoading(false);
  };

  return { enabled, enabling, loading, error, lastTx, transfer };
};
