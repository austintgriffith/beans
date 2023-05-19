import React, { useMemo } from "react";
import QR from "qrcode.react";
import { message } from "antd";

const hardcodedSizeForNow = 320;

export default function QRPunkBlockie(props) {
  const qrValue = useMemo(() => {
    const url = new URL("", window.location.origin);
    url.searchParams.set("addr", props.address);
    return props.address ? url.toString() : "";
  }, [props.address]);

  return (
    <div
      style={{
        margin: "auto",
        position: "relative",
        transformOrigin: "50% 50%",
        transform: "scale(" + (props.scale ? props.scale : "1") + ")",
        width: hardcodedSizeForNow,
        height: hardcodedSizeForNow,
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
          zIndex: 100,
        }}
      >
        <img alt="logo" src="./$ECO_square.png" style={{ width: 92, height: 92 }} />
      </div>

      {props.withQr ? (
        <QR
          level="H"
          style={{ opacity: qrValue ? 1 : 0.0, transition: ".3s ease opacity" }}
          value={qrValue}
          includeMargin={false}
          size={hardcodedSizeForNow}
          imageSettings={{ width: 105, height: 105, excavate: true, src: "" }}
        />
      ) : null}

      {props.showAddress ? (
        <div
          style={{
            fontWeight: "bolder",
            letterSpacing: -0.8,
            color: "#666666",
            fontSize: 14.8,
          }}
        >
          {props.address}
        </div>
      ) : null}
    </div>
  );
}
