import React, { useState } from "react";
import { Button, Modal, Spin, Tooltip, Typography } from "antd";
import { KeyOutlined, SettingOutlined } from "@ant-design/icons";
import { ethers } from "ethers";
import QR from "qrcode.react";

import Address from "./Address";
import WalletImport from "./WalletImport";

const { Text } = Typography;

export default function Wallet({ address, padding, color, provider, size }) {
  const [open, setOpen] = useState();
  const [qr, setQr] = useState();
  const [pk, setPK] = useState();

  const [showImport, setShowImport] = useState();

  const providerSend = provider ? (
    <Tooltip title="Wallet">
      <SettingOutlined
        onClick={() => setOpen(!open)}
        style={{
          cursor: "pointer",
          verticalAlign: "middle",
          color: color ? color : "",
          fontSize: size ? size : 28,
          padding: padding ? padding : 7,
        }}
      />
    </Tooltip>
  ) : (
    ""
  );

  const showImportButton = (
    <Button
      style={{ marginTop: 16 }}
      onClick={() => {
        setShowImport(true);
      }}
    >
      <span style={{ marginRight: 8 }}>💾</span>Log In
    </Button>
  );

  let display;
  let privateKeyButton;
  if (qr) {
    display = (
      <div>
        <div>
          <Text copyable>{address}</Text>
        </div>
        <QR value={address} size="450" level="H" includeMargin renderAs="svg" imageSettings={{ excavate: false }} />
      </div>
    );
    privateKeyButton = (
      <Button
        key="hide"
        onClick={() => {
          setPK(address);
          setQr("");
        }}
      >
        <KeyOutlined /> Private Key
      </Button>
    );
  } else if (pk) {
    const pk = localStorage.getItem("metaPrivateKey");
    const wallet = new ethers.Wallet(pk);

    if (wallet.address !== address) {
      display = (
        <div>
          <b>*injected account*, private key unknown</b>
        </div>
      );
    } else {
      const extraPkDisplayAdded = {};
      extraPkDisplayAdded[wallet.address] = true;
      for (const key in localStorage) {
        if (key.indexOf("metaPrivateKey_backup") >= 0) {
          const pastpk = localStorage.getItem(key);
          const pastwallet = new ethers.Wallet(pastpk);
          if (!extraPkDisplayAdded[pastwallet.address]) {
            extraPkDisplayAdded[pastwallet.address] = true;
          }
        }
      }

      const useForm = !window.PasswordCredential;
      const saveCredentials = async () => {
        const cred = new window.PasswordCredential({
          id: "Eco Wallet - " + address,
          name: "Eco Wallet - " + address,
          password: pk,
        });
        await navigator.credentials.store(cred);
      };

      display = (
        <div>
          <div>
            <div>
              <i>
                Pressing "Save Access" will prompt your browser to save access to your account. You can then access your
                account using the saved credentials on this device or others.
              </i>
            </div>
            <br />

            {useForm ? (
              <form id="pk">
                <span style={{ display: "none" }}>
                  <input type="text" name="username" value={"Eco Wallet - " + address} />
                  <input type="password" name="password" value={pk} />
                </span>
                <button id="submitPk" type="submit" value="Save Access" action="#">
                  Save Access
                </button>
              </form>
            ) : (
              <button type="submit" value="Save Access" onClick={saveCredentials}>
                Save Access
              </button>
            )}

            <br />
          </div>
        </div>
      );
    }

    privateKeyButton = (
      <Button
        key="hide"
        onClick={() => {
          setPK("");
          setQr("");
        }}
      >
        <KeyOutlined /> Hide
      </Button>
    );
  } else {
    privateKeyButton = (
      <Button
        key="hide"
        onClick={() => {
          setPK(address);
          setQr("");
        }}
      >
        <KeyOutlined /> Save Access
      </Button>
    );
  }

  return (
    <span>
      {providerSend}
      <Modal
        visible={open}
        title={<div>{address ? <Address address={address} provider={provider} /> : <Spin />}</div>}
        onOk={() => {
          setPK();
          setOpen(!open);
        }}
        onCancel={() => {
          setPK();
          setOpen(!open);
        }}
        footer={showImport ? null : [showImportButton, privateKeyButton]}
      >
        {showImport ? <WalletImport setShowImport={setShowImport} /> : display}
      </Modal>
    </span>
  );
}
