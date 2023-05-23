import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { Button, FloatButton, Input, Skeleton, Space, Typography } from "antd";
import { useContractReader } from "eth-hooks";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ScanOutlined, SendOutlined } from "@ant-design/icons";

import { formatAmount, round } from "../helpers";
import AddressInput from "../components/AddressInput";
import QRPunkBlockie from "../components/QRPunkBlockie";
import { useStackup } from "../contexts/StackupContext";
import { ReactComponent as EcoLogo } from "../assets/images/eco-logo.svg";
import { useEcoPrice } from "../hooks";
import { ERC20_ABI } from "../assets/abis/ERC20";

const REACT_APP_ECO_TOKEN_ADDRESS = process.env.REACT_APP_ECO_TOKEN_ADDRESS;

function getTotal(amount) {
  try {
    return formatAmount(amount).abs();
  } catch (e) {
    return ethers.constants.Zero;
  }
}

let scanner;

function Home({ network, provider }) {
  const stackup = useStackup();
  const navigate = useNavigate();

  const [amount, setAmount] = useState();
  const [toAddress, setToAddress] = useState();
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

  const handleKey = event => {
    if (event.key === "Enter") doSend();
  };

  const address = stackup.simpleAccount?.getSender();
  const eco = useMemo(() => new ethers.Contract(REACT_APP_ECO_TOKEN_ADDRESS, ERC20_ABI, provider), [provider]);
  const [balance] = useContractReader(eco, eco.balanceOf, [address], 4000);

  const total = getTotal(amount);
  const tokensFee = ecoPrice && (Number(stackup.expectedGasFee.toBigInt()) / 1e18) * (1 / ecoPrice);
  const exceedsBalance = total.add(ethers.utils.parseEther(tokensFee.toString())).gt(balance || ethers.constants.Zero);
  const disabled = exceedsBalance || loading || !amount || !toAddress;

  return (
    <Space direction="vertical" size="large" style={{ marginTop: 24 }}>
      <Space direction="vertical">
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            margin: "auto",
            textAlign: "right",
            gap: 8,
            width: 500,
            fontFamily: "'Rubik', sans-serif",
            fontSize: 50,
            letterSpacing: -0.5,
          }}
        >
          <EcoLogo style={{ width: 28, height: 28 }} />
          {balance ? round(parseFloat(ethers.utils.formatEther(balance)), 3) : "---"}
        </div>

        <div
          style={{
            margin: "auto",
            position: "relative",
            backgroundColor: "#ffffff",
            padding: 8,
            width: 400,
          }}
        >
          <QRPunkBlockie address={address} />
        </div>
      </Space>
      <div style={{ margin: "auto", width: 300 }}>
        <AddressInput
          placeholder="to address"
          value={toAddress}
          onChange={setToAddress}
          hoistScanner={toggle => (scanner = toggle)}
        />
      </div>
      <div style={{ margin: "auto", width: 300 }}>
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
            width: 300,
            fontFamily: "'Rubik', sans-serif",
          }}
        />
      </div>
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
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          margin: "auto",
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
        {/*{gasless.error ? <span style={{ color: "rgb(200,0,0)" }}>{gasless.error}</span> : null}*/}
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
}

export default Home;
