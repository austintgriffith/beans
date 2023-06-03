import { ethers } from "ethers";

import { FLAT_FEE_AMOUNT, FLAT_FEE_RECIPIENT, useStackup } from "@contexts/StackupContext";
import { hasWalletBeenDeployed } from "@helpers/contracts";
import { ERC20__factory } from "@assets/contracts";
import { ECO_TOKEN_ADDRESS, VERIFYING_PAYMASTER_ADDRESS } from "@constants";

export const useEcoTransfer = () => {
  const { provider, simpleAccount, client } = useStackup();

  const buildOps = async (to: string, amount: ethers.BigNumber) => {
    if (!simpleAccount) return;

    const erc20 = ERC20__factory.connect(ECO_TOKEN_ADDRESS, provider);
    const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);

    const feeData = erc20.interface.encodeFunctionData("transfer", [FLAT_FEE_RECIPIENT, FLAT_FEE_AMOUNT]);

    const hasBeenDeployed = await hasWalletBeenDeployed(provider, simpleAccount.getSender());
    if (hasBeenDeployed) {
      simpleAccount.executeBatch([erc20.address, ECO_TOKEN_ADDRESS], [data, feeData]);
    } else {
      // Execute transaction and approve Paymaster to spend tokens to pay gas fees in ECO tokens
      simpleAccount.executeBatch(
        [erc20.address, erc20.address, ECO_TOKEN_ADDRESS],
        [
          data,
          erc20.interface.encodeFunctionData("approve", [VERIFYING_PAYMASTER_ADDRESS, ethers.constants.MaxUint256]),
          feeData,
        ],
      );
    }
  };

  const transfer = async (t: string, amount: ethers.BigNumber): Promise<string> => {
    if (!client || !simpleAccount) return "";

    await buildOps(ethers.utils.getAddress(t), amount);

    const res = await client.sendUserOperation(simpleAccount);
    console.log("Waiting for transaction...");
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    return ev!.transactionHash;
  };

  return { transfer };
};
