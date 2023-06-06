import { useEffect, useState } from "react";
import { ethers } from "ethers";

const createProvider = async (rpcUrl: string, chainId: string | number) => {
  const p = new ethers.providers.StaticJsonRpcProvider(rpcUrl, chainId);
  await p.ready;
  return p;
};

export default function useStaticJsonRPC(rpcUrl: string, chainId: string | number) {
  const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider>();

  useEffect(() => {
    (async () => {
      try {
        const p = await createProvider(rpcUrl, chainId);
        setProvider(p);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [rpcUrl, chainId]);

  return provider;
}
