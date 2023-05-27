import { useCallback } from "react";
import { ethers } from "ethers";
import { EntryPoint__factory } from "userop/dist/typechain";
import { Currency, CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import {
  computePoolAddress,
  FeeAmount,
  Pool,
  Route,
  SwapOptions,
  SwapQuoter,
  SwapRouter,
  Trade,
} from "@uniswap/v3-sdk";

import { getSimpleAccount, useStackup, VERIFYING_PAYMASTER_USDC } from "@contexts/StackupContext";
import { UNISWAP_V3_POOL_ABI } from "@assets/abis/uniswap";
import {
  ECO_TOKEN_ADDRESS,
  MULTICALL3_ADDRESS,
  NETWORK,
  USDC_TOKEN_ADDRESS,
  VERIFYING_PAYMASTER_ADDRESS,
} from "@constants";
import { ERC20_ABI, MULTICALL3_ABI } from "@assets/abis";
import { POOL_FACTORY_ADDRESS, QUOTER_V2_ADDRESS, SWAP_ROUTER_ADDRESS } from "../constants/uniswap";

const USDC_TOKEN = new Token(NETWORK.chainId, USDC_TOKEN_ADDRESS, 6, "USDC", "USD Coin");
const ECO_TOKEN = new Token(NETWORK.chainId, ECO_TOKEN_ADDRESS, 18, "ECO", "ECO");

const TokenIn = USDC_TOKEN;
const TokenOut = ECO_TOKEN;

interface ExecutionResult {
  paid: ethers.BigNumber;
  preOpGas: ethers.BigNumber;
  targetResult: string;
  targetSuccess: boolean;
  validAfter: number;
  validUntil: number;
}

export const useUniPool = (provider: ethers.providers.JsonRpcProvider) => {
  const { address, signer, client } = useStackup();

  const getPool = useCallback(async () => {
    const currentPoolAddress = computePoolAddress({
      factoryAddress: POOL_FACTORY_ADDRESS,
      tokenA: TokenIn,
      tokenB: TokenOut,
      fee: FeeAmount.MEDIUM,
    });

    const multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
    const poolContract = new ethers.Contract(currentPoolAddress, UNISWAP_V3_POOL_ABI, provider);

    const { returnData } = await multicall.callStatic.aggregate([
      { target: poolContract.address, callData: poolContract.interface.encodeFunctionData("liquidity") },
      { target: poolContract.address, callData: poolContract.interface.encodeFunctionData("slot0") },
    ]);

    const [liquidity, slot0] = [
      poolContract.interface.decodeFunctionResult("liquidity", returnData[0])[0],
      poolContract.interface.decodeFunctionResult("slot0", returnData[1]),
    ];

    const sqrtPriceX96 = slot0[0];
    const tick = slot0[1];

    const pool = new Pool(TokenIn, TokenOut, FeeAmount.MEDIUM, sqrtPriceX96.toString(), liquidity.toString(), tick);
    const route = new Route([pool], TokenIn, TokenOut);

    return { pool, route };
  }, [provider]);

  const getOutputQuote = useCallback(
    async (amount: ethers.BigNumberish, route?: Route<Currency, Currency>): Promise<ethers.BigNumber> => {
      if (!route) route = (await getPool()).route;

      const { calldata } = await SwapQuoter.quoteCallParameters(
        route,
        CurrencyAmount.fromRawAmount(TokenIn, amount.toString()),
        TradeType.EXACT_INPUT,
        { useQuoterV2: true },
      );

      const quoteCallReturnData = await provider.call({
        to: QUOTER_V2_ADDRESS,
        data: calldata,
      });

      return ethers.utils.defaultAbiCoder.decode(["uint256"], quoteCallReturnData)[0];
    },
    [getPool, provider],
  );

  const createTrade = useCallback(
    async (amount: ethers.BigNumberish) => {
      const { route } = await getPool();
      const amountOut = await getOutputQuote(amount, route);
      return Trade.createUncheckedTrade({
        route: route,
        tradeType: TradeType.EXACT_INPUT,
        inputAmount: CurrencyAmount.fromRawAmount(TokenIn, amount.toString()),
        outputAmount: CurrencyAmount.fromRawAmount(TokenOut, amountOut.toString()),
      });
    },
    [getOutputQuote, getPool],
  );

  const createsSwapTx = useCallback(
    async (amount: ethers.BigNumberish) => {
      const trade = await createTrade(amount);

      const options: SwapOptions = {
        recipient: address,
        deadline: Math.floor(Date.now() / 1000) + 60 * 20,
        slippageTolerance: new Percent(50, 10_000), // 50 bips, or 0.50%
      };
      const methodParameters = SwapRouter.swapCallParameters([trade], options);

      const multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
      const tokenContract = new ethers.Contract(TokenIn.address, ERC20_ABI);

      const { returnData } = await multicall.callStatic.aggregate([
        {
          target: tokenContract.address,
          callData: tokenContract.interface.encodeFunctionData("allowance", [address, SWAP_ROUTER_ADDRESS]),
        },
        {
          target: tokenContract.address,
          callData: tokenContract.interface.encodeFunctionData("allowance", [address, VERIFYING_PAYMASTER_ADDRESS]),
        },
      ]);

      const [swapRouterAllowance, paymasterAllowance]: ethers.BigNumber[] = [
        tokenContract.interface.decodeFunctionResult("allowance", returnData[0])[0],
        tokenContract.interface.decodeFunctionResult("allowance", returnData[1])[0],
      ];

      const userOps: { to: string; data: string }[] = [];

      if (swapRouterAllowance.lt(amount)) {
        userOps.push({
          to: TokenIn.address,
          data: tokenContract.interface.encodeFunctionData("approve", [
            SWAP_ROUTER_ADDRESS,
            ethers.constants.MaxUint256,
          ]),
        });
      }

      if (paymasterAllowance.lt(ethers.utils.parseUnits("1000", 6))) {
        userOps.push({
          to: TokenIn.address,
          data: tokenContract.interface.encodeFunctionData("approve", [
            VERIFYING_PAYMASTER_ADDRESS,
            ethers.constants.MaxUint256,
          ]),
        });
      }

      userOps.push({ to: SWAP_ROUTER_ADDRESS, data: methodParameters.calldata });

      const simpleAccount = await getSimpleAccount(signer, VERIFYING_PAYMASTER_USDC);
      simpleAccount.executeBatch(
        userOps.map(userOp => userOp.to),
        userOps.map(userOp => userOp.data),
      );

      return { simpleAccount, trade };
    },
    [address, createTrade, provider, signer],
  );

  const executeTrade = useCallback(
    async (amount: ethers.BigNumberish): Promise<string> => {
      const { simpleAccount } = await createsSwapTx(amount);
      const req = await client!.sendUserOperation(simpleAccount);
      const res = await req.wait();
      if (!res) throw new Error("Execution failed");
      console.log("tx hash", res.transactionHash);
      return res.transactionHash;
    },
    [client, createsSwapTx],
  );

  const simulateSwap = useCallback(
    async (amount: ethers.BigNumberish) => {
      const { simpleAccount } = await createsSwapTx(amount);
      const userOp = await client!.buildUserOperation(simpleAccount);

      const tokenContract = new ethers.Contract(TokenIn.address, ERC20_ABI);

      const balanceOfData = tokenContract.interface.encodeFunctionData("balanceOf", [userOp.sender]);
      const beforeBalance = await provider.call({ to: tokenContract.address, data: balanceOfData });

      const entryPointInterface = EntryPoint__factory.createInterface();
      const callResult = await provider.call({
        to: "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789",
        data: entryPointInterface.encodeFunctionData("simulateHandleOp", [
          userOp,
          tokenContract.address,
          balanceOfData,
        ]),
      });

      const result = entryPointInterface.decodeErrorResult("ExecutionResult", callResult) as unknown as ExecutionResult;

      const expectedFee = ethers.BigNumber.from(beforeBalance).sub(result.targetResult).sub(amount);

      return expectedFee.mul(13).div(10);
    },
    [client, createsSwapTx, provider],
  );

  return { execute: executeTrade, getOutputQuote, simulateSwap };
};
