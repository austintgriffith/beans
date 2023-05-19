import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { SimpleAccount } from "userop/dist/preset/builder";

interface IStackupProvider {
  client?: Client;
  simpleAccount?: SimpleAccount;
  transfer(to: string, amount: ethers.BigNumber): Promise<string>;
}

const StackupContext = React.createContext<IStackupProvider>({
  async transfer() {
    return "";
  },
});

export const useStackup = () => React.useContext<IStackupProvider>(StackupContext);

const STACKUP_API_KEY = "3bf77b3f42c7032f4df8cf35b8bd0e060aaf657d78f4fd99313d4869a31f53c5";
const VERIFYING_PAYMASTER_ADDRESS = "0xE93ECa6595fe94091DC1af46aaC2A8b5D7990770";

const ECO_TOKEN = ethers.utils.getAddress(process.env.REACT_APP_ECO_TOKEN_ADDRESS!);

const config = {
  rpcUrl: `https://api.stackup.sh/v1/node/${STACKUP_API_KEY}`,
  signingKey: new ethers.Wallet(ethers.utils.randomBytes(32)).privateKey,
  entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  simpleAccountFactory: "0x9406Cc6185a346906296840746125a0E44976454",
  paymaster: {
    rpcUrl: `https://api.stackup.sh/v1/paymaster/${STACKUP_API_KEY}`,
    context: {
      type: "erc20token",
      token: ECO_TOKEN,
    },
  },
};

const ERC20_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
  },

  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
  },
];

interface StackupProviderProps {
  provider: ethers.providers.Provider;
  signer: ethers.Signer;
}

export const StackupProvider: React.FC<React.PropsWithChildren<StackupProviderProps>> = ({
  signer,
  provider,
  children,
}) => {
  const [client, setClient] = useState<Client>();
  const [simpleAccount, setSimpleAccount] = useState<SimpleAccount>();

  useEffect(() => {
    (async () => {
      // Init Simple Account
      try {
        const paymaster = Presets.Middleware.verifyingPaymaster(config.paymaster.rpcUrl, config.paymaster.context);

        const simpleAccount = await Presets.Builder.SimpleAccount.init(
          signer,
          config.rpcUrl,
          config.entryPoint,
          config.simpleAccountFactory,
          paymaster,
        );

        setSimpleAccount(simpleAccount);
      } catch (err) {}

      // Init Client
      try {
        const client = await Client.init(config.rpcUrl, config.entryPoint);
        setClient(client);
      } catch (err) {}
    })();
  }, [signer]);

  const transfer = async (t: string, amount: ethers.BigNumber): Promise<string> => {
    if (!client || !simpleAccount) return "";

    const to = ethers.utils.getAddress(t);

    const erc20 = new ethers.Contract(ECO_TOKEN, ERC20_ABI, provider);

    let hasBeenCreated;
    try {
      const code = await (client as any).provider.getCode(simpleAccount.getSender());
      hasBeenCreated = code !== "0x";
    } catch (e) {
      console.error("Error determining if SWA is already deployed", e);
    }

    const contract = erc20.address;
    const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);

    if (hasBeenCreated) {
      simpleAccount.execute(contract, 0, data);
    } else {
      // Execute transaction and approve Paymaster to spend tokens to pay gas fees in ECO tokens
      simpleAccount.executeBatch(
        [contract, erc20.address],
        [
          data,
          erc20.interface.encodeFunctionData("approve", [VERIFYING_PAYMASTER_ADDRESS, ethers.constants.MaxUint256]),
        ],
      );
    }

    const res = await client.sendUserOperation(simpleAccount);
    console.log("Waiting for transaction...");
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    return ev!.transactionHash;
  };

  return (
    <StackupContext.Provider
      value={{
        simpleAccount,
        client,
        transfer,
      }}
    >
      {children}
    </StackupContext.Provider>
  );
};
