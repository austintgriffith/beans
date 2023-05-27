import React from "react";
import { ethers } from "ethers";

import Wallet from "./Wallet";
import { useStackup } from "@contexts/StackupContext";

interface AccountProps {
  signer: ethers.Wallet;
  provider: ethers.providers.JsonRpcProvider;
}

export const Account: React.FC<AccountProps> = ({ signer, provider }) => {
  const { address } = useStackup();
  return <Wallet padding="0px" color="#06153c" address={address} signer={signer} provider={provider} size={24} />;
};
