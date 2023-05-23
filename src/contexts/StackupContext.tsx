import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Client, Presets } from "userop";
import { SimpleAccount } from "userop/dist/preset/builder";

import { ERC20_ABI } from "../assets/abis/ERC20";
import { useQuery } from "react-query";

interface IStackupProvider {
  client?: Client;
  simpleAccount?: SimpleAccount;
  expectedGasFee: ethers.BigNumber;

  transfer(to: string, amount: ethers.BigNumber): Promise<string>;
}

const StackupContext = React.createContext<IStackupProvider>({
  expectedGasFee: ethers.constants.Zero,
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

interface StackupProviderProps {
  provider: ethers.providers.Provider;
  signer: ethers.Signer;
}

const hasWalletBeenDeployed = async (provider: any, address: string) => {
  try {
    const code = await provider.getCode(address);
    return code !== "0x";
  } catch (e) {
    console.error("Error determining if SWA is already deployed", e);
  }
  return false;
};

const paymaster = Presets.Middleware.verifyingPaymaster(config.paymaster.rpcUrl, config.paymaster.context);

const ERC20_TRANSFER_GAS = 91_000;
const VALIDATION_GAS = 100_000;
const INIT_CODE_GAS = 385_266;

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

  const buildOps = async (to: string, amount: ethers.BigNumber) => {
    if (!simpleAccount) return;

    const erc20 = new ethers.Contract(ECO_TOKEN, ERC20_ABI, provider);
    const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);

    const hasBeenDeployed = await hasWalletBeenDeployed((client as any).provider, simpleAccount.getSender());
    if (hasBeenDeployed) {
      simpleAccount.execute(erc20.address, 0, data);
    } else {
      // Execute transaction and approve Paymaster to spend tokens to pay gas fees in ECO tokens
      simpleAccount.executeBatch(
        [erc20.address, erc20.address],
        [
          data,
          erc20.interface.encodeFunctionData("approve", [VERIFYING_PAYMASTER_ADDRESS, ethers.constants.MaxUint256]),
        ],
      );
    }
  };

  const transfer = async (t: string, amount: ethers.BigNumber): Promise<string> => {
    if (!client || !simpleAccount) return "";

    await buildOps(ethers.utils.getAddress(t), amount);

    const res = await client.sendUserOperation(simpleAccount);
    console.log("Waiting for transaction...");
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    return ev!.transactionHash;
  };

  const { data: expectedGasFee } = useQuery(
    "expected-gas-fee",
    async () => {
      if (!simpleAccount || !client) return ethers.constants.Zero;

      const provider = (client as any).provider as ethers.providers.JsonRpcProvider;
      const gasPrice = await provider.getGasPrice();

      let gas = ERC20_TRANSFER_GAS + VALIDATION_GAS;
      const hasBeenDeployed = await hasWalletBeenDeployed(provider, simpleAccount.getSender());
      if (!hasBeenDeployed) {
        gas += INIT_CODE_GAS;
      }

      return gasPrice.mul(gas);
    },
    { enabled: !!simpleAccount && !!client, initialData: ethers.constants.Zero },
  );

  return (
    <StackupContext.Provider
      value={{
        simpleAccount,
        client,
        transfer,
        expectedGasFee: expectedGasFee!,
      }}
    >
      {children}
    </StackupContext.Provider>
  );
};
