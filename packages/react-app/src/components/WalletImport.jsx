import { ethers } from "ethers";
import React, { useEffect, useState } from "react";

import { Button, Input } from "antd";
import Address from "./Address";

export default function WalletImport({ setShowImport }) {
  const [importMnemonic, setImportMnemonic] = useState();
  const [importMnemonicIndex, setImportMnemonicIndex] = useState("0");
  const [password, setPassword] = useState("");
  const [importPrivatekey, setImportPrivatekey] = useState();
  const [importAddress, setImportAddress] = useState();

  useEffect(() => {
    const calculatePK = async () => {
      if (importMnemonic) {
        const ethersSeed = ethers.utils.mnemonicToSeed(importMnemonic, password);
        const ethersHDNode = ethers.utils.HDNode.fromSeed(ethersSeed);

        const wallet_hdpath = "m/44'/60'/0'/0/";
        const fullPath = wallet_hdpath + importMnemonicIndex;

        const ethersDerivedHDNode = ethersHDNode.derivePath(fullPath);
        const ethersPrivateKey = ethersDerivedHDNode.privateKey;

        setImportPrivatekey(ethersPrivateKey);
      } else {
        setImportPrivatekey();
      }
    };
    calculatePK();
  }, [importMnemonic, importMnemonicIndex, password]);

  useEffect(() => {
    const calculateAddress = async () => {
      if (importPrivatekey) {
        try {
          const officialEthersWallet = new ethers.Wallet(importPrivatekey);
          console.log(officialEthersWallet);
          setImportAddress(officialEthersWallet.address);
        } catch (e) {
          console.log(e);
          setImportAddress("");
        }
      }
    };
    calculateAddress();
  }, [importPrivatekey]);

  return (
    <div>
      <div style={{ marginTop: 21, width: 420 }}>
        <i>
          Log in to an existing wallet you have saved access to. When you do this, you will lose access to your current
          account — so save that first if you've used it.
        </i>
      </div>

      <br />

      <Input size="large" placeholder="Use your saved passwords" name="username" autocomplete="username" />

      <Input.Password
        disabled={importMnemonic}
        style={{ display: "none" }}
        size="large"
        value={importPrivatekey}
        placeholder="0x..."
        autocomplete="current-password"
        onChange={e => {
          setImportPrivatekey(e.target.value);
        }}
      />

      <hr />

      {importAddress ? <div></div> : ""}

      <div style={{ float: "right" }}>
        <Button
          style={{ marginTop: 16 }}
          disabled={!importPrivatekey || (importMnemonic && importMnemonic.length < 7)} //safety third!
          onClick={() => {
            const currentPrivateKey = window.localStorage.getItem("metaPrivateKey");
            if (currentPrivateKey) {
              window.localStorage.setItem("metaPrivateKey_backup" + Date.now(), currentPrivateKey);
            }

            try {
              const officialEthersWallet = new ethers.Wallet(importPrivatekey.trim());
              console.log(officialEthersWallet);
              setImportAddress(officialEthersWallet.address);
              window.localStorage.setItem("metaPrivateKey", importPrivatekey);
              window.location.reload();
              //setShowImport(!showImport)
            } catch (e) {
              console.log(e);
            }
          }}
        >
          Log In
        </Button>
      </div>

      <Button
        style={{ marginTop: 16 }}
        onClick={() => {
          setShowImport(false);
        }}
      >
        Cancel
      </Button>
    </div>
  );
}
