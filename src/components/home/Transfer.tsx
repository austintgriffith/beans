import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ethers } from "ethers";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ScanOutlined, SendOutlined } from "@ant-design/icons";
import { Alert, Button, FloatButton, Input, InputProps, Space, Typography } from "antd";

import { useAlert } from "@hooks/useAlert";
import { useFunTokenTransfer } from "@hooks/useFunTokenTransfer";
import { FeeOperation, useOperationFee } from "@hooks/useOperationFee";
import { useStackup } from "@contexts/StackupContext";
import { blockExplorerLink, convertAmount, formatTokenAmount } from "@helpers";

// Components
import { Address } from "@components";
import { TokenIcon } from "@components/token";
import { TokenFee } from "@components/commons/TokenFee";
import { AddressInput } from "@components/AddressInput";
import { useCurrentToken } from "@components/home/context/TokenContext";
import { getTokenInfo } from "@constants";

function getTotal(amount: string, decimals: number) {
  try {
    return convertAmount(amount, decimals).abs();
  } catch (e) {
    return ethers.constants.Zero;
  }
}

let scanner: (show: boolean) => void;

export const Transfer: React.FC = () => {
  const navigate = useNavigate();
  const { provider } = useStackup();
  const { token: tokenId, balance } = useCurrentToken();
  const { transfer } = useFunTokenTransfer(tokenId);
  const token = getTokenInfo(tokenId);

  const { data: fee } = useOperationFee(tokenId, FeeOperation.Transfer);

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toAddress, setToAddress] = useState("");

  const [alertApi, alertElem] = useAlert({ className: "transfer-alert" });

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const _address = searchParams.get("addr");
    if (_address) {
      setToAddress(_address);
      navigate("/");
    }
  }, [navigate, searchParams]);

  const doSend = async () => {
    if (!fee) return;
    setLoading(true);
    alertApi.clear();
    const value = convertAmount(amount, token.decimals);
    try {
      const txHash = await transfer(toAddress, value, fee);

      alertApi.success({
        message: "Transfer Executed!",
        description: (
          <>
            You have sent{" "}
            <b>
              {formatTokenAmount(ethers.utils.formatUnits(value, token.decimals), 3)} {token.name}
            </b>{" "}
            tokens to <Address provider={provider} address={toAddress} style={{ fontWeight: "bold" }} />.<br />
            <Typography.Link href={blockExplorerLink(txHash)} target="_blank">
              See transaction.
            </Typography.Link>
          </>
        ),
      });

      setAmount("");
    } catch (e) {
      console.log("[gasless:transfer]", e);
      alertApi.error({
        message: "Transfer failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey: InputProps["onKeyUp"] = event => {
    if (event.key === "Enter") doSend();
  };

  const total = getTotal(amount, token.decimals);
  const exceedsBalance = total.add(fee || ethers.constants.Zero).gt(balance || ethers.constants.Zero);
  const disabled = exceedsBalance || loading || !amount || !toAddress;

  return (
    <>
      <Space direction="vertical" size="large" align="center" style={{ width: "100%" }}>
        <AddressInput
          data-cy="transfer-input-recipient"
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
          data-cy="transfer-input-amount"
          placeholder="amount to send"
          value={amount}
          onKeyPress={handleKey}
          style={{ width: 320 }}
          onChange={e => setAmount(e.target.value)}
          prefix={<TokenIcon token={tokenId} style={{ width: 20, height: 20 }} />}
        />
        <TokenFee token={tokenId} fee={fee} />
        {exceedsBalance && amount && !loading ? (
          <Alert
            showIcon
            type="error"
            style={{ marginTop: 8 }}
            message={<span data-cy="transfer-insufficient-funds">Transfer amount plus fee charge exceeds balance</span>}
          />
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
            data-cy="transfer-send-btn"
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
        {alertElem}
      </Space>

      {createPortal(
        <FloatButton
          type="primary"
          shape="circle"
          onClick={() => scanner(true)}
          icon={<ScanOutlined />}
          style={{ transform: "scale(2)", right: 48 }}
        />,
        document.body,
      )}
    </>
  );
};
