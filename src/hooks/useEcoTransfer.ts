import { ethers } from "ethers";
import { useQuery } from "react-query";

import { useStackup } from "@contexts/StackupContext";
import { hasWalletBeenDeployed } from "@helpers/contracts";
import { ERC20__factory } from "@assets/contracts";
import { ECO_TOKEN_ADDRESS, VERIFYING_PAYMASTER_ADDRESS } from "@constants";

const ERC20_TRANSFER_GAS = 91_000;
const VALIDATION_GAS = 100_000;
const INIT_CODE_GAS = 385_266;

export const useEcoTransfer = () => {
  const { provider, simpleAccount, client } = useStackup();

  const buildOps = async (to: string, amount: ethers.BigNumber) => {
    if (!simpleAccount) return;

    const erc20 = ERC20__factory.connect(ECO_TOKEN_ADDRESS, provider);
    const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);

    const hasBeenDeployed = await hasWalletBeenDeployed(provider, simpleAccount.getSender());
    if (hasBeenDeployed) {
      simpleAccount.execute(erc20.address, 0, data);
    } else {
      // Execute transaction and approve Paymaster to spend tokens to pay gas fees in ECO tokens
      simpleAccount.executeBatch(
        [erc20.address, erc20.address],
        [
          data,
          erc20.interface.encodeFunctionData("approve", [VERIFYING_PAYMASTER_ADDRESS, ethers.constants.MaxUint256]),
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

  const { data: expectedGasFee } = useQuery(
    "expected-gas-fee-eco",
    async () => {
      if (!simpleAccount || !client) return ethers.constants.Zero;

      const provider = (client as any).provider as ethers.providers.JsonRpcProvider;
      const gasPrice = await provider.getGasPrice();

      let gas = ERC20_TRANSFER_GAS + VALIDATION_GAS;
      const hasBeenDeployed = await hasWalletBeenDeployed(provider, simpleAccount.getSender());
      if (!hasBeenDeployed) {
        gas += INIT_CODE_GAS;
      }

      return gasPrice.mul(gas);
    },
    { enabled: !!simpleAccount && !!client, initialData: ethers.constants.Zero },
  );

  return { transfer, expectedGasFee: expectedGasFee! };
};
