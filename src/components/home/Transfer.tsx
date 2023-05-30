import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, FloatButton, Input, InputProps, notification, Space, Typography } from "antd";
import { ScanOutlined, SendOutlined } from "@ant-design/icons";

import { Address } from "@components";
import { useTokenPrice } from "@hooks";
import { useStackup } from "@contexts/StackupContext";
import { AddressInput } from "@components/AddressInput";
import { blockExplorerLink, convertAmount, formatTokenAmount } from "@helpers";

import { ReactComponent as EcoLogo } from "@assets/images/eco-logo.svg";
import { TokenFee } from "@components/commons/TokenFee";
import { useEcoTransfer } from "@hooks/useEcoTransfer";

function getTotal(amount: string) {
  try {
    return convertAmount(amount).abs();
  } catch (e) {
    return ethers.constants.Zero;
  }
}

interface TransferProps {
  balance?: ethers.BigNumber;
}

let scanner: (show: boolean) => void;

export const Transfer: React.FC<TransferProps> = ({ balance }) => {
  const navigate = useNavigate();
  const { provider } = useStackup();
  const { transfer, expectedGasFee } = useEcoTransfer();

  const { data: ecoPrice = 0 } = useTokenPrice("eco");

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toAddress, setToAddress] = useState("");

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const _address = searchParams.get("addr");
    if (_address) {
      setToAddress(_address);
      navigate("/");
    }
  }, [navigate, searchParams]);

  const doSend = async () => {
    setLoading(true);
    const value = convertAmount(amount);
    try {
      const txHash = await transfer(toAddress, value);

      notification.success({
        placement: "topRight",
        message: "Transfer Executed!",
        duration: 10000,
        description: (
          <>
            You have sent <b>{formatTokenAmount(ethers.utils.formatUnits(value, 18), 3)} ECO</b> tokens to{" "}
            <Address provider={provider} address={toAddress} style={{ fontWeight: "bold" }} />.<br />
            <Typography.Link href={blockExplorerLink(txHash)} target="_blank">
              See transaction.
            </Typography.Link>
          </>
        ),
      });

      setAmount("");
    } catch (e) {
      console.log("[gasless:transfer]", e);
      notification.error({
        placement: "topRight",
        message: "Transfer failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey: InputProps["onKeyUp"] = event => {
    if (event.key === "Enter") doSend();
  };

  const total = getTotal(amount);
  const tokensFee = ecoPrice && (Number(expectedGasFee.toBigInt()) / 1e18) * (1 / ecoPrice);
  const exceedsBalance = total.add(ethers.utils.parseEther(tokensFee.toString())).gt(balance || ethers.constants.Zero);
  const disabled = exceedsBalance || loading || !amount || !toAddress;

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <AddressInput
        placeholder="to address"
        value={toAddress}
        onChange={setToAddress}
        hoistScanner={toggle => (scanner = toggle)}
      />
      <Input
        type="number"
        size="large"
        min="0"
        pattern="\d*"
        placeholder="amount to send"
        value={amount}
        onKeyPress={handleKey}
        style={{ width: 320 }}
        onChange={e => setAmount(e.target.value)}
        prefix={<EcoLogo style={{ width: 20, height: 20 }} />}
      />
      <TokenFee fee={tokensFee} />
      {exceedsBalance && amount ? (
        <div style={{ marginTop: 8 }}>
          <span style={{ color: "rgb(200,0,0)" }}>amount + fee exceeds balance</span>{" "}
        </div>
      ) : null}
      <div
        style={{
          gap: 8,
          margin: "auto",
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <Button
          key="submit"
          size="large"
          type="primary"
          onClick={doSend}
          loading={loading}
          disabled={disabled}
          icon={<SendOutlined />}
        >
          Send
        </Button>

        {loading ? <span style={{ color: "#06153c" }}>Transferring tokens...</span> : null}
      </div>

      <FloatButton
        type="primary"
        shape="circle"
        onClick={() => scanner(true)}
        icon={<ScanOutlined />}
        style={{ transform: "scale(2)", right: 48 }}
      />
    </Space>
  );
};
