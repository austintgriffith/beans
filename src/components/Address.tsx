import React, { CSSProperties } from "react";
import { ethers } from "ethers";
import { Skeleton, Typography } from "antd";
import { useResolveEnsAddress } from "eth-hooks/dapps";

import { getNetwork } from "../constants";

const { Text } = Typography;

const blockExplorerLink = (address: string) => {
  const { blockExplorer } = getNetwork();
  return new URL(`address/${address}`, blockExplorer).toString();
};

interface AddressProps {
  address: string;
  provider: ethers.providers.JsonRpcProvider;
  minimized?: boolean;
  size?: "short" | "normal" | "long";
  fontSize?: CSSProperties["fontSize"];
  onChange?: (value: string) => void;
}

export default function Address(props: AddressProps) {
  const address = props.address;

  const [ens] = useResolveEnsAddress(props.provider, address);

  const ensSplit = ens && ens.split(".");
  const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";

  const etherscanLink = blockExplorerLink(address);

  let displayAddress = address?.substr(0, 5) + "..." + address?.substr(-4);
  if (validEnsCheck) {
    displayAddress = ens!;
  } else if (props.size === "short") {
    displayAddress += "..." + address.substr(-4);
  } else if (props.size === "long") {
    displayAddress = address;
  }

  if (!address) {
    return (
      <span>
        <Skeleton avatar paragraph={{ rows: 1 }} />
      </span>
    );
  }

  if (props.minimized) {
    return (
      <span style={{ verticalAlign: "middle" }}>
        <a style={{ color: "#06153c" }} target="_blank" href={etherscanLink} rel="noopener noreferrer">
          {displayAddress}
        </a>
      </span>
    );
  }

  return (
    <span>
      <span
        style={{
          paddingLeft: 5,
          verticalAlign: "middle",
          fontSize: props.fontSize ? props.fontSize : 28,
        }}
      >
        <Text editable={props.onChange ? { onChange: props.onChange } : undefined} copyable={{ text: address }}>
          <a style={{ color: "#06153c" }} target="_blank" href={etherscanLink} rel="noopener noreferrer">
            {displayAddress}
          </a>
        </Text>
      </span>
    </span>
  );
}
