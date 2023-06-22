import { Address, Hex, toBytes } from "viem";
import { ethers } from "ethers";
import {
  Chain,
  configureEnvironment,
  Eoa,
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
import { FunClient } from "./FunClient";

const defaultChain = NETWORK.chainId;

export class FunSimpleAccount extends FunWallet {
  async executeBatch(
    simpleAccount: SimpleAccount,
    _chain: string | Chain | number = defaultChain,
  ): Promise<ExecutionReceipt> {
    const chain = await getChainFromData(_chain);
    const _simpleAccount = simpleAccount as any;
    const provider: ethers.providers.JsonRpcProvider = _simpleAccount.provider;

    await configureEnvironment({
      chain,
      apiKey: process.env.REACT_APP_FUN_WALLET_API_KEY!,
      // gasSponsor: {
      //   sponsorAddress: "0x175C5611402815Eba550Dad16abd2ac366a63329",
      //   token: ECO_TOKEN_ADDRESS,
      // },
      // fee: {
      //   amount: 20, // 20 ECO
      //   recipient: FLAT_FEE_RECIPIENT as Hex,
      //   token: ECO_TOKEN_ADDRESS,
      // },
    });

    simpleAccount
      .resetMiddleware()
      .useMiddleware(_simpleAccount.resolveAccount)
      .useMiddleware(estimateUserOperationGas(provider))
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

    const est = await FunClient.estimateUserOp(provider, ctx.entryPoint, OpToJSON(ctx.op));

    ctx.op.preVerificationGas = est.preVerificationGas;
    ctx.op.verificationGasLimit = est.verificationGas;
    ctx.op.callGasLimit = est.callGasLimit;
  };

export class EoaSimpleAccount extends Eoa {
  async signHash(hash: Hex) {
    console.log("hash", hash);
    await this.init();
    if (this.signer?.type === "local") {
      const signature = await this.signer.signMessage({ message: { raw: ethers.utils.arrayify(hash) } });
      console.log("in", signature);
      return signature;
    } else if (this.client && this.account) {
      return this.client.signMessage({ account: this.account, message: { raw: toBytes(hash) } });
    } else {
      throw new Error("No signer or client");
    }
  }
}
