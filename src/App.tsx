import React, { useMemo } from "react";
import { Navigate, Route } from "react-router-dom";

import { NETWORK, Token } from "@constants";
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

  const tokenRoutes = useMemo(
    () =>
      [Token.ECO, Token.USDC].map(token => (
        <Route key={`${token}-home`} path={`/t/${token}`} element={<Home token={token} />} />
      )),
    [],
  );

  if (!provider || !signer) return null;

  const routes = (
    <FadeTransitionRoutes>
      {tokenRoutes}

      {/*--- Redirect Existing Links to new claim route ---*/}
      <Route path="/claim" element={<Claim provider={provider} />} />

      <Route path="/about" element={<About />} />
      <Route path="*" element={<Navigate to="/t/eco" state={{ redirect: true }} />} />
    </FadeTransitionRoutes>
  );

  return (
    <div className="App">
      <StackupProvider provider={provider} signer={signer}>
        <Header>
          <Account provider={provider} signer={signer} />
        </Header>
        {routes}
        <Footer />
      </StackupProvider>
    </div>
  );
}

export default App;
