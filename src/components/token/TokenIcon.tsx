import React, { CSSProperties } from "react";

import { Token } from "@constants";

import { ReactComponent as EcoLogo } from "@assets/images/eco-logo.svg";

export const TokenIcon: React.FC<{ token: Token; style?: CSSProperties }> = ({ token, style }) => {
  if (token === Token.USDC)
    return <img alt="usdc" src="https://s3.amazonaws.com/usdcfaucet.com/USDC.png" style={style} />;
  return <EcoLogo style={style} />;
};
