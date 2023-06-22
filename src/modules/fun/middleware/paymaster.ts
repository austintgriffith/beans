import { ethers } from "ethers";
import { UserOperationMiddlewareFn } from "userop";
import { FlatVerifyingPaymaster__factory } from "@assets/contracts";
import { OpToJSON } from "userop/dist/utils";
import { UserOperationStruct } from "@assets/contracts/FlatVerifyingPaymaster";
import { FLAT_FEE_AMOUNT } from "@hooks/useOperationFee";
import { getTokenInfo, Token } from "@constants";

// TODO: This logic needs to be moved to a server. FOR TESTING PURPOSES ONLY
const signingWallet = new ethers.Wallet(process.env.REACT_APP_SIGNING_WALLET_PRIVATE_KEY!);

export const flatVerifyingPaymaster =
  (provider: ethers.providers.JsonRpcProvider, paymasterAddress: string, simulate = false): UserOperationMiddlewareFn =>
  async ctx => {
    if (simulate) {
      ctx.op.verificationGasLimit = ethers.BigNumber.from(ctx.op.verificationGasLimit).mul(3);
    }

    const paymaster = FlatVerifyingPaymaster__factory.connect(paymasterAddress, provider);

    const validAfter = Math.floor(Date.now() / 1000);
    const validUntil = Math.floor(Date.now() / 1000) + 60 * 10;

    const token = getTokenInfo(Token.ECO, provider.network.chainId);

    const data = ethers.utils.defaultAbiCoder.encode(
      ["uint48", "uint48", "address", "uint256"],
      [validUntil, validAfter, token.address, FLAT_FEE_AMOUNT],
    );
    ctx.op.paymasterAndData = paymasterAddress + data.slice(2) + "0".repeat(128);

    const hash = await paymaster.getHash(
      OpToJSON(ctx.op) as UserOperationStruct,
      validUntil,
      validAfter,
      token.address,
      FLAT_FEE_AMOUNT,
    );

    const signature = await signingWallet.signMessage(ethers.utils.arrayify(hash));
    ctx.op.paymasterAndData = paymasterAddress + data.slice(2) + signature.slice(2);
  };
