import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Button, Modal, Spin, Tooltip } from "antd";
import { ExportOutlined, KeyOutlined, SaveOutlined, SettingOutlined } from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

import { useStackup } from "@contexts/StackupContext";
import { SaveAccess } from "@components/menu/SaveAccess";
import { Address } from "../Address";
import { WalletImport } from "./WalletImport";
import { WalletExport } from "@components/menu/WalletExport";

interface AccountProps {
  signer: ethers.Wallet;
  provider: ethers.providers.JsonRpcProvider;
}

enum Action {
  Save,
  Import,
  Export,
}

export const Account: React.FC<AccountProps> = ({ signer, provider }) => {
  const [open, setOpen] = useState(false);

  const [action, setAction] = useState<Action | null>(null);

  const navigate = useNavigate();
  const { address } = useStackup();

  const [searchParams] = useSearchParams();
  useEffect(() => {
    const password = searchParams.get("password");
    if (password) {
      navigate("/");
    }
  }, [navigate, searchParams]);

  const showImportButton = (
    <Button onClick={() => setAction(Action.Import)} icon={<SaveOutlined />}>
      Log In
    </Button>
  );

  const privateKeyButton =
    action === Action.Save ? (
      <Button key="hide" onClick={() => setAction(null)} icon={<KeyOutlined />}>
        Hide
      </Button>
    ) : (
      <Button key="hide" onClick={() => setAction(Action.Save)} icon={<KeyOutlined />}>
        Save Access
      </Button>
    );

  return (
    <>
      <Tooltip title="Wallet">
        <SettingOutlined
          data-cy="header-config-btn"
          onClick={() => setOpen(!open)}
          style={{
            fontSize: 24,
            color: "#06153c",
            cursor: "pointer",
            verticalAlign: "middle",
          }}
        />
      </Tooltip>
      <Modal
        open={open}
        onOk={() => setOpen(!open)}
        onCancel={() => setOpen(!open)}
        afterClose={() => setAction(null)}
        footer={
          action === Action.Save || action === null ? (
            [showImportButton, privateKeyButton]
          ) : action === Action.Export ? (
            <Button onClick={() => setAction(Action.Save)} icon={<ExportOutlined />}>
              It&apos;s saved
            </Button>
          ) : null
        }
        title={address ? <Address copyable address={address} provider={provider} /> : <Spin />}
      >
        {action === Action.Import ? (
          <WalletImport onClose={() => setAction(null)} />
        ) : action === Action.Save ? (
          <SaveAccess
            address={address}
            privateKey={signer.privateKey}
            onHandleExport={() => setAction(Action.Export)}
          />
        ) : action === Action.Export ? (
          <WalletExport privateKey={signer.privateKey} />
        ) : null}
      </Modal>
    </>
  );
};

export default Account;
