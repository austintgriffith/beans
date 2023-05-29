import { ethers } from "ethers";
import { ClaimRequest } from "@modules/peanut/types";
import { PEANUT_CLAIM_URL } from "@modules/peanut/constants";

namespace Peanut {
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

    const contractVersion = url.searchParams.get("v");
    const password = url.searchParams.get("p");
    const trackId = url.searchParams.get("t");

    const chainId = parseInt(url.searchParams.get("c") || "0");
    const _depositIdx = url.searchParams.get("i");
    const depositIdx = _depositIdx ? parseInt(_depositIdx) : undefined;

    return { chainId, contractVersion, depositIdx, password, trackId };
  }

  export async function signClaimTx(password: string, recipient: string) {
    const keys = generateKeysFromString(password); // deterministically generate keys from password

    const addressHash = ethers.utils.arrayify(ethers.utils.solidityKeccak256(["address"], [recipient]));
    const addressHashEIP191 = ethers.utils.hashMessage(addressHash);

    const signer = new ethers.Wallet(keys.privateKey);
    const signature = await signer.signMessage(addressHash);

    return { signature, addressHashEIP191 };
  }

  export async function sendClaimRequest({ password, depositIdx, recipient, network = "goerli" }: ClaimRequest) {
    const url = new URL(PEANUT_CLAIM_URL);
    url.searchParams.set("c", network);
    url.searchParams.set("v", "v3");
    url.searchParams.set("i", depositIdx.toString());
    url.searchParams.set("p", password);

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
