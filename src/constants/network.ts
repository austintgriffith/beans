export const INFURA_ID = process.env.REACT_APP_INFURA_ID;

type Network = "localhost" | "mainnet" | "goerli" | "polygon" | "mumbai" | "optimism" | "goerli-optimism";

export interface INetwork {
  name: string;
  color: string;
  rpcUrl: string;
  chainId: number;
  blockExplorer: string;
}

export const NETWORKS: Record<Network, INetwork> = {
  localhost: {
    name: "localhost",
    color: "#666666",
    chainId: 31337,
    blockExplorer: "",
    rpcUrl: "http://" + (global.window ? window.location.hostname : "localhost") + ":8545",
  },
  mainnet: {
    name: "mainnet",
    color: "#ff8b9e",
    chainId: 1,
    rpcUrl: `https://mainnet.infura.io/v3/${INFURA_ID}`,
    blockExplorer: "https://etherscan.io/",
  },
  goerli: {
    name: "goerli",
    color: "#0975F6",
    chainId: 5,
    blockExplorer: "https://goerli.etherscan.io/",
    rpcUrl: `https://goerli.infura.io/v3/${INFURA_ID}`,
  },
  polygon: {
    name: "polygon",
    color: "#2bbdf7",
    chainId: 137,
    rpcUrl: "https://polygon-rpc.com/",
    blockExplorer: "https://polygonscan.com/",
  },
  mumbai: {
    name: "mumbai",
    color: "#92D9FA",
    chainId: 80001,
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    blockExplorer: "https://mumbai.polygonscan.com/",
  },
  optimism: {
    name: "optimism",
    color: "#f01a37",
    chainId: 10,
    blockExplorer: "https://optimistic.etherscan.io/",
    rpcUrl: `https://mainnet.optimism.io`,
  },
  "goerli-optimism": {
    name: "goerli-optimism",
    color: "#f01a37",
    chainId: 420,
    blockExplorer: "https://goerli-optimism.etherscan.io/",
    rpcUrl: `https://goerli.optimism.io`,
  },
};

export const NETWORK = NETWORKS[process.env.REACT_APP_NETWORK as keyof typeof NETWORKS];

if (NETWORK === undefined) {
  throw new Error("Network not found, please change the `REACT_APP_NETWORK` ENV or add the network to the list");
}
