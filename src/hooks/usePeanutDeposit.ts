import { useCallback } from "react";
import { ethers } from "ethers";

import * as Peanut from "@modules/peanut";
import { ERC20__factory } from "@assets/contracts";
import { FLAT_FEE_RECIPIENT, useStackup } from "@contexts/StackupContext";
import { ENTRY_POINT_ADDRESS, ExecutionResult, getTokenInfo, Token, VERIFYING_PAYMASTER_ADDRESS } from "@constants";
import { PEANUT_V3_ADDRESS } from "@modules/peanut/constants";
import { EntryPoint__factory } from "userop/dist/typechain";
import { hasWalletBeenDeployed } from "@helpers/contracts";

export const usePeanutDeposit = () => {
  const { address, provider, simpleAccount, client } = useStackup();

  const buildOps = useCallback(
    async (tokenId: Token, value: ethers.BigNumber, fee: ethers.BigNumber, password?: string) => {
      const token = getTokenInfo(tokenId);
      const { transaction } = await Peanut.makeDeposit(token.address, value, password);

      const erc20 = ERC20__factory.connect(token.address, provider);

      const peanutAllowance = await erc20.allowance(address, PEANUT_V3_ADDRESS);
      const paymasterAllowance = await erc20.allowance(address, VERIFYING_PAYMASTER_ADDRESS);

      const feeData = erc20.interface.encodeFunctionData("transfer", [FLAT_FEE_RECIPIENT, fee]);
      const feeTx = { to: token.address, data: feeData };

      const txs = [feeTx, transaction];

      if (peanutAllowance.lt(value)) {
        const data = ERC20__factory.createInterface().encodeFunctionData("approve", [PEANUT_V3_ADDRESS, value]);
        txs.push({ to: token.address, data });
      }

      if (paymasterAllowance.lt(ethers.constants.WeiPerEther.mul(10_000))) {
        // If paymaster's allowance is less than 10.000 ECO tokens
        // Include token approval for paymaster to pay gas in ECO tokens
        const data = ERC20__factory.createInterface().encodeFunctionData("approve", [
          VERIFYING_PAYMASTER_ADDRESS,
          ethers.constants.MaxUint256,
        ]);
        txs.push({ to: token.address, data });
      }

      // Reverse order of transactions to execute token approvals first
      txs.reverse();

      simpleAccount.executeBatch(
        txs.map(tx => tx.to),
        txs.map(tx => tx.data),
      );
    },
    [address, provider, simpleAccount],
  );

  const deposit = async (token: Token, password: string, amount: ethers.BigNumber, fee: ethers.BigNumber) => {
    await buildOps(token, amount, fee, password);

    const res = await client.sendUserOperation(simpleAccount);
    return res.wait();
  };

  const simulateDeposit = useCallback(
    async (tokenId: Token) => {
      try {
        const token = getTokenInfo(tokenId);
        const amount = ethers.BigNumber.from(1);
        await buildOps(tokenId, amount, amount);

        const userOp = await client.buildUserOperation(simpleAccount);

        const balanceOfData = ERC20__factory.createInterface().encodeFunctionData("balanceOf", [userOp.sender]);
        const beforeBalance = await provider.call({ to: token.address, data: balanceOfData });

        const entryPointInterface = EntryPoint__factory.createInterface();
        const callResult = await provider.call({
          to: ENTRY_POINT_ADDRESS,
          data: entryPointInterface.encodeFunctionData("simulateHandleOp", [userOp, token.address, balanceOfData]),
        });

        const result = entryPointInterface.decodeErrorResult(
          "ExecutionResult",
          callResult,
        ) as unknown as ExecutionResult;

        return ethers.BigNumber.from(beforeBalance).sub(result.targetResult).sub(amount);
      } catch (e) {
        const gasPrice = await provider.getGasPrice();

        const PEANUT_DEPOSIT_GAS = 80_000;
        const VALIDATION_GAS = 100_000;
        const INIT_CODE_GAS = 385_266;

        const hasBeenDeployed = await hasWalletBeenDeployed(provider, simpleAccount.getSender());

        let gas = PEANUT_DEPOSIT_GAS + VALIDATION_GAS;
        if (!hasBeenDeployed) gas += INIT_CODE_GAS;

        return gasPrice.mul(gas);
      }
    },
    [buildOps, client, provider, simpleAccount],
  );

  return { deposit, simulateDeposit };
};
