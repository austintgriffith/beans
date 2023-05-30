import { ethers } from "ethers";
import { ClaimRequest } from "@modules/peanut/types";
import { PEANUT_CLAIM_URL, PEANUT_V3_ADDRESS } from "@modules/peanut/constants";
import { PeanutV3__factory } from "@assets/contracts";
import { ECO_TOKEN_ADDRESS } from "@constants";

namespace Peanut {
  enum ClaimSearchParams {
    NETWORK = "c",
    VERSION = "v",
    PASSWORD = "p",
    DEPOSIT_ID = "i",
  }

  export function generateKeysFromString(string: string) {
    const privateKey = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(string));
    const wallet = new ethers.Wallet(privateKey);
    const publicKey = wallet.publicKey;

    return {
      address: wallet.address,
      privateKey: privateKey,
      publicKey: publicKey,
    };
  }

  export function getParamsFromLink(link = window.location.href) {
    const url = new URL(link);

    const contractVersion = url.searchParams.get(ClaimSearchParams.VERSION);
    const password = url.searchParams.get(ClaimSearchParams.PASSWORD);

    const chainId = parseInt(url.searchParams.get(ClaimSearchParams.NETWORK) || "0");
    const _depositIdx = url.searchParams.get(ClaimSearchParams.DEPOSIT_ID);
    const depositIdx = _depositIdx ? parseInt(_depositIdx) : undefined;

    return { chainId, contractVersion, depositIdx, password };
  }

  export function getRandomString(length = 32) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result_str = "";
    for (let i = 0; i < length; i++) {
      result_str += chars[Math.floor(Math.random() * chars.length)];
    }
    return result_str;
  }

  export async function makeDeposit(amount: ethers.BigNumber, password = getRandomString()) {
    const wallet = generateKeysFromString(password);

    const peanutInterface = PeanutV3__factory.createInterface();
    const txData = peanutInterface.encodeFunctionData("makeDeposit", [ECO_TOKEN_ADDRESS, 1, amount, 0, wallet.address]);

    return { password, transaction: { to: PEANUT_V3_ADDRESS, data: txData } };
  }

  export function createLink(password: string, depositId: number): string {
    const url = new URL("/claim", window.location.origin);
    url.searchParams.set(ClaimSearchParams.DEPOSIT_ID, depositId.toString());
    url.searchParams.set(ClaimSearchParams.PASSWORD, password);

    return url.toString();
  }

  export async function signClaimTx(password: string, recipient: string) {
    const keys = generateKeysFromString(password);

    const addressHash = ethers.utils.arrayify(ethers.utils.solidityKeccak256(["address"], [recipient]));
    const addressHashEIP191 = ethers.utils.hashMessage(addressHash);

    const signer = new ethers.Wallet(keys.privateKey);
    const signature = await signer.signMessage(addressHash);

    return { signature, addressHashEIP191 };
  }

  export async function sendClaimRequest({ password, depositIdx, recipient, network = "goerli" }: ClaimRequest) {
    const url = new URL(PEANUT_CLAIM_URL);
    url.searchParams.set(ClaimSearchParams.NETWORK, network);
    url.searchParams.set(ClaimSearchParams.VERSION, "v3");
    url.searchParams.set(ClaimSearchParams.DEPOSIT_ID, depositIdx.toString());
    url.searchParams.set(ClaimSearchParams.PASSWORD, password);

    const formData = new FormData();

    const { signature, addressHashEIP191 } = await signClaimTx(password, recipient);

    formData.append("to_address", recipient);
    formData.append("signature", signature);
    formData.append("addressHashEIP191", addressHashEIP191);

    return fetch(url.toString(), {
      method: "POST",
      mode: "cors",
      redirect: "manual",
      body: formData,
    }).then(async res => {
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data as { receipt: { transactionHash: string } };
    });
  }
}

export default Peanut;
