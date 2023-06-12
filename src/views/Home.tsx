import React from "react";
import { ethers } from "ethers";
import { Segmented, Skeleton, Space, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import { QRPunkBlockie } from "@components";
import { Segments } from "@components/home";
import { TokenIcon } from "@components/token";
import { TokenContext } from "@components/home/context/TokenContext";

import { getTokenInfo, Token } from "@constants";
import { formatTokenAmount } from "@helpers";
import { useBalance } from "@hooks/useBalance";
import { useStackup } from "@contexts/StackupContext";

interface HomeProps {
  token: Token;
}

const TokenBalance: React.FC<{ decimals: number; balance?: ethers.BigNumber; icon?: React.ReactNode }> = ({
  icon,
  decimals,
  balance,
}) => {
  return (
    <Space.Compact direction="horizontal" style={{ alignItems: "center", gap: 8 }}>
      {icon}
      {balance ? (
        <Typography.Title data-cy="home-balance" level={2} style={{ margin: 0 }}>
          {formatTokenAmount(parseFloat(ethers.utils.formatUnits(balance, decimals)), 3)}
        </Typography.Title>
      ) : (
        <Skeleton.Input />
      )}
    </Space.Compact>
  );
};

export const Home: React.FC<HomeProps> = ({ token }) => {
  const navigate = useNavigate();
  const { address } = useStackup();
  const { balance } = useBalance(token, address);
  const { decimals } = getTokenInfo(token);

  const changeToken = (token: Token) => navigate(`/t/${token}`, { state: { redirect: true } });

  return (
    <TokenContext.Provider value={{ token, balance }}>
      <Space direction="vertical" align="center" size="large" style={{ width: "100%" }}>
        <Segmented
          value={token}
          className="tokens-segment"
          onChange={token => changeToken(token as Token)}
          style={{ width: "fit-content", margin: "0 auto" }}
          options={[
            {
              value: Token.ECO,
              icon: <TokenIcon token={Token.ECO} style={{ width: 16, height: 16 }} />,
            },
            {
              value: Token.USDC,
              icon: <TokenIcon token={Token.USDC} style={{ width: 16, height: 16 }} />,
            },
          ]}
        />

        <TokenBalance
          balance={balance}
          decimals={decimals}
          icon={<TokenIcon token={token} style={{ width: 28, height: 28 }} />}
        />

        <Space direction="vertical" size="large">
          <QRPunkBlockie address={address} />
          <Segments />
        </Space>
      </Space>
    </TokenContext.Provider>
  );
};
