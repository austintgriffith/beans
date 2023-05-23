import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useBurnerSigner } from "eth-hooks";

export const useBurnerWallet = (provider?: ethers.providers.JsonRpcProvider): ethers.Wallet | undefined => {
  const { signer: burnerSigner, loadOrGenerateBurner } = useBurnerSigner(provider);

  const [signer, setSigner] = useState<ethers.Wallet>();

  useEffect(() => {
    if (!signer && provider) loadOrGenerateBurner();
  }, [loadOrGenerateBurner, provider, signer]);

  useEffect(() => {
    const getSigner = () => {
      const storedPK = window.localStorage.getItem("metaPrivateKey");
      if (storedPK) {
        try {
          return new ethers.Wallet(storedPK);
        } catch (e) {
          console.warn("stored PK is invalid, using new burner wallet");
        }
      }
      return burnerSigner as ethers.Wallet;
    };
    setSigner(getSigner());
  }, [burnerSigner]);

  return signer;
};
