import { CaretUpOutlined, ScanOutlined, SendOutlined } from "@ant-design/icons";
import { useContractReader } from "eth-hooks";
import { ethers } from "ethers";
import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { Button, Input } from "antd";

import AddressInput from "../components/AddressInput";
import QRPunkBlockie from "../components/QRPunkBlockie";
import { useGasless } from "../hooks/useGasless";

const ERC20_ABI = ["function balanceOf(address owner) view returns (uint256)"];
const REACT_APP_ECO_TOKEN_ADDRESS = process.env.REACT_APP_ECO_TOKEN_ADDRESS;

function round(number, decimals) {
  const d = Math.pow(10, decimals);
  return Math.round((number + Number.EPSILON) * d) / d;
}

const explorer = process.env.REACT_APP_NETWORK === "goerli" ? "https://goerli.etherscan.io" : "https://etherscan.io";

/*
/**
 * web3 props can be passed from '../App.jsx' into your local view component for use
 * @param {*} yourLocalBalance balance on current network
 * @param {*} readContracts contracts from current chain already pre-loaded using ethers contract module. More here https://docs.ethers.io/v5/api/contract/contract/
 * @returns react component
 **/
function Home({ userSigner, address, mainnetProvider, selectedChainId, tx, writeContracts }) {
  let history = useHistory();

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

  const [toAddress, setToAddress] = useState();
  const [amount, setAmount] = useState();

  let scanner;

  let params = useParams();
  useEffect(() => {
    if (params.address) {
      setToAddress(params.address);
      history.push("/");
    }
  }, [params.address]);

  const doSend = async () => {
    setLoading(true);

    let value;
    try {
      console.log("PARSE ETHER", amount);
      value = ethers.utils.parseEther("" + amount);
      console.log("PARSEDVALUE", value);
    } catch (e) {
      const floatVal = parseFloat(amount).toFixed(8);
      console.log("floatVal", floatVal);
      // failed to parseEther, try something else
      value = ethers.utils.parseEther("" + floatVal);
      console.log("PARSEDfloatVALUE", value);
    }

    // setToAddress("")
    try {
      await gasless.transfer(toAddress, value);
      setAmount("");
      setLoading(false);
      window.scrollTo(0, 0);
    } catch (e) {
      console.log("[gasless:transfer]", e);
    }
  };

  const handleKey = event => {
    console.log("ENTER", event);
    if (event.key === "Enter") {
      doSend();
    }
  };

  const disabled = loading || !amount || !toAddress;

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
        <span style={{ fontSize: 32, letterSpacing: 0 }}>ⓔ</span>
        {balance ? round(parseFloat(ethers.utils.formatEther(balance)), 4).toFixed(4) : "---"}
      </div>

      <div style={{ margin: "auto", position: "relative", backgroundColor: "#ffffff", padding: 8, width: 400 }}>
        <QRPunkBlockie withQr={true} address={address} />
        {/*<Address address={address} ensProvider={mainnetProvider} hideBlockie={true} fontSize={18} />*/}
      </div>

      <div style={{ margin: "auto", marginTop: 32, width: 300 }}>
        <AddressInput
          placeholder="to address"
          value={toAddress}
          onChange={setToAddress}
          ensProvider={mainnetProvider}
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
          style={{ fontSize: 20, width: 300, fontFamily: "'Rubik', sans-serif" }}
          onChange={e => setAmount(e.target.value)}
          onKeyPress={handleKey}
        />
      </div>
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
          style={{ marginTop: 8, ...(disabled ? {} : { color: "white", backgroundColor: "#021441" }) }}
        >
          {loading || !amount || !toAddress ? <CaretUpOutlined /> : <SendOutlined style={{ color: "#FFFFFF" }} />} Send
        </Button>

        {gasless.enabling ? (
          <span style={{ color: "#021441" }}>Enabling gasless transactions...</span>
        ) : gasless.loading ? (
          <span style={{ color: "#021441" }}>Transfering tokens...</span>
        ) : null}
        {gasless.error ? <span style={{ color: "rgb(200,0,0)" }}>{gasless.error}</span> : null}
        {gasless.lastTx ? (
          <span style={{ color: "rgb(0,200,0)" }}>
            Gasless transfer executed -{" "}
            <a target="_blank" rel="noreferrer" href={`${explorer}/tx/${gasless.lastTx.transaction.hash}`}>
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
