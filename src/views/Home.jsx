import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { Button, Input, Space } from "antd";
import { useContractReader } from "eth-hooks";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CaretUpOutlined, ScanOutlined, SendOutlined } from "@ant-design/icons";

import AddressInput from "../components/AddressInput";
import QRPunkBlockie from "../components/QRPunkBlockie";
import { formatAmount, round } from "../helpers";
import { useStackup } from "../contexts/StackupContext";

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const REACT_APP_ECO_TOKEN_ADDRESS = process.env.REACT_APP_ECO_TOKEN_ADDRESS;

function getTotal(amount) {
  try {
    return formatAmount(amount).abs();
  } catch (e) {
    return ethers.constants.Zero;
  }
}

function Home({ network, signer, provider }) {
  const navigate = useNavigate();

  const eco = useMemo(() => new ethers.Contract(REACT_APP_ECO_TOKEN_ADDRESS, ERC20_ABI, signer), [signer]);

  const stackup = useStackup();

  const address = stackup.simpleAccount?.getSender();

  const [balance] = useContractReader(eco, eco.balanceOf, [address], 4000);

  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState("");

  const [amount, setAmount] = useState();
  const [toAddress, setToAddress] = useState();

  let scanner;

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

  const total = getTotal(amount);
  const exceedsBalance = total.gt(balance || ethers.constants.Zero);

  const disabled = exceedsBalance || loading || !amount || !toAddress;

  return (
    <Space direction="vertical" style={{ marginTop: 24 }}>
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
        <span style={{ fontSize: 36, letterSpacing: 0 }}>ⓔ</span>
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
        <QRPunkBlockie withQr address={address} />
      </div>

      <div style={{ margin: "auto", marginTop: 32, width: 300 }}>
        <AddressInput
          placeholder="to address"
          value={toAddress}
          onChange={setToAddress}
          ensProvider={provider}
          hoistScanner={toggle => (scanner = toggle)}
        />
      </div>
      <div style={{ margin: "auto", marginTop: 32, width: 300 }}>
        <Input
          size="large"
          type="number"
          min="0"
          pattern="\d*"
          prefix="ⓔ"
          placeholder="amount to send"
          value={amount}
          style={{
            fontSize: 20,
            width: 300,
            fontFamily: "'Rubik', sans-serif",
          }}
          onChange={e => setAmount(e.target.value)}
          onKeyPress={handleKey}
        />
      </div>

      <span style={{ color: "#06153c" }}>
        <b>Note:</b> minimun fee is 5 ECO tokens
      </span>

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
          marginTop: 32,
          width: 500,
        }}
      >
        <Button
          key="submit"
          size="large"
          disabled={disabled}
          loading={loading}
          onClick={doSend}
          style={{
            marginTop: 8,
            ...(disabled ? {} : { color: "white", backgroundColor: "#06153c" }),
          }}
        >
          {loading || !amount || !toAddress ? <CaretUpOutlined /> : <SendOutlined style={{ color: "#FFFFFF" }} />}
          <span
            style={{
              fontFamily: "romana",
              paddingLeft: 20,
              paddingRight: 20,
            }}
          >
            Send
          </span>
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

        <div
          style={{
            transform: "scale(2.5)",
            transformOrigin: "70% 80%",
            position: "fixed",
            textAlign: "right",
            right: 16,
            bottom: 16,
            padding: 10,
            zIndex: 257,
          }}
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            onClick={() => scanner(true)}
            style={{ zIndex: 257, border: 0, backgroundColor: "#021540" }}
          >
            <ScanOutlined style={{ color: "#FFFFFF" }} />
          </Button>
        </div>
      </div>
    </Space>
  );
}

export default Home;
