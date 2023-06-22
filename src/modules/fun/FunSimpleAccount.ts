import { Address, Hex } from "viem";
import { ethers } from "ethers";
import {
  Chain,
  configureEnvironment,
  ExecutionReceipt,
  FunWallet,
  getChainFromData,
  UserOp,
  UserOperation,
} from "fun-wallet";

import { UserOperationMiddlewareFn } from "userop";
import { OpToJSON } from "userop/dist/utils";
import { SimpleAccount } from "userop/dist/preset/builder";
import { EOASignature } from "userop/dist/preset/middleware";

import { NETWORK } from "@constants";
import { getSimpleAccount } from "@contexts/StackupContext";
import { flatVerifyingPaymaster } from "@modules/fun/middleware/paymaster";

import { FunClient } from "./FunClient";

const defaultChain = NETWORK.chainId;

export const FLAT_VERIFYING_PAYMASTER_ADDRESS_OPTIMISM = "0xe459a01E604497C879E77e5203b3fFFc335BdeA0"; // Goerli-Optimism
export const FLAT_VERIFYING_PAYMASTER_ADDRESS_BASE = "0xAb1D243b07e99C91dE9E4B80DFc2B07a8332A2f7"; // Goerli-Base

export class FunSimpleAccount extends FunWallet {
  async executeBatch(
    simpleAccount: SimpleAccount,
    _chain: string | Chain | number = defaultChain,
  ): Promise<ExecutionReceipt> {
    const chain = await getChainFromData(_chain);
    // eslint-disable-next-line
    const _simpleAccount = simpleAccount as any;
    const provider: ethers.providers.JsonRpcProvider = _simpleAccount.provider;

    await configureEnvironment({
      chain,
      apiKey: process.env.REACT_APP_FUN_WALLET_API_KEY!,
    });

    await chain.init();

    const paymasterAddress = chain.name?.includes("base")
      ? FLAT_VERIFYING_PAYMASTER_ADDRESS_BASE
      : FLAT_VERIFYING_PAYMASTER_ADDRESS_OPTIMISM;

    simpleAccount
      .resetMiddleware()
      .useMiddleware(_simpleAccount.resolveAccount)
      .useMiddleware(flatVerifyingPaymaster(provider, paymasterAddress, true))
      .useMiddleware(estimateUserOperationGas(provider))
      .useMiddleware(flatVerifyingPaymaster(provider, paymasterAddress))
      .useMiddleware(EOASignature(_simpleAccount.signer));

    const userOpRaw = await simpleAccount.buildOp(_simpleAccount.entryPoint.address, provider.network.chainId);
    const userOp = new UserOp(userOpRaw as UserOperation);
    const response = await this.sendTx(userOp);
    simpleAccount.resetOp();
    return response;
  }

  async getAddress(): Promise<Address> {
    if (!this.address) {
      const signer = new ethers.Wallet(this.identifier.uniqueId);
      const simpleAccount = await getSimpleAccount(signer);
      this.address = simpleAccount.getSender() as Hex;
    }
    return this.address;
  }
}

const estimateCreationGas = async (
  provider: ethers.providers.JsonRpcProvider,
  initCode: ethers.BytesLike,
): Promise<ethers.BigNumber> => {
  const initCodeHex = ethers.utils.hexlify(initCode);
  const factory = initCodeHex.substring(0, 42);
  const callData = "0x" + initCodeHex.substring(42);
  return await provider.estimateGas({
    to: factory,
    data: callData,
  });
};

const estimateUserOperationGas =
  (provider: ethers.providers.JsonRpcProvider): UserOperationMiddlewareFn =>
  async ctx => {
    if (ethers.BigNumber.from(ctx.op.nonce).isZero()) {
      ctx.op.verificationGasLimit = ethers.BigNumber.from(ctx.op.verificationGasLimit).add(
        await estimateCreationGas(provider, ctx.op.initCode),
      );
    }

    ctx.op.maxFeePerGas = (await provider.getGasPrice()).toHexString();

    const est = await FunClient.estimateUserOp(provider, ctx.entryPoint, OpToJSON(ctx.op));

    ctx.op.callGasLimit = est.callGasLimit;
    ctx.op.preVerificationGas = est.preVerificationGas;
    ctx.op.verificationGasLimit = est.verificationGas;

    const MINIMUM_CALL_GAS_LIMIT = 200_000;
    if (ethers.BigNumber.from(ctx.op.callGasLimit).lte(MINIMUM_CALL_GAS_LIMIT)) {
      ctx.op.callGasLimit = ethers.BigNumber.from(MINIMUM_CALL_GAS_LIMIT).toHexString();
    }
  };
