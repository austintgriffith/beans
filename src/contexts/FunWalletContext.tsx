import React, { useContext, useEffect, useState } from "react";

import { ENTRY_POINT_ADDRESS, SIMPLE_ACCOUNT_FACTORY_ADDRESS } from "@constants";
import { FunSimpleAccount } from "@modules/fun/FunSimpleAccount";
import { ethers } from "ethers";
import { Presets, UserOperationMiddlewareFn } from "userop";

interface IFunWalletProvider {
  address: string;
  wallet: FunSimpleAccount;
  signer: ethers.Wallet;
  provider: ethers.providers.JsonRpcProvider;
}

const FunWalletContext = React.createContext<IFunWalletProvider>({
  address: "0x0000000000000000000000000000000000000000",
  wallet: {} as FunSimpleAccount,
  signer: {} as ethers.Wallet,
  provider: {} as ethers.providers.JsonRpcProvider,
});

interface FunWalletProviderProps {
  signer: ethers.Wallet;
  provider: ethers.providers.JsonRpcProvider;
}

export const getSimpleAccount = (
  signer: ethers.Signer,
  provider: ethers.providers.JsonRpcProvider,
  paymaster?: UserOperationMiddlewareFn,
) => {
  return Presets.Builder.SimpleAccount.init(
    signer,
    provider.connection.url,
    ENTRY_POINT_ADDRESS,
    SIMPLE_ACCOUNT_FACTORY_ADDRESS,
    paymaster,
  );
};

export const useFunWallet = () => useContext(FunWalletContext);

export const FunWalletProvider: React.FC<React.PropsWithChildren<FunWalletProviderProps>> = ({
  children,
  provider,
  signer,
}) => {
  const [wallet, setWallet] = useState<FunSimpleAccount | undefined>();
  const [address, setAddress] = useState<string | undefined>();

  useEffect(() => {
    (async () => {
      try {
        const _wallet = new FunSimpleAccount({ uniqueId: signer.privateKey });
        setWallet(_wallet);
        setAddress(await _wallet.getAddress());
      } catch (err) {
        console.error("error creating simple account", err);
      }
    })();
  }, [signer.privateKey]);

  if (!address || !wallet) return null;

  return (
    <FunWalletContext.Provider
      value={{
        address,
        wallet,
        signer,
        provider,
      }}
    >
      {children}
    </FunWalletContext.Provider>
  );
};
