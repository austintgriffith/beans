import React from "react";
import Wallet from "./Wallet";
import { useStackup } from "../contexts/StackupContext";

export default function Account({ signer, localProvider }) {
  const stackup = useStackup();
  const address = stackup.simpleAccount?.getSender();
  if (!address) return null;
  return (
    <Wallet padding="0px" color="#06153c" address={address} signer={signer} provider={localProvider} size={24} />
  );
}
