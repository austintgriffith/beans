import React, { useMemo, useState } from "react";
import { ethers } from "ethers";
import { useContractReader } from "eth-hooks";
import { Segmented, Skeleton, Space, Typography } from "antd";

import { QRPunkBlockie } from "@components";
import { Transfer } from "@components/home/Transfer";
import { formatTokenAmount } from "@helpers";
import { ECO_TOKEN_ADDRESS } from "@constants";
import { useStackup } from "@contexts/StackupContext";

import { ERC20__factory } from "@assets/contracts";
import { ReactComponent as EcoLogo } from "@assets/images/eco-logo.svg";
import { Share } from "@components/home/Share";
import { SendOutlined, ShareAltOutlined } from "@ant-design/icons";

enum Operation {
  Transfer,
  Share,
}

interface HomeProps {
  provider: ethers.providers.JsonRpcProvider;
}

export const Home: React.FC<HomeProps> = ({ provider }) => {
  const { address } = useStackup();

  const [operation, setOperation] = useState(Operation.Transfer);

  const eco = useMemo(() => ERC20__factory.connect(ECO_TOKEN_ADDRESS, provider), [provider]);
  const [balance] = useContractReader(eco, eco.balanceOf, [address], {}, { blockNumberInterval: 1 });

  const content = useMemo(() => {
    switch (operation) {
      case Operation.Transfer:
        return <Transfer balance={balance} />;
      case Operation.Share:
        return <Share balance={balance} />;
    }
  }, [balance, operation]);

  return (
    <Space direction="vertical" size="large" style={{ marginTop: 24 }}>
      <Space.Compact
        direction="horizontal"
        style={{ gap: 8, width: "100%", alignItems: "center", justifyContent: "center", minHeight: 38 }}
      >
        <EcoLogo style={{ width: 28, height: 28 }} />
        {balance ? (
          <Typography.Title data-cy="home-balance" level={2} style={{ margin: 0 }}>
            {formatTokenAmount(parseFloat(ethers.utils.formatEther(balance)), 3)}
          </Typography.Title>
        ) : (
          <Skeleton.Input />
        )}
      </Space.Compact>

      <QRPunkBlockie address={address} />

      <Space direction="vertical" align="center" style={{ width: "100%" }}>
        <Segmented
          data-cy="home-segments"
          onChange={value => setOperation(value as Operation)}
          options={[
            { icon: <SendOutlined />, value: Operation.Transfer, label: "Transfer" },
            { icon: <ShareAltOutlined />, value: Operation.Share, label: "Share" },
          ]}
        />
      </Space>

      {content}
    </Space>
  );
};
