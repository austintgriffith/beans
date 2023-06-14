import React from "react";
import { ethers } from "ethers";
import { Skeleton, Typography } from "antd";

import { formatTokenAmount } from "@helpers";
import { getTokenInfo, Token } from "@constants";

interface TokenFeeProps {
  token: Token;
  fee?: ethers.BigNumber;
}

export const TokenFee: React.FC<TokenFeeProps> = ({ token: tokenId, fee }) => {
  const token = getTokenInfo(tokenId);
  const shownDecimals = token.id === Token.USDC ? 3 : 2;

  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
      <Typography.Text>
        <b>Expected Fee: </b>
        {fee ? (
          `${formatTokenAmount(ethers.utils.formatUnits(fee, token.decimals), shownDecimals)} ${token.name}`
        ) : (
          <Skeleton.Input active size="small" style={{ width: 80, minWidth: 80 }} />
        )}
      </Typography.Text>
    </div>
  );
};
