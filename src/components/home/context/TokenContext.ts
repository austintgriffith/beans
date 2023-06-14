import React, { useContext } from "react";
import { Token } from "@constants";
import { ethers } from "ethers";

export const TokenContext = React.createContext<{ token: Token; balance: ethers.BigNumber }>({
  token: Token.ECO,
  balance: ethers.constants.Zero,
});
export const useCurrentToken = () => useContext(TokenContext);
