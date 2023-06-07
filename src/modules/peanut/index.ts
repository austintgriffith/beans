import { ethers } from "ethers";
import isEqual from "lodash.isequal";

import { ECO_TOKEN_ADDRESS } from "@constants/tokens";
import { PeanutV3__factory } from "@assets/contracts/factories";

import { ClaimRequest } from "@modules/peanut/types";
import { ClaimSearchParams } from "@modules/peanut/utils";
import { PEANUT_CLAIM_URL, PEANUT_V3_ADDRESS } from "@modules/peanut/constants";

export { getParamsFromLink } from "@modules/peanut/utils";

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

export function getDepositEvent(recipient: string, receipt: ethers.ContractReceipt) {
  const peanut = new ethers.Contract(PEANUT_V3_ADDRESS, PeanutV3__factory.abi);
  const event = peanut.filters.DepositEvent(null, null, null, recipient);
  const depositEvt = receipt.logs.find(log => log.address === event.address && isEqual(log.topics, event.topics));

  if (!depositEvt) {
    throw new Error("Could not find deposit event");
  }

  const [id, type, amount, sender] = peanut.interface.decodeEventLog(
    "DepositEvent",
    depositEvt.data,
    depositEvt.topics,
  );

  return { id, type, amount, sender };
}

export async function signClaimTx(password: string, recipient: string) {
  const keys = generateKeysFromString(password);

  const addressHash = ethers.utils.arrayify(ethers.utils.solidityKeccak256(["address"], [recipient]));
  const addressHashEIP191 = ethers.utils.hashMessage(addressHash);

  const signer = new ethers.Wallet(keys.privateKey);
  const signature = await signer.signMessage(addressHash);

  return { signature, addressHashEIP191 };
}

export async function sendClaimRequest({ password, depositIdx, recipient }: ClaimRequest) {
  const { signature, addressHashEIP191 } = await signClaimTx(password, recipient);

  const formData = {
    index: depositIdx.toString(),
    signature: signature,
    to_address: recipient,
    addressHashEIP191: addressHashEIP191,
  };

  return fetch(PEANUT_CLAIM_URL, {
    mode: "cors",
    method: "POST",
    redirect: "manual",
    body: JSON.stringify(formData),
    headers: { "Content-Type": "application/json" },
  }).then(async res => {
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data as { receipt: { transactionHash: string } };
  });
}
