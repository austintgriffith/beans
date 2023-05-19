import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import Wallet from "./Wallet";

interface AccountProps {
  signer: ethers.Wallet;
  provider: ethers.providers.Provider;
}

export const Account: React.FC<AccountProps> = ({ signer, provider }) => {
  const [address, setAddress] = useState<string>();

  useEffect(() => {
    signer
      ?.getAddress()
      .then(address => address && setAddress(address))
      .catch(console.error);
  }, [signer]);

  if (!address) return null;
  return <Wallet padding="0px" color="#06153c" address={address} signer={signer} provider={provider} size={24} />;
};

export default Account;
