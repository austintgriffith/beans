import React, { useMemo } from "react";
import { QRCode, message } from "antd";

const QR_SIZE = 320;

interface QRPunkBlockieProps {
  scale?: string;
  address?: string;
  showAddress?: boolean;
}

export const QRPunkBlockie: React.FC<QRPunkBlockieProps> = ({ address, showAddress, scale }) => {
  const qrValue = useMemo(() => {
    if (!address) return "";
    const url = new URL("", window.location.origin);
    url.searchParams.set("addr", address);
    return url.toString();
  }, [address]);

  return (
    <div
      style={{
        margin: "auto",
        position: "relative",
        transformOrigin: "50% 50%",
        transform: "scale(" + (scale ? scale : "1") + ")",
        width: QR_SIZE,
        height: QR_SIZE,
      }}
      onClick={() => {
        const el = document.createElement("textarea");
        el.value = address!;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        message.success(
          <span style={{ position: "relative" }}>
            Copied Address
            <div style={{ position: "absolute", left: -60, top: -14 }} />
          </span>,
        );
      }}
    >
      <div style={{ opacity: qrValue ? 1 : 0, transition: ".3s ease opacity" }}>
        <QRCode
          value={qrValue}
          size={QR_SIZE}
          iconSize={72}
          errorLevel="H"
          icon="./ECO_square.png"
          imageSettings={{ width: 105, height: 105, excavate: true, src: "" }}
        />
      </div>

      {showAddress ? (
        <div
          style={{
            fontWeight: "bolder",
            letterSpacing: -0.8,
            color: "#666666",
            fontSize: 14.8,
          }}
        >
          {address}
        </div>
      ) : null}
    </div>
  );
};

export default QRPunkBlockie;
