import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Client, Presets, UserOperationMiddlewareFn } from "userop";
import { SimpleAccount } from "userop/dist/preset/builder";

import { STACKUP_API_KEY, USDC_TOKEN_ADDRESS } from "@constants";
import { PAYMASTER_URL } from "@modules/peanut/constants";

interface IStackupProvider {
  address: string;
  client: Client;
  signer: ethers.Signer;
  simpleAccount: SimpleAccount;
  provider: ethers.providers.JsonRpcProvider;
}

const StackupContext = React.createContext<IStackupProvider>({
  client: {} as Client,
  signer: {} as ethers.Signer,
  simpleAccount: {} as SimpleAccount,
  address: ethers.constants.AddressZero,
  provider: {} as ethers.providers.JsonRpcProvider,
});

export const useStackup = () => React.useContext<IStackupProvider>(StackupContext);

export const FLAT_FEE_AMOUNT = ethers.utils.parseEther(process.env.REACT_APP_FLAT_FEE_AMOUNT!);
export const FLAT_FEE_RECIPIENT = ethers.utils.getAddress(process.env.REACT_APP_FLAT_FEE_RECIPIENT!);

const config = {
  rpcUrl: `https://api.stackup.sh/v1/node/${STACKUP_API_KEY}`,
  entryPoint: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  simpleAccountFactory: "0x9406Cc6185a346906296840746125a0E44976454",
  paymaster: {
    eco: {
      rpcUrl: PAYMASTER_URL,
      context: { type: "flat" },
    },
    usdc: {
      rpcUrl: `https://api.stackup.sh/v1/paymaster/${STACKUP_API_KEY}`,
      context: { type: "erc20token", token: USDC_TOKEN_ADDRESS },
    },
  },
};

interface StackupProviderProps {
  signer: ethers.Signer;
  provider: ethers.providers.JsonRpcProvider;
}

export const VERIFYING_PAYMASTER_ECO = Presets.Middleware.verifyingPaymaster(
  config.paymaster.eco.rpcUrl,
  config.paymaster.eco.context,
);
export const VERIFYING_PAYMASTER_USDC = Presets.Middleware.verifyingPaymaster(
  config.paymaster.usdc.rpcUrl,
  config.paymaster.usdc.context,
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
      } catch (err) {
        console.error("error creating simple account", err);
      }
    })();
  }, [signer]);

  useEffect(() => {
    (async () => {
      // Init Client
      try {
        const client = await Client.init(config.rpcUrl, config.entryPoint);
        setClient(client);
      } catch (err) {
        console.error("error initializing client", err);
      }
    })();
  }, [signer]);

  const address = simpleAccount?.getSender();

  if (!address || !simpleAccount || !client) return null;

  return (
    <StackupContext.Provider
      value={{
        signer,
        client,
        address,
        provider,
        simpleAccount,
      }}
    >
      {children}
    </StackupContext.Provider>
  );
};
