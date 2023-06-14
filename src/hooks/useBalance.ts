import { useMemo } from "react";
import { useContractReader } from "eth-hooks";
import { BigNumber } from "ethers";

import { useProvider } from "@contexts/StackupContext";
import { ERC20__factory } from "@assets/contracts";
import { getTokenInfo, Token } from "@constants";

export const useBalance = (token: Token, address: string) => {
  const provider = useProvider();
  const tokenContract = useMemo(() => ERC20__factory.connect(getTokenInfo(token).address, provider), [token, provider]);
  const [balance, , status] = useContractReader(
    tokenContract,
    tokenContract.balanceOf,
    [address],
    {},
    { blockNumberInterval: 1 },
  );
  return { balance: balance as BigNumber, status };
};
