import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { About, Home } from "./views";
import { getNetwork } from "./constants";
import { Account, Footer, Header } from "./components";
import { useBurnerWallet, useStaticJsonRPC } from "./hooks";
import { StackupProvider } from "./contexts/StackupContext";

import "./App.css";
import "antd/dist/reset.css";

const network = getNetwork();

function App() {
  const provider = useStaticJsonRPC(network.rpcUrl, network.chainId);
  const signer = useBurnerWallet(provider);

  if (!provider || !signer) return null;

  const routes = (
    <Routes>
      <Route path="/" element={<Home provider={provider} network={network} />} />
      <Route path="/about" element={<About />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );

  return (
    <div className="App">
      <StackupProvider provider={provider} signer={signer}>
        <Header>
          <Account signer={signer} provider={provider} />
        </Header>
        {routes}
        <Footer />
      </StackupProvider>
    </div>
  );
}

export default App;
