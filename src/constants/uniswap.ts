import { NETWORK } from "./network";

interface UniContracts {
  quoterV2: string;
  swapRouter: string;
  poolFactory: string;
}

const UniMainnetContracts: UniContracts = {
  quoterV2: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
  swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  poolFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
};

const UniGoerliOptimismContracts: UniContracts = {
  quoterV2: "0x2A3BE34702B9d4dC3CC38a3Eb4A79cBcA4F665DB",
  swapRouter: "0xEA9E5A64ED3F892baD4b477709846b819013dEFC",
  poolFactory: "0xB656dA17129e7EB733A557f4EBc57B76CFbB5d10",
};

const uniContracts = NETWORK.chainId === 420 ? UniGoerliOptimismContracts : UniMainnetContracts;

export const QUOTER_V2_ADDRESS = uniContracts.quoterV2;
export const SWAP_ROUTER_ADDRESS = uniContracts.swapRouter;
export const POOL_FACTORY_ADDRESS = uniContracts.poolFactory;
