import React, { useCallback, useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ethers } from "ethers";
import { useUserProviderAndSigner } from "eth-hooks";

import "./App.css";

import { Home } from "./views";
import { useStaticJsonRPC } from "./hooks";
import { Account, Header } from "./components";
import { NETWORKS } from "./constants";
import { Web3ModalSetup } from "./helpers";

import "antd/dist/antd.css";
import { Footer } from "./components/Footer";

const web3Modal = Web3ModalSetup();

const initialNetwork = NETWORKS[process.env.REACT_APP_NETWORK ?? "goerli"];
const selectedNetwork = initialNetwork.name;
const targetNetwork = NETWORKS[selectedNetwork];
const RPC_URL = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : targetNetwork.rpcUrl;

async function logoutOfWeb3Modal(injectedProvider) {
  await web3Modal.clearCachedProvider();
  if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
    await injectedProvider.provider.disconnect();
  }
  setTimeout(() => window.location.reload(), 1);
}

function App() {
  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();

  const localProvider = useStaticJsonRPC([RPC_URL]);

  const { signer: userSigner } = useUserProviderAndSigner(injectedProvider, localProvider, true);

  useEffect(() => {
    userSigner?.getAddress().then(address => address && setAddress(address));
  }, [userSigner]);

  const loadWeb3Modal = useCallback(async () => {
    //const provider = await web3Modal.connect();
    const provider = await web3Modal.requestProvider();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log("disconnect", code, reason);
      logoutOfWeb3Modal(injectedProvider);
    });
  }, [injectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) loadWeb3Modal();

    //automatically connect if it is a safe app
    web3Modal.isSafeApp().then(isSafeApp => isSafeApp && loadWeb3Modal());
  }, [loadWeb3Modal]);

  const routes = (
    <Routes>
      <Route
        exact
        path="/"
        element={
          <Home address={address} userSigner={userSigner} localProvider={localProvider} network={targetNetwork} />
        }
      />
      <Route
        exact
        path="/:address"
        element={
          <Home address={address} userSigner={userSigner} localProvider={localProvider} network={targetNetwork} />
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );

  return (
    <div className="App">
      <Header>
        <Account address={address} userSigner={userSigner} localProvider={localProvider} />
      </Header>
      {address ? routes : <div style={{ height: 800 }} />}
      <Footer />
    </div>
  );
}

export default App;
