import { NETWORK } from "@constants";

function getPeanutAddress() {
  switch (NETWORK.chainId) {
    case 1:
      return "0xdB60C736A30C41D9df0081057Eae73C3eb119895";
    case 10:
      return "0x1aBe03DC4706aE47c4F2ae04EEBe5c8607c74e17";
    case 420:
      return "0xDC608f2Bc4f0AFf02D12d51Ca8b543B343525c8a";
  }
  throw new Error("Peanut Protocol Not Available on this network");
}

export const PEANUT_V3_ADDRESS = getPeanutAddress();

let claimUrl: URL;
try {
  claimUrl = new URL(process.env.REACT_APP_PEANUT_CLAIM_URL!);
} catch (e) {
  throw new Error("Invalid Peanut Claim URL");
}

export const PEANUT_CLAIM_URL = claimUrl.toString();
