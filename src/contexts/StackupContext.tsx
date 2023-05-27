import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useQuery } from "react-query";
import { Client, Presets, UserOperationMiddlewareFn } from "userop";
import { SimpleAccount } from "userop/dist/preset/builder";

import { ERC20_ABI } from "@assets/abis";
import { ECO_TOKEN_ADDRESS, STACKUP_API_KEY, USDC_TOKEN_ADDRESS, VERIFYING_PAYMASTER_ADDRESS } from "@constants";

interface IStackupProvider {
  address: string;
  client?: Client;
  signer: ethers.Signer;
  simpleAccount: SimpleAccount;
  provider: ethers.providers.Provider;
  expectedGasFee: ethers.BigNumber;

  transfer(to: string, amount: ethers.BigNumber): Promise<string>;
}

const StackupContext = React.createContext<IStackupProvider>({
  signer: {} as ethers.Signer,
  provider: {} as ethers.providers.Provider,
  simpleAccount: {} as SimpleAccount,
  expectedGasFee: ethers.constants.Zero,
  address: ethers.constants.AddressZero,
  transfer: () => Promise.reject(),
});

export const useStackup = () => React.useContext<IStackupProvider>(StackupContext);

const config = {
  rpcUrl: `https://api.stackup.sh/v1/node/${STACKUP_API_KEY}`,
  entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  simpleAccountFactory: "0x9406Cc6185a346906296840746125a0E44976454",
  paymaster: {
    rpcUrl: `https://api.stackup.sh/v1/paymaster/${STACKUP_API_KEY}`,
    contextEco: { type: "erc20token", token: ECO_TOKEN_ADDRESS },
    contextUsdc: { type: "erc20token", token: USDC_TOKEN_ADDRESS },
  },
};

const ERC20_TRANSFER_GAS = 91_000;
const VALIDATION_GAS = 100_000;
const INIT_CODE_GAS = 385_266;

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

export const VERIFYING_PAYMASTER_ECO = Presets.Middleware.verifyingPaymaster(
  config.paymaster.rpcUrl,
  config.paymaster.contextEco,
);
export const VERIFYING_PAYMASTER_USDC = Presets.Middleware.verifyingPaymaster(
  config.paymaster.rpcUrl,
  config.paymaster.contextUsdc,
);

export const getSimpleAccount = (signer: ethers.Signer, paymaster?: UserOperationMiddlewareFn) => {
  return Presets.Builder.SimpleAccount.init(
    signer,
    config.rpcUrl,
    config.entryPoint,
    config.simpleAccountFactory,
    paymaster,
  );
};

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
        const simpleAccount = await getSimpleAccount(signer, VERIFYING_PAYMASTER_ECO);
        setSimpleAccount(simpleAccount);
      } catch (err) {}
    })();
  }, [signer]);

  useEffect(() => {
    (async () => {
      // Init Client
      try {
        const client = await Client.init(config.rpcUrl, config.entryPoint);
        setClient(client);
      } catch (err) {}
    })();
  }, [signer]);

  const buildOps = async (to: string, amount: ethers.BigNumber) => {
    if (!simpleAccount) return;

    const erc20 = new ethers.Contract(ECO_TOKEN_ADDRESS, ERC20_ABI, provider);
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

  const address = simpleAccount?.getSender();

  if (!address || !simpleAccount) return null;

  return (
    <StackupContext.Provider
      value={{
        signer,
        client,
        address,
        provider,
        transfer,
        simpleAccount,
        expectedGasFee: expectedGasFee!,
      }}
    >
      {children}
    </StackupContext.Provider>
  );
};
