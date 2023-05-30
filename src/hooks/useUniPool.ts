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
import {
  ECO_TOKEN_ADDRESS,
  ENTRY_POINT_ADDRESS,
  ExecutionResult,
  MULTICALL3_ADDRESS,
  NETWORK,
  USDC_TOKEN_ADDRESS,
  VERIFYING_PAYMASTER_ADDRESS,
} from "@constants";
import { POOL_FACTORY_ADDRESS, QUOTER_V2_ADDRESS, SWAP_ROUTER_ADDRESS } from "@constants/uniswap";
import { ERC20__factory, Multicall3__factory, UniswapPoolV3__factory } from "@assets/contracts";

const USDC_TOKEN = new Token(NETWORK.chainId, USDC_TOKEN_ADDRESS, 6, "USDC", "USD Coin");
const ECO_TOKEN = new Token(NETWORK.chainId, ECO_TOKEN_ADDRESS, 18, "ECO", "ECO");

const TokenIn = USDC_TOKEN;
const TokenOut = ECO_TOKEN;

export const useUniPool = (provider: ethers.providers.JsonRpcProvider) => {
  const { address, signer, client } = useStackup();

  const getPool = useCallback(async () => {
    const currentPoolAddress = computePoolAddress({
      factoryAddress: POOL_FACTORY_ADDRESS,
      tokenA: TokenIn,
      tokenB: TokenOut,
      fee: FeeAmount.MEDIUM,
    });

    const multicall = Multicall3__factory.connect(MULTICALL3_ADDRESS, provider);
    const poolContract = UniswapPoolV3__factory.connect(currentPoolAddress, provider);

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

      const multicall = Multicall3__factory.connect(MULTICALL3_ADDRESS, provider);
      const tokenInterface = ERC20__factory.createInterface();

      const { returnData } = await multicall.callStatic.aggregate([
        {
          target: TokenIn.address,
          callData: tokenInterface.encodeFunctionData("allowance", [address, SWAP_ROUTER_ADDRESS]),
        },
        {
          target: TokenIn.address,
          callData: tokenInterface.encodeFunctionData("allowance", [address, VERIFYING_PAYMASTER_ADDRESS]),
        },
      ]);

      const [swapRouterAllowance, paymasterAllowance]: ethers.BigNumber[] = [
        tokenInterface.decodeFunctionResult("allowance", returnData[0])[0],
        tokenInterface.decodeFunctionResult("allowance", returnData[1])[0],
      ];

      const userOps: { to: string; data: string }[] = [];

      if (swapRouterAllowance.lt(amount)) {
        userOps.push({
          to: TokenIn.address,
          data: tokenInterface.encodeFunctionData("approve", [SWAP_ROUTER_ADDRESS, ethers.constants.MaxUint256]),
        });
      }

      if (paymasterAllowance.lt(ethers.utils.parseUnits("1000", 6))) {
        userOps.push({
          to: TokenIn.address,
          data: tokenInterface.encodeFunctionData("approve", [
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

      const balanceOfData = ERC20__factory.createInterface().encodeFunctionData("balanceOf", [userOp.sender]);
      const beforeBalance = await provider.call({ to: TokenIn.address, data: balanceOfData });

      const entryPointInterface = EntryPoint__factory.createInterface();
      const callResult = await provider.call({
        to: ENTRY_POINT_ADDRESS,
        data: entryPointInterface.encodeFunctionData("simulateHandleOp", [userOp, TokenIn.address, balanceOfData]),
      });

      const result = entryPointInterface.decodeErrorResult("ExecutionResult", callResult) as unknown as ExecutionResult;

      const expectedFee = ethers.BigNumber.from(beforeBalance).sub(result.targetResult).sub(amount);

      return expectedFee.mul(13).div(10);
    },
    [client, createsSwapTx, provider],
  );

  return { execute: executeTrade, getOutputQuote, simulateSwap };
};
