import React, { useEffect, useMemo, useState } from "react";
import { Button, Input } from "antd";
import { CaretUpOutlined, ScanOutlined, SendOutlined } from "@ant-design/icons";
import { ethers } from "ethers";
import { useContractReader } from "eth-hooks";
import { useNavigate, useSearchParams } from "react-router-dom";

import AddressInput from "../components/AddressInput";
import QRPunkBlockie from "../components/QRPunkBlockie";
import { useGasless } from "../hooks";
import { formatAmount } from "../helpers/formatAmount";

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const REACT_APP_ECO_TOKEN_ADDRESS = process.env.REACT_APP_ECO_TOKEN_ADDRESS;

function round(number, decimals) {
  const d = Math.pow(10, decimals);
  return Math.round((number + Number.EPSILON) * d) / d;
}

function getTotal(amount, fee) {
  try {
    return formatAmount(amount).abs().add(formatAmount(fee).abs());
  } catch (e) {
    return ethers.constants.Zero;
  }
}

function Home({ network, userSigner, address, localProvider }) {
  const navigate = useNavigate();

  const readContracts = useMemo(
    () => ({
      ECO: new ethers.Contract(REACT_APP_ECO_TOKEN_ADDRESS, ERC20_ABI, userSigner),
    }),
    [userSigner],
  );

  // you can also use hooks locally in your component of choice
  // in this case, let's keep track of 'purpose' variable from our contract
  const balance = useContractReader(readContracts, "ECO", "balanceOf", [address], 4000);

  const [loading, setLoading] = useState(false);

  const gasless = useGasless(userSigner);

  const [fee, setFee] = useState("5");
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
    const value = formatAmount(amount);
    const feeValue = formatAmount(fee);
    try {
      await gasless.transfer(toAddress, value, feeValue);
      setAmount("");
    } catch (e) {
      console.log("[gasless:transfer]", e);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = event => {
    if (event.key === "Enter") doSend();
  };

  const total = getTotal(amount, fee);
  const exceedsBalance = total.gt(balance || ethers.constants.Zero);

  const disabled = exceedsBalance || loading || !amount || !toAddress;

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          margin: "auto",
          textAlign: "right",
          gap: 8,
          marginTop: 16,
          width: 500,
          fontFamily: "'Rubik', sans-serif",
          fontSize: 72,
          letterSpacing: -0.5,
        }}
      >
        <span style={{ fontSize: 60, letterSpacing: 0 }}>ⓔ</span>
        {balance ? round(parseFloat(ethers.utils.formatEther(balance)), 4).toFixed(4) : "---"}
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
          ensProvider={localProvider}
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
      <div style={{ margin: "auto", marginTop: 32, width: 300 }}>
        <Input
          size="large"
          type="number"
          min="5"
          pattern="\d*"
          prefix={<b style={{ fontSize: 16 }}>Fee</b>}
          placeholder="fee to pay"
          value={fee}
          style={{
            width: 300,
            fontSize: 20,
            fontFamily: "'Rubik', sans-serif",
          }}
          onChange={e => setFee(e.target.value)}
          onKeyPress={handleKey}
        />
      </div>

      <span style={{ color: "#06153c" }}>
        <b>Note:</b> minimun fee is 5 ECO tokens
      </span>

      {exceedsBalance ? (
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

        {gasless.enabling ? (
          <span style={{ color: "#06153c" }}>Enabling gasless transactions...</span>
        ) : gasless.loading ? (
          <span style={{ color: "#06153c" }}>Transferring tokens...</span>
        ) : null}
        {gasless.error ? <span style={{ color: "rgb(200,0,0)" }}>{gasless.error}</span> : null}
        {gasless.lastTx ? (
          <span style={{ color: "rgb(0,200,0)" }}>
            Gasless transfer executed -{" "}
            <a target="_blank" rel="noreferrer" href={`${network.blockExplorer}/tx/${gasless.lastTx.transaction.hash}`}>
              transaction
            </a>
          </span>
        ) : null}

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
    </div>
  );
}

export default Home;
