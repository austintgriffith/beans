import React, { useState } from "react";
import { ethers } from "ethers";
import { SendOutlined } from "@ant-design/icons";
import { Button, Input, InputProps, Space, Typography } from "antd";
import isEqual from "lodash.isequal";

import * as Peanut from "@modules/peanut";
import { FLAT_FEE_AMOUNT, useStackup } from "@contexts/StackupContext";
import { TokenFee } from "@components/commons/TokenFee";
import { blockExplorerLink, convertAmount, formatTokenAmount } from "@helpers";

import { PEANUT_V3_ADDRESS } from "@modules/peanut/constants";
import { PeanutV3__factory } from "@assets/contracts";

import { ReactComponent as EcoLogo } from "@assets/images/eco-logo.svg";
import { getTransaction } from "@helpers/contracts";
import { usePeanutDeposit } from "@hooks/usePeanutDeposit";
import { useAlert } from "@hooks/useAlert";

function getValues({
  amount,
  balance,
}: {
  amount: string;
  // Wallet's current balance
  balance?: ethers.BigNumber;
}) {
  let total: ethers.BigNumber;
  try {
    total = convertAmount(amount).abs();
  } catch (e) {
    total = ethers.constants.Zero;
  }

  const exceedsBalance = total.add(FLAT_FEE_AMOUNT).gt(balance || ethers.constants.Zero);

  return { total, exceedsBalance };
}

interface TransferProps {
  balance?: ethers.BigNumber;
}

export const Share: React.FC<TransferProps> = ({ balance }) => {
  const { address, provider } = useStackup();
  const { deposit } = usePeanutDeposit();

  const [alertApi, alertElemt] = useAlert();

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const doSend = async () => {
    setLoading(true);
    alertApi.clear();
    try {
      const value = convertAmount(amount);

      const password = Peanut.getRandomString();
      const userOpResponse = await deposit(value, password);

      if (!userOpResponse) {
        alertApi.error({ message: "Unexpected error", description: "Please contact us for help" });
        return;
      }

      const tx = await getTransaction(provider, userOpResponse.transactionHash);
      const receipt = await tx.wait();

      const peanut = PeanutV3__factory.connect(PEANUT_V3_ADDRESS, provider);
      const evt = peanut.filters.DepositEvent(null, null, null, address);
      const depositEvt = receipt.logs.find(log => log.address === evt.address && isEqual(log.topics, evt.topics));

      if (!depositEvt) {
        alertApi.error({ message: "Unexpected error", description: "Please contact us for help" });
        return;
      }

      const [depositId] = peanut.interface.decodeEventLog("DepositEvent", depositEvt.data, depositEvt.topics);

      const link = Peanut.createLink(password, depositId);

      alertApi.success({
        message: "Share link created!",
        description: (
          <>
            <Typography.Paragraph style={{ maxWidth: 400 }}>
              Share this link to claim <b>{formatTokenAmount(ethers.utils.formatEther(value), 3)} ECO</b> tokens.
              <Typography.Link href={blockExplorerLink(userOpResponse.transactionHash)} target="_blank">
                See transaction.
              </Typography.Link>
              <pre>{link}</pre>
            </Typography.Paragraph>
          </>
        ),
      });

      setAmount("");
    } catch (e) {
      console.error("[share:error]", e);
      alertApi.error({
        message: "Share failed",
        description: "Please contact us for help",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKey: InputProps["onKeyUp"] = event => {
    if (event.key === "Enter") return doSend();
  };

  const { exceedsBalance } = getValues({ amount, balance });
  const disabled = exceedsBalance || loading || !amount;

  return (
    <Space direction="vertical" size="large" align="center" style={{ width: "100%" }}>
      <Input
        type="number"
        size="large"
        min="0"
        pattern="\d*"
        placeholder="amount to send"
        value={amount}
        onKeyPress={handleKey}
        style={{ width: 320 }}
        onChange={e => setAmount(e.target.value)}
        prefix={<EcoLogo style={{ width: 20, height: 20 }} />}
      />

      <TokenFee fee={parseFloat(ethers.utils.formatEther(FLAT_FEE_AMOUNT))} />

      {exceedsBalance && amount ? (
        <div style={{ marginTop: 8 }}>
          <span style={{ color: "rgb(200,0,0)" }}>amount + fee exceeds balance</span>{" "}
        </div>
      ) : null}
      <Button
        key="submit"
        size="large"
        type="primary"
        onClick={doSend}
        loading={loading}
        disabled={disabled}
        icon={<SendOutlined />}
      >
        {!loading ? "Share" : "Creating Link..."}
      </Button>

      {alertElemt}
    </Space>
  );
};
