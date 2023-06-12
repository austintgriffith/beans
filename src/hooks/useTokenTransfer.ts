import { ethers } from "ethers";

import { FLAT_FEE_RECIPIENT, useStackup } from "@contexts/StackupContext";
import { hasWalletBeenDeployed } from "@helpers/contracts";
import { ERC20__factory } from "@assets/contracts";
import { getTokenInfo, Token, VERIFYING_PAYMASTER_ADDRESS } from "@constants";

export const useTokenTransfer = (tokenId: Token) => {
  const { provider, simpleAccount, client } = useStackup();

  const buildOps = async (to: string, amount: ethers.BigNumber, fee: ethers.BigNumber) => {
    if (!simpleAccount) return;

    const token = getTokenInfo(tokenId);

    const erc20 = ERC20__factory.connect(token.address, provider);
    const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);

    const feeData = erc20.interface.encodeFunctionData("transfer", [FLAT_FEE_RECIPIENT, fee]);

    const hasBeenDeployed = await hasWalletBeenDeployed(provider, simpleAccount.getSender());
    if (hasBeenDeployed) {
      simpleAccount.executeBatch([erc20.address, token.address], [data, feeData]);
    } else {
      // Execute transaction and approve Paymaster to spend tokens to pay gas fees in ECO tokens
      simpleAccount.executeBatch(
        [erc20.address, erc20.address, token.address],
        [
          data,
          erc20.interface.encodeFunctionData("approve", [VERIFYING_PAYMASTER_ADDRESS, ethers.constants.MaxUint256]),
          feeData,
        ],
      );
    }
  };

  const transfer = async (t: string, amount: ethers.BigNumber, fee: ethers.BigNumber): Promise<string> => {
    if (!client || !simpleAccount) return "";

    await buildOps(ethers.utils.getAddress(t), amount, fee);

    const res = await client.sendUserOperation(simpleAccount);
    console.log("Waiting for transaction...");
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    return ev!.transactionHash;
  };

  return { transfer };
};
