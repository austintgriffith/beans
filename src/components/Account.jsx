import React from "react";
import Wallet from "./Wallet";

export default function Account({ address, userSigner, localProvider }) {
  return (
    <Wallet padding="0px" color="#06153c" address={address} signer={userSigner} provider={localProvider} size={36} />
  );
}
