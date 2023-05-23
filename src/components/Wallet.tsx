import React, { useState } from "react";
import { ethers } from "ethers";
import { Button, Modal, Spin, Tooltip } from "antd";
import { KeyOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons";

import Address from "./Address";
import WalletImport from "./WalletImport";

interface WalletProps {
  address: string;
  padding: string;
  color: string;
  size: number;
  provider: ethers.providers.JsonRpcProvider;
  signer: ethers.Wallet;
}

export const Wallet: React.FC<WalletProps> = ({ address, signer, padding, color, provider, size }) => {
  const [pk, setPK] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showImport, setShowImport] = useState(false);

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
    <Button onClick={() => setShowImport(true)} icon={<SaveOutlined />}>
      Log In
    </Button>
  );

  let display: React.ReactNode = null;
  let privateKeyButton;
  if (pk) {
    const wallet = new ethers.Wallet(pk!);

    if (wallet.address !== address) {
      display = (
        <div>
          <b>*injected account*, private key unknown</b>
        </div>
      );
    } else {
      const extraPkDisplayAdded: any = {};
      extraPkDisplayAdded[wallet.address] = true;
      for (const key in localStorage) {
        if (key.indexOf("metaPrivateKey_backup") >= 0) {
          const pastpk = localStorage.getItem(key);
          const pastwallet = new ethers.Wallet(pastpk!);
          if (!extraPkDisplayAdded[pastwallet.address]) {
            extraPkDisplayAdded[pastwallet.address] = true;
          }
        }
      }

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

            <form id="pk" action="#">
              <span style={{ display: "none" }}>
                <input type="text" name="username" value={"Eco Wallet - " + address} />
                <input type="password" name="password" value={pk} />
              </span>
              <Button id="submitPk" value="Save Access" htmlType="submit">
                Save Access
              </Button>
            </form>

            <br />
          </div>
        </div>
      );
    }

    privateKeyButton = (
      <Button key="hide" onClick={() => setPK("")} icon={<KeyOutlined />}>
        Hide
      </Button>
    );
  } else {
    privateKeyButton = (
      <Button key="hide" onClick={() => setPK(signer.privateKey)} icon={<KeyOutlined />}>
        Save Access
      </Button>
    );
  }

  return (
    <span>
      {providerSend}
      <Modal
        open={open}
        onOk={() => setOpen(!open)}
        onCancel={() => setOpen(!open)}
        footer={!showImport ? [showImportButton, privateKeyButton] : null}
        title={address ? <Address address={address} provider={provider} /> : <Spin />}
      >
        {showImport ? <WalletImport setShowImport={setShowImport} /> : display}
      </Modal>
    </span>
  );
};

export default Wallet;
