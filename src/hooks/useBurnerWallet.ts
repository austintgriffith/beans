import { ethers } from "ethers";
import { useBurnerSigner } from "eth-hooks";
import { useState, useEffect } from "react";

export const useBurnerWallet = (provider: ethers.providers.JsonRpcProvider): ethers.Signer | undefined => {
  const [signer, setSigner] = useState<ethers.Signer>();

  const { signer: burnerSigner, loadOrGenerateBurner } = useBurnerSigner(provider);

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
      return burnerSigner;
    };
    setSigner(getSigner());
  }, [burnerSigner]);

  return signer;
};
