import React from "react";
import { ethers } from "ethers";
import { Skeleton, Typography } from "antd";
import { LinkProps } from "antd/es/typography/Link";
import { useResolveEnsAddress } from "eth-hooks/dapps";

import { blockExplorerLink } from "@helpers";

const { Link } = Typography;

interface AddressProps extends LinkProps {
  address: string;
  provider: ethers.providers.JsonRpcProvider;
  copyable?: boolean;

  size?: "normal" | "long";
}

export const Address: React.FC<AddressProps> = ({ address, provider, size, copyable, ...props }) => {
  const [ens] = useResolveEnsAddress(provider, address);

  const ensSplit = ens && ens.split(".");
  const validEnsCheck = ensSplit && ensSplit[ensSplit.length - 1] === "eth";

  const etherscanLink = blockExplorerLink(address);

  let displayAddress = address?.substr(0, 5) + "..." + address?.substr(-4);
  if (validEnsCheck) {
    displayAddress = ens!;
  } else if (size === "long") {
    displayAddress = address;
  }

  if (!address) {
    return (
      <span>
        <Skeleton avatar paragraph={{ rows: 1 }} />
      </span>
    );
  }

  return (
    <Link
      color="primary"
      target="_blank"
      rel="noopener noreferrer"
      href={etherscanLink}
      copyable={copyable ? { text: address } : undefined}
      {...props}
    >
      {displayAddress}
    </Link>
  );
};
