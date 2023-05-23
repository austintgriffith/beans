import React, { useEffect, useState } from "react";
import { Button, Input } from "antd";
import { ethers } from "ethers";

export default function WalletImport({ setShowImport }) {
  const [username, setUsername] = useState("");
  const [importPrivatekey, setImportPrivatekey] = useState();

  const logIn = () => {
    const currentPrivateKey = window.localStorage.getItem("metaPrivateKey");
    if (currentPrivateKey) {
      window.localStorage.setItem("metaPrivateKey_backup" + Date.now(), currentPrivateKey);
    }

    try {
      window.localStorage.setItem("metaPrivateKey", importPrivatekey);
      window.location.reload();
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (username && ethers.utils.isHexString(username) && username.length === 66) {
      setImportPrivatekey(username);
    }
  }, [username]);

  return (
    <div>
      <div style={{ marginTop: 16, width: 420 }}>
        <i>
          Log in to an existing wallet you have saved access to. When you do this, you will lose access to your current
          account — so save that first if you've used it.
        </i>
      </div>

      <br />

      <form>
        <Input
          size="large"
          placeholder="Use your saved passwords"
          name="username"
          autocomplete="username"
          onChange={e => setUsername(e.target.value)}
        />
        <Input.Password
          size="small"
          style={{ display: "none" }}
          placeholder="0x..."
          name="password"
          autocomplete="current-password"
          value={importPrivatekey}
          onChange={e => setImportPrivatekey(e.target.value)}
        />
      </form>

      <hr />

      <div style={{ float: "right" }}>
        <Button
          style={{ marginTop: 16 }}
          disabled={!importPrivatekey} //safety third!
          onClick={logIn}
        >
          Log In
        </Button>
      </div>

      <Button style={{ marginTop: 16 }} onClick={() => setShowImport(false)}>
        Cancel
      </Button>
    </div>
  );
}
