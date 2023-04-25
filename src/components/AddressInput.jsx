import { Input } from "antd";
import React, { useCallback, useState } from "react";
import { ethers } from "ethers";
import { QrcodeOutlined } from "@ant-design/icons";
import { useLookupAddress } from "eth-hooks/dapps/ens";
import QrReader from "react-qr-reader";

const isENS = (address = "") => address.endsWith(".eth") || address.endsWith(".xyz");

// probably we need to change value={toAddress} to address={toAddress}

/**
 ~ What it does? ~

 Displays an address input with QR scan option

 ~ How can I use? ~

 <AddressInput
 autoFocus
 ensProvider={mainnetProvider}
 placeholder="Enter address"
 value={toAddress}
 onChange={setToAddress}
 />

 ~ Features ~

 - Provide ensProvider={mainnetProvider} and your address will be replaced by ENS name
 (ex. "0xa870" => "user.eth") or you can enter directly ENS name instead of address
 - Provide placeholder="Enter address" value for the input
 - Value of the address input is stored in value={toAddress}
 - Control input change by onChange={setToAddress}
 or onChange={address => { setToAddress(address);}}
 **/
export default function AddressInput(props) {
  const { ensProvider, onChange } = props;
  const [value, setValue] = useState(props.value);
  const [scan, setScan] = useState(false);

  const currentValue = typeof props.value !== "undefined" ? props.value : value;
  const ens = useLookupAddress(props.ensProvider, currentValue);

  const updateAddress = useCallback(
    async newValue => {
      if (typeof newValue !== "undefined") {
        let address = newValue;
        if (isENS(address)) {
          try {
            const possibleAddress = await ensProvider.resolveName(address);
            if (possibleAddress) {
              address = possibleAddress;
            }
            // eslint-disable-next-line no-empty
          } catch (e) {}
        }
        setValue(address);
        if (typeof onChange === "function") {
          onChange(address);
        }
      }
    },
    [ensProvider, onChange],
  );

  props &&
    props.hoistScanner &&
    props.hoistScanner(() => {
      setScan(!scan);
    });

  return (
    <>
      {scan ? (
        <div
          onClick={() => setScan(false)}
          style={{
            zIndex: 256,
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <QrReader
            delay={250}
            resolution={1200}
            style={{ width: "100%" }}
            onError={e => setScan(false)}
            onScan={newValue => {
              if (newValue) {
                newValue = newValue.replace("ethereum:", "");
                newValue = newValue.replace("eth:", "");
                newValue = newValue.replace("https://be4ns.com/", "");

                let possibleNewValue = newValue;
                if (possibleNewValue.indexOf("/") >= 0) {
                  possibleNewValue = possibleNewValue.substr(possibleNewValue.lastIndexOf("0x"));
                }
                setScan(false);
                updateAddress(possibleNewValue);
                window.scrollTo(0, 700);
              }
            }}
          />
        </div>
      ) : (
        ""
      )}
      <Input
        size="large"
        id="0xAddress"
        name="0xAddress"
        autoComplete="off"
        disabled={props.disabled}
        autoFocus={props.autoFocus}
        placeholder={props.placeholder ? props.placeholder : "address"}
        style={{ fontSize: 20, fontFamily: "'Rubik', sans-serif" }}
        value={ethers.utils.isAddress(currentValue) && !isENS(currentValue) && isENS(ens) ? ens : currentValue}
        onChange={e => updateAddress(e.target.value)}
        addonAfter={
          <div
            style={{
              marginTop: 4,
              cursor: props.disabled ? "not-allowed" : "pointer",
            }}
            onClick={() => !props.disabled && setScan(!scan)}
          >
            <QrcodeOutlined height={32} width={32} style={{ fontSize: 18 }} />
          </div>
        }
      />
    </>
  );
}