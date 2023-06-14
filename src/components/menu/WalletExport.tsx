import React, { useState } from "react";
import { Button, Space, Typography } from "antd";
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";

const { Paragraph, Title } = Typography;

interface WalletExportProps {
  privateKey: string;
}

const hiddenText = "*".repeat(64);

export const WalletExport: React.FC<WalletExportProps> = ({ privateKey }) => {
  const [display, setDisplay] = useState(false);

  return (
    <div style={{ marginTop: 24 }}>
      <Space direction="vertical">
        <Title level={5}>Please, store the following private key in a secure place.</Title>
        <Paragraph style={{ position: "relative" }}>
          <pre style={{ margin: 0, padding: "16px 48px 16px 24px", fontWeight: "bold" }}>
            {display ? privateKey : hiddenText}
          </pre>
          <Button
            shape="circle"
            onClick={() => setDisplay(!display)}
            icon={display ? <EyeOutlined /> : <EyeInvisibleOutlined />}
            style={{
              position: "absolute",
              top: "50%",
              right: 8,
              transform: "translate(0, -50%)",
            }}
          />
        </Paragraph>
      </Space>
    </div>
  );
};
