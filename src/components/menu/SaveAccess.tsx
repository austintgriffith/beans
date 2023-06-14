import React from "react";
import { Button, Divider, Space } from "antd";
import { ExportOutlined, SaveOutlined } from "@ant-design/icons";

interface SaveAccessProps {
  address: string;
  privateKey: string;
  onHandleExport(): void;
}

export const SaveAccess: React.FC<SaveAccessProps> = ({ address, privateKey, onHandleExport }) => {
  return (
    <div>
      <Space direction="vertical">
        <i>
          Pressing &quot;Save Access&quot; will prompt your browser to save access to your account. You can then access
          your account using the saved credentials on this device or others.
        </i>

        <form id="pk" action="#">
          <span style={{ display: "none" }}>
            <input type="text" name="username" value={"Eco Wallet - " + address} />
            <input type="password" name="password" value={privateKey} />
          </span>
          <Button id="submitPk" value="Save Access" htmlType="submit" icon={<SaveOutlined />}>
            Save Access
          </Button>
        </form>
      </Space>

      <Divider />

      <Space direction="vertical">
        <i>
          Alternatively, you can export your access manually. However, we highly recommend utilizing a password manager
          to securely store your data.
        </i>
        <Button onClick={onHandleExport} icon={<ExportOutlined />}>
          Export
        </Button>
      </Space>
    </div>
  );
};
