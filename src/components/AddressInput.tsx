import React, { useCallback, useState } from "react";
import { ethers } from "ethers";
import { Input, InputProps } from "antd";
import QrReader from "react-qr-reader";
import { QrcodeOutlined } from "@ant-design/icons";
import { useResolveEnsAddress } from "eth-hooks/dapps";

const isENS = (address = "") => address.endsWith(".eth") || address.endsWith(".xyz");

const provider = new ethers.providers.InfuraProvider("mainnet", process.env.REACT_APP_INFURA_ID);

interface AddressInputProps {
  value: string;

  disabled?: InputProps["disabled"];
  placeholder?: InputProps["placeholder"];
  onChange?: (value: string) => void;

  hoistScanner?: (func: (show: boolean) => void) => void;
}

export const AddressInput: React.FC<AddressInputProps> = props => {
  const { onChange } = props;
  const [value, setValue] = useState(props.value);
  const [scan, setScan] = useState(false);

  const currentValue = typeof props.value !== "undefined" ? props.value : value;
  const [ens] = useResolveEnsAddress(provider, currentValue);

  const updateAddress = useCallback(
    async (newValue: string) => {
      if (typeof newValue !== "undefined") {
        let address = newValue;
        if (isENS(address)) {
          try {
            const possibleAddress = await provider.resolveName(address);
            if (possibleAddress) {
              address = possibleAddress;
            }
          } catch (e) {
            // Not a ENS
          }
        }
        setValue(address);
        if (typeof onChange === "function") {
          onChange(address);
        }
      }
    },
    [onChange],
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
            onError={() => setScan(false)}
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
      ) : null}
      <Input
        size="large"
        id="0xAddress"
        name="0xAddress"
        autoComplete="off"
        style={{ width: 320 }}
        disabled={props.disabled}
        placeholder={props.placeholder ? props.placeholder : "address"}
        value={ethers.utils.isAddress(currentValue) && !isENS(currentValue) && isENS(ens) ? ens : currentValue}
        onChange={e => updateAddress(e.target.value)}
        addonAfter={
          <div
            style={{
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
};

export default AddressInput;
