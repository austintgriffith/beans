import React, { useMemo, useState } from "react";
import { ethers } from "ethers";
import { Alert, Button, notification, Space, Typography } from "antd";
import { ArrowDownOutlined, SwapOutlined } from "@ant-design/icons";

import { USDC_TOKEN_ADDRESS } from "@constants";
import { useContractReader } from "eth-hooks";
import { useStackup } from "@contexts/StackupContext";
import { blockExplorerLink, convertTokenAmount, formatTokenAmount } from "@helpers";
import { useUniPool } from "@hooks/useUniPool";
import { useQuery } from "react-query";
import { ERC20__factory } from "@assets/contracts";

interface SwapProps {
  provider: ethers.providers.JsonRpcProvider;
}

const { Title } = Typography;

// 5 USDC tokens
const MINIMUM_AMOUNT = ethers.utils.parseUnits("5", 6);

export const Swap: React.FC<SwapProps> = ({ provider }) => {
  const { address } = useStackup();

  const [loading, setLoading] = useState(false);
  const { execute, getOutputQuote, simulateSwap } = useUniPool(provider);

  const [notificationApi, notificationElemt] = notification.useNotification();

  const usdc = useMemo(() => ERC20__factory.connect(USDC_TOKEN_ADDRESS, provider), [provider]);
  const usdcBalanceOfResult = useContractReader(usdc, usdc.balanceOf, [address], {}, { blockNumberInterval: 1 });
  const usdcBalance = usdcBalanceOfResult[0] || ethers.constants.Zero;

  const insufficientFunds = usdcBalance.lt(MINIMUM_AMOUNT);

  const { data: expectedFee = ethers.constants.Zero, isError } = useQuery<unknown, unknown, ethers.BigNumber>(
    "expected-fee",
    () => simulateSwap(ethers.utils.parseUnits("0.01", 6)),
    {
      retry: false,
      enabled: !insufficientFunds,
    },
  );

  const availableAmount = usdcBalance.sub(expectedFee);

  const {
    data: amountOut,
    isLoading,
    isRefetching,
  } = useQuery(["quote-out", availableAmount.toString()], () => getOutputQuote(availableAmount), {
    enabled:
      !!usdcBalanceOfResult[0] &&
      !insufficientFunds &&
      usdcBalance.gt(expectedFee) &&
      (!expectedFee.isZero() || isError),
    refetchInterval: loading ? undefined : 20000,
    refetchOnWindowFocus: false,
  });

  const disabled = !amountOut || isLoading || isRefetching;

  const swap = async () => {
    setLoading(true);
    try {
      const txHash = await execute(availableAmount);
      notificationApi.success({
        placement: "topRight",
        message: "Swap Executed!",
        duration: 15000,
        description: (
          <>
            {formatTokenAmount(ethers.utils.formatUnits(availableAmount, 6), 2)} USDC tokens swapped for{" "}
            {formatTokenAmount(ethers.utils.formatUnits(amountOut!, 18), 3)} ECO tokens. <br />
            <Typography.Link href={blockExplorerLink(txHash)} target="_blank">
              See transaction
            </Typography.Link>
          </>
        ),
      });
    } catch (err) {
      console.log("swap failed", err);
      notificationApi.error({
        placement: "topRight",
        message: "Swap Failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space
      direction="vertical"
      size="large"
      style={{
        marginTop: 24,
        minWidth: 400,
        borderRadius: 8,
        padding: "24px 32px",
        maxWidth: 420,
        border: "1px solid rgba(180, 180, 180, .6)",
      }}
      align="center"
    >
      <Space direction="vertical" align="center">
        <Space direction="horizontal" align="center">
          <img alt="usdc" src="https://s3.amazonaws.com/usdcfaucet.com/USDC.png" style={{ width: 32, height: 32 }} />
          <Title style={{ margin: 0 }}>
            {usdcBalance ? formatTokenAmount(convertTokenAmount(usdcBalance, 6)) : "---"}
          </Title>
        </Space>

        <ArrowDownOutlined style={{ fontSize: 24 }} />

        <Space direction="horizontal" align="center">
          <img alt="eco" src="./ECO_square.png" style={{ width: 32, height: 32, borderRadius: 16 }} />
          <Title style={{ margin: 0 }}>
            {disabled || !amountOut ? "---" : formatTokenAmount(convertTokenAmount(amountOut, 18))}
          </Title>
        </Space>
      </Space>

      <Button
        block
        type="primary"
        loading={loading}
        disabled={disabled || loading}
        icon={<SwapOutlined />}
        onClick={swap}
      >
        Swap
      </Button>

      <Typography.Text style={{ margin: "0 auto" }}>
        <b>Fee: </b> {!expectedFee.isZero() ? ethers.utils.formatUnits(expectedFee, 6) + " USDC" : "---"}
      </Typography.Text>

      {notificationElemt}

      {usdcBalanceOfResult[2] !== "loading" && insufficientFunds ? (
        <Alert
          showIcon
          type="warning"
          message="Insufficient Funds"
          description={
            <>
              To swap USDC tokens for ECO tokens you need a minimum of <b>5 USDC</b> tokens in your wallet.
            </>
          }
        />
      ) : null}
    </Space>
  );
};
