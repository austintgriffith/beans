import WalletConnectProvider from "@walletconnect/web3-provider";
import { SafeAppWeb3Modal } from "@gnosis.pm/safe-apps-web3modal";
import { INFURA_ID } from "../constants";

const web3ModalSetup = () =>
  new SafeAppWeb3Modal({
    theme: "light",
    network: "mainnet",
    cacheProvider: true,
    providerOptions: {
      walletconnect: {
        package: WalletConnectProvider, // required
        options: {
          infuraId: INFURA_ID,
          bridge: "https://polygon.bridge.walletconnect.org",
          rpc: {
            10: "https://mainnet.optimism.io", // xDai
            100: "https://rpc.gnosischain.com", // xDai
            137: "https://polygon-rpc.com",
            31337: "http://localhost:8545",
            42161: "https://arb1.arbitrum.io/rpc",
            80001: "https://rpc-mumbai.maticvigil.com",
            71401: "https://godwoken-testnet-v1.ckbapp.dev",
            80216: "https://chain.buidlguidl.com:8545",
          },
        },
      },
    },
  });

export default web3ModalSetup;
