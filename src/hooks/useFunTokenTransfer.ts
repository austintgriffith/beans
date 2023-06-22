import { ethers } from "ethers";
import { hasWalletBeenDeployed } from "@helpers";
import { ERC20__factory } from "@assets/contracts";
import { getSimpleAccount, useFunWallet } from "@contexts/FunWalletContext";
import { getNetworkById, getTokenInfo, NETWORK, Token } from "@constants";
import { useMemo } from "react";
import {
  FLAT_VERIFYING_PAYMASTER_ADDRESS_BASE,
  FLAT_VERIFYING_PAYMASTER_ADDRESS_OPTIMISM,
} from "@modules/fun/FunSimpleAccount";

export const useFunTokenTransfer = (tokenId: Token, network = NETWORK.chainId) => {
  const { address, wallet, signer } = useFunWallet();

  const provider = useMemo(() => new ethers.providers.StaticJsonRpcProvider(getNetworkById(network)!.rpcUrl), []);

  const transfer = async (t: string, amount: ethers.BigNumber): Promise<string> => {
    const token = getTokenInfo(tokenId, network);
    const to = ethers.utils.getAddress(t);

    const erc20 = ERC20__factory.connect(token.address, provider);

    const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);

    const simpleAccount = await getSimpleAccount(signer, provider);

    const paymasterAddress = getNetworkById(network)?.name?.includes("base")
      ? FLAT_VERIFYING_PAYMASTER_ADDRESS_BASE
      : FLAT_VERIFYING_PAYMASTER_ADDRESS_OPTIMISM;

    const hasBeenDeployed = await hasWalletBeenDeployed(provider, address);

    const allowance = await erc20.allowance(address, paymasterAddress);
    const hasEnoughAllowance = allowance.gte(ethers.utils.parseUnits("1000", token.decimals));

    if (hasBeenDeployed && hasEnoughAllowance) {
      simpleAccount.execute(erc20.address, 0, data);
    } else {
      // Execute transaction and approve Paymaster to spend tokens to pay gas fees in ECO tokens
      simpleAccount.executeBatch(
        [erc20.address, erc20.address],
        [data, erc20.interface.encodeFunctionData("approve", [paymasterAddress, ethers.constants.MaxUint256])],
      );
    }

    const res = await wallet.executeBatch(simpleAccount, network);
    return res.txid!;
  };

  return { transfer };
};
