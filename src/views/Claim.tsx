import React, { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { useContractReader } from "eth-hooks";
import { Button, notification, Skeleton, Space, Typography } from "antd";
import { SendOutlined } from "@ant-design/icons";

import Peanut from "@modules/peanut";

import { PeanutV3__factory } from "@assets/contracts";
import { useStackup } from "@contexts/StackupContext";
import { ECO_TOKEN_ADDRESS, NETWORK } from "@constants";
import { PEANUT_V3_ADDRESS } from "@modules/peanut/constants";
import { blockExplorerLink, formatTokenAmount } from "@helpers";

import { ReactComponent as EcoLogo } from "@assets/images/eco-logo.svg";

interface ClaimProps {
  provider: ethers.providers.JsonRpcProvider;
}

export const Claim: React.FC<ClaimProps> = ({ provider }) => {
  const navigate = useNavigate();
  const { address } = useStackup();

  const [loading, setLoading] = useState(false);

  const { depositIdx, password } = Peanut.getParamsFromLink();

  const peanutV3 = useMemo(() => PeanutV3__factory.connect(PEANUT_V3_ADDRESS, provider), [provider]);
  const [deposit, , state] = useContractReader(peanutV3, peanutV3.deposits, [depositIdx!], undefined, {
    blockNumberInterval: 1,
    query: {
      retry: false,
      enabled: depositIdx !== undefined,
      select: deposit => ({ pubKey20: deposit[0], amount: deposit[1], tokenAddress: deposit[2] }),
    },
  });

  useEffect(() => {
    const goBack = () => navigate("/");
    if (!password || depositIdx === undefined || state === "error") {
      goBack();
    } else if (deposit) {
      const signerWallet = Peanut.generateKeysFromString(password);
      if (signerWallet.address !== deposit.pubKey20 || deposit.tokenAddress !== ECO_TOKEN_ADDRESS) {
        goBack();
      }
    }
  }, [deposit, depositIdx, navigate, password, state]);

  const doSend = async () => {
    if (!deposit || !password || depositIdx === undefined) return;
    setLoading(true);
    try {
      const response = await Peanut.sendClaimRequest({
        password,
        depositIdx,
        network: NETWORK.name,
        recipient: address,
      });

      // Wait 3s
      await new Promise(resolve => setTimeout(resolve, 3000));

      const tx = await provider.getTransaction(response.receipt.transactionHash);
      if (tx.wait) await tx.wait();

      notification.success({
        placement: "topRight",
        message: "Transfer Executed!",
        duration: 10000,
        description: (
          <>
            You have successfully claimed <b>{formatTokenAmount(ethers.utils.formatEther(deposit.amount), 3)} ECO</b>{" "}
            tokens. <br />
            <Typography.Link href={blockExplorerLink(response.receipt.transactionHash)} target="_blank">
              See transaction.
            </Typography.Link>
          </>
        ),
      });

      navigate("/");
    } catch (e) {
      console.log("[gasless:transfer]", e);
      notification.error({
        placement: "topRight",
        message: "Transfer failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" align="center" style={{ marginTop: 24 }}>
      <Space.Compact
        direction="horizontal"
        style={{ gap: 8, width: "100%", alignItems: "center", justifyContent: "center", minHeight: 38 }}
      >
        <EcoLogo style={{ width: 28, height: 28 }} />
        {deposit ? (
          <Typography.Title level={2} style={{ margin: 0 }}>
            {formatTokenAmount(parseFloat(ethers.utils.formatEther(deposit.amount)), 2)}
          </Typography.Title>
        ) : (
          <Skeleton.Input />
        )}
      </Space.Compact>
      <Button
        key="submit"
        size="large"
        type="primary"
        onClick={doSend}
        loading={loading}
        disabled={!deposit}
        icon={<SendOutlined />}
      >
        Claim
      </Button>
    </Space>
  );
};
