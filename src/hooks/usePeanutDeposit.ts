import { useCallback } from "react";
import { ethers } from "ethers";

import Peanut from "@modules/peanut";
import { ERC20__factory } from "@assets/contracts";
import { useStackup } from "@contexts/StackupContext";
import { ECO_TOKEN_ADDRESS, ENTRY_POINT_ADDRESS, ExecutionResult, VERIFYING_PAYMASTER_ADDRESS } from "@constants";
import { PEANUT_V3_ADDRESS } from "@modules/peanut/constants";
import { EntryPoint__factory } from "userop/dist/typechain";
import { hasWalletBeenDeployed } from "@helpers/contracts";

export const usePeanutDeposit = () => {
  const { address, provider, simpleAccount, client } = useStackup();

  const buildOps = useCallback(
    async (value: ethers.BigNumber, password?: string) => {
      const { transaction } = await Peanut.makeDeposit(value, password);

      const eco = ERC20__factory.connect(ECO_TOKEN_ADDRESS, provider);

      const peanutAllowance = await eco.allowance(address, PEANUT_V3_ADDRESS);
      const paymasterAllowance = await eco.allowance(address, VERIFYING_PAYMASTER_ADDRESS);

      const txs = [transaction];

      if (peanutAllowance.lt(value)) {
        const data = ERC20__factory.createInterface().encodeFunctionData("approve", [PEANUT_V3_ADDRESS, value]);
        txs.push({ to: ECO_TOKEN_ADDRESS, data });
      }

      if (paymasterAllowance.lt(ethers.constants.WeiPerEther.mul(10_000))) {
        // If paymaster's allowance is less than 10.000 ECO tokens
        // Include token approval for paymaster to pay gas in ECO tokens
        const data = ERC20__factory.createInterface().encodeFunctionData("approve", [
          VERIFYING_PAYMASTER_ADDRESS,
          ethers.constants.MaxUint256,
        ]);
        txs.push({ to: ECO_TOKEN_ADDRESS, data });
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

  const deposit = async (amount: ethers.BigNumber, password: string) => {
    await buildOps(amount, password);

    const res = await client.sendUserOperation(simpleAccount);
    return res.wait();
  };

  const simulateDeposit = useCallback(async () => {
    try {
      const amount = ethers.BigNumber.from(1);
      await buildOps(amount);

      const userOp = await client.buildUserOperation(simpleAccount);

      const balanceOfData = ERC20__factory.createInterface().encodeFunctionData("balanceOf", [userOp.sender]);
      const beforeBalance = await provider.call({ to: ECO_TOKEN_ADDRESS, data: balanceOfData });

      const entryPointInterface = EntryPoint__factory.createInterface();
      const callResult = await provider.call({
        to: ENTRY_POINT_ADDRESS,
        data: entryPointInterface.encodeFunctionData("simulateHandleOp", [userOp, ECO_TOKEN_ADDRESS, balanceOfData]),
      });

      const result = entryPointInterface.decodeErrorResult("ExecutionResult", callResult) as unknown as ExecutionResult;

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
  }, [buildOps, client, provider, simpleAccount]);

  return { deposit, simulateDeposit };
};
