import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Button, Input } from "antd";

interface WalletImportProps {
  onClose(): void;
}

export const WalletImport: React.FC<WalletImportProps> = ({ onClose }) => {
  const [username, setUsername] = useState("");
  const [importPrivatekey, setImportPrivatekey] = useState("");

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
          account — so save that first if you&apos;ve used it.
        </i>
      </div>

      <br />

      <form>
        <Input
          size="large"
          name="username"
          placeholder="Use your saved passwords"
          onChange={e => setUsername(e.target.value)}
        />
        <Input.Password
          size="small"
          name="password"
          placeholder="0x..."
          value={importPrivatekey}
          onChange={e => setImportPrivatekey(e.target.value)}
          style={{ display: "none" }}
        />
      </form>

      <hr />

      <div style={{ float: "right" }}>
        <Button onClick={logIn} disabled={!importPrivatekey} style={{ marginTop: 16 }}>
          Log In
        </Button>
      </div>

      <Button style={{ marginTop: 16 }} onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
};
