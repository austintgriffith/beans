import React from "react";
import { Skeleton, Typography } from "antd";
import { formatTokenAmount } from "@helpers";

interface TokenFeeProps {
  fee?: number | string;
}

export const TokenFee: React.FC<TokenFeeProps> = ({ fee }) => {
  return (
    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
      <Typography.Text>
        <b>Expected Fee: </b>
        {fee ? (
          `~${formatTokenAmount(fee, 2)} ECO`
        ) : (
          <Skeleton.Input active size="small" style={{ width: 80, minWidth: 80 }} />
        )}
      </Typography.Text>
    </div>
  );
};
