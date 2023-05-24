import React from "react";
import { Col, Row } from "antd";
import { Link, useLocation } from "react-router-dom";

import { ReactComponent as EcoLogo } from "@assets/images/eco-logo.svg";

import "./Header.css";

const Item: React.FC<React.PropsWithChildren<{ to: string }>> = ({ to, children }) => {
  const location = useLocation();
  const selected = to === location.pathname;

  const classes = ["header-item"];
  if (selected) classes.push("selected");

  return (
    <Link to={to} className={classes.join(" ")}>
      {children}
    </Link>
  );
};

export const Header: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <Row
      style={{
        padding: "32px 40px",
        margin: 16,
        backgroundColor: "rgba(249,249,245,0.95)",
        backdropFilter: "blur(8px)",
        borderRadius: 24,
      }}
    >
      <Col flex="100px" style={{ display: "flex", alignItems: "center" }}>
        <EcoLogo />
      </Col>
      <Col flex="auto" style={{ display: "flex", justifyContent: "end", paddingRight: 40 }}>
        <Row
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 48,
          }}
        >
          <Item to="/">Home</Item>
          <Item to="/about">About</Item>
        </Row>
      </Col>
      <Col flex="40px">{children}</Col>
    </Row>
  );
};
