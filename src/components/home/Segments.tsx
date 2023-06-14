import { Segmented, Space } from "antd";
import { SendOutlined, ShareAltOutlined } from "@ant-design/icons";
import React, { useMemo, useState } from "react";

import { Transfer, Share } from "@components/home";

enum Operation {
  Transfer,
  Share,
}

export const Segments: React.FC = () => {
  const [operation, setOperation] = useState(Operation.Transfer);

  const content = useMemo(() => {
    switch (operation) {
      case Operation.Transfer:
        return <Transfer />;
      case Operation.Share:
        return <Share />;
    }
  }, [operation]);

  return (
    <Space direction="vertical" size="large">
      <Space direction="vertical" align="center" style={{ width: "100%" }}>
        <Segmented
          data-cy="home-segments"
          onChange={value => setOperation(value as Operation)}
          options={[
            { icon: <SendOutlined />, value: Operation.Transfer, label: "Transfer" },
            { icon: <ShareAltOutlined />, value: Operation.Share, label: "Share" },
          ]}
        />
      </Space>

      {content}
    </Space>
  );
};
