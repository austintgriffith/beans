import React from "react";
import QR from "qrcode.react";
import { message } from "antd";

export default function QRPunkBlockie(props) {
  const hardcodedSizeForNow = 380;
  const qrValue = props.address ? new URL(props.address, window.location.href).toString() : "";

  return (
    <div
      style={{
        transform: "scale(" + (props.scale ? props.scale : "1") + ")",
        transformOrigin: "50% 50%",
        margin: "auto",
        position: "relative",
        width: hardcodedSizeForNow,
      }}
      onClick={() => {
        const el = document.createElement("textarea");
        el.value = props.address;
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
      <div
        style={{
          position: "absolute",
          left: hardcodedSizeForNow / 2 - 46,
          top: hardcodedSizeForNow / 2 - 46,
        }}
      >
        <img src="./$ECO_square.png" style={{ width: 92, height: 92 }} />
      </div>

      {props.withQr ? (
        <QR
          level={"H"}
          includeMargin={false}
          value={qrValue}
          size={hardcodedSizeForNow}
          imageSettings={{ width: 105, height: 105, excavate: true, src: "" }}
        />
      ) : (
        ""
      )}

      {props.showAddress ? (
        <div style={{ fontWeight: "bolder", letterSpacing: -0.8, color: "#666666", fontSize: 14.8 }}>
          {props.address}
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
