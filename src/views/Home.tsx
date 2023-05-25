import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useContractReader } from "eth-hooks";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, FloatButton, Input, InputProps, Skeleton, Space, Typography } from "antd";
import { ScanOutlined, SendOutlined } from "@ant-design/icons";

import { useEcoPrice } from "@hooks";
import { ERC20_ABI } from "@assets/abis";
import { formatAmount, round } from "@helpers";
import { ECO_TOKEN_ADDRESS, INetwork } from "@constants";

import AddressInput from "@components/AddressInput";
import QRPunkBlockie from "@components/QRPunkBlockie";
import { useStackup } from "@contexts/StackupContext";

import { ReactComponent as EcoLogo } from "@assets/images/eco-logo.svg";

function getTotal(amount: string) {
  try {
    return formatAmount(amount).abs();
  } catch (e) {
    return ethers.constants.Zero;
  }
}

let scanner: (show: boolean) => void;

interface HomeProps {
  network: INetwork;
  provider: ethers.providers.JsonRpcProvider;
}

export const Home: React.FC<HomeProps> = ({ network, provider }) => {
  const stackup = useStackup();
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [lastTx, setLastTx] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: ecoPrice } = useEcoPrice();

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
    setLastTx("");
    const value = formatAmount(amount);
    try {
      const txHash = await stackup.transfer(toAddress, value);
      setAmount("");
      setLastTx(txHash);
    } catch (e) {
      console.log("[gasless:transfer]", e);
    } finally {
      setLoading(false);
    }
  };

  const handleKey: InputProps["onKeyUp"] = event => {
    if (event.key === "Enter") doSend();
  };

  const address = stackup.simpleAccount?.getSender();
  const eco = useMemo(() => new ethers.Contract(ECO_TOKEN_ADDRESS, ERC20_ABI, provider), [provider]);
  const [balance] = useContractReader(eco, eco.balanceOf, [address], {});

  const total = getTotal(amount);
  const tokensFee = ecoPrice && (Number(stackup.expectedGasFee.toBigInt()) / 1e18) * (1 / ecoPrice);
  const exceedsBalance = total.add(ethers.utils.parseEther(tokensFee.toString())).gt(balance || ethers.constants.Zero);
  const disabled = exceedsBalance || loading || !amount || !toAddress;

  return (
    <Space direction="vertical" size="large" style={{ marginTop: 24 }}>
      <Space.Compact direction="horizontal" style={{ gap: 8, alignItems: "center" }}>
        <EcoLogo style={{ width: 28, height: 28 }} />
        <Typography.Title level={2} style={{ margin: 0 }}>
          {balance ? round(parseFloat(ethers.utils.formatEther(balance)), 3) : "---"}
        </Typography.Title>
      </Space.Compact>

      <QRPunkBlockie address={address} />

      <AddressInput
        placeholder="to address"
        value={toAddress}
        onChange={setToAddress}
        hoistScanner={toggle => (scanner = toggle)}
      />
      <Input
        type="number"
        min="0"
        pattern="\d*"
        placeholder="amount to send"
        value={amount}
        onKeyPress={handleKey}
        onChange={e => setAmount(e.target.value)}
        prefix={<EcoLogo style={{ width: 20, height: 20 }} />}
        style={{
          fontSize: 20,
          fontFamily: "'Rubik', sans-serif",
        }}
      />
      <Typography.Text>
        <b>Expected Fee: </b>
        {tokensFee ? (
          `~${round(tokensFee, 2)} ECO`
        ) : (
          <Skeleton.Input active size="small" style={{ width: 80, minWidth: 80 }} />
        )}
      </Typography.Text>
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

        {loading ? (
          <span style={{ color: "#06153c" }}>Transferring tokens...</span>
        ) : lastTx ? (
          <span style={{ color: "rgb(0,200,0)" }}>
            Gasless transfer executed -{" "}
            <a target="_blank" rel="noreferrer" href={`${network.blockExplorer}/tx/${lastTx}`}>
              transaction
            </a>
          </span>
        ) : null}
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
