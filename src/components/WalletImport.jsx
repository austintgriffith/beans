import React, { useState } from "react";
import { Button, Input } from "antd";

export default function WalletImport({ setShowImport }) {
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

  return (
    <div>
      <div style={{ marginTop: 16, width: 420 }}>
        <i>
          Log in to an existing wallet you have saved access to. When you do this, you will lose access to your current
          account — so save that first if you've used it.
        </i>
      </div>

      <br />

      <Input size="large" placeholder="Use your saved passwords" name="username" autocomplete="username" />
      <Input.Password
        size="large"
        placeholder="0x..."
        autocomplete="current-password"
        style={{ display: "none" }}
        value={importPrivatekey}
        onChange={e => setImportPrivatekey(e.target.value)}
      />

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
