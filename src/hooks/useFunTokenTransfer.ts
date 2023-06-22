import { ethers } from "ethers";
import { hasWalletBeenDeployed } from "@helpers";
import { ERC20__factory } from "@assets/contracts";
import { FLAT_FEE_RECIPIENT } from "@contexts/StackupContext";
import { getSimpleAccount, useFunWallet } from "@contexts/FunWalletContext";
import { getTokenInfo, Token, VERIFYING_PAYMASTER_ADDRESS } from "@constants";

export const useFunTokenTransfer = (tokenId: Token) => {
  const { address, wallet, signer, provider } = useFunWallet();

  const transfer = async (t: string, amount: ethers.BigNumber, fee: ethers.BigNumber): Promise<string> => {
    const token = getTokenInfo(tokenId);
    const to = ethers.utils.getAddress(t);

    const erc20 = ERC20__factory.connect(token.address, provider);

    const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);
    const feeData = erc20.interface.encodeFunctionData("transfer", [FLAT_FEE_RECIPIENT, fee]);

    const simpleAccount = await getSimpleAccount(signer, provider);

    const hasBeenDeployed = await hasWalletBeenDeployed(provider, address);
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

    const res = await wallet.executeBatch(simpleAccount);
    return res.opHash;
  };

  return { transfer };
};
