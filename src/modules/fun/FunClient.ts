import { ethers } from "ethers";
import { IUserOperation } from "userop";

export class FunClient {
  static estimateUserOp(provider: ethers.providers.JsonRpcProvider, entryPoint: string, userOp: IUserOperation) {
    return FunClient.request({
      userOp,
      entryPointAddress: entryPoint,
      chainId: provider.network.chainId.toString(),
    });
  }

  private static request(
    data: any, // eslint-disable-line
  ): Promise<{ preVerificationGas: string; verificationGas: string; callGasLimit: string }> {
    return fetch(new URL("bundler/estimate-user-op-gas", "https://api.fun.xyz"), {
      mode: "cors",
      method: "POST",
      redirect: "manual",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json", "x-api-key": process.env.REACT_APP_FUN_WALLET_API_KEY! },
    }).then(async res => {
      const data = await res.json();
      if (typeof data.statusCode !== "undefined") throw new Error(data);
      return data;
    });
  }
}
