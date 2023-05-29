import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { NETWORK } from "@constants";
import { About, Claim, Home } from "@views";
import { Account, Footer, Header } from "@components";
import { useBurnerWallet, useStaticJsonRPC } from "@hooks";
import { StackupProvider } from "@contexts/StackupContext";
import { FadeTransitionRoutes } from "@components/routes/FadeTransitionRoutes";

import "./App.css";
import "antd/dist/reset.css";

function App() {
  const provider = useStaticJsonRPC(NETWORK.rpcUrl, NETWORK.chainId);
  const signer = useBurnerWallet(provider);

  if (!provider || !signer) return null;

  const routes = (
    <FadeTransitionRoutes>
      <Route path="/" element={<Home provider={provider} />} />
      <Route path="/about" element={<About />} />
      <Route path="/claim" element={<Claim provider={provider} />} />
      {/*<Route path="/swap" element={<Swap provider={provider} />} />*/}
      <Route path="*" element={<Navigate to="/" />} />
    </FadeTransitionRoutes>
  );

  return (
    <div className="App">
      <StackupProvider provider={provider} signer={signer}>
        <Header>
          <Account provider={provider} signer={signer} />
        </Header>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>{routes}</div>
        <Footer />
      </StackupProvider>
    </div>
  );
}

export default App;
