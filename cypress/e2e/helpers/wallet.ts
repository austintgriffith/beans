import { ethers } from "ethers";
import { ERC20__factory } from "@assets/contracts/factories";
import { SimpleAccount } from "userop/dist/preset/builder";

export async function fundWallet(wallet: ethers.Wallet, faucetWallet: ethers.Wallet) {
  const provider = new ethers.providers.StaticJsonRpcProvider(Cypress.env("CYPRESS_RPC_URL"));
  const eco = ERC20__factory.connect(Cypress.env("REACT_APP_ECO_TOKEN_ADDRESS"), faucetWallet.connect(provider));

  const simpleAccount = await SimpleAccount.init(
    wallet,
    Cypress.env("CYPRESS_RPC_URL"),
    // TODO: Remove after upgrading to userop:v0.3.0 (not released yet)
    "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    "0x9406Cc6185a346906296840746125a0E44976454",
  );

  // Fund Wallet with 1.5 ECO tokens
  const tx = await eco.transfer(simpleAccount.getSender(), ethers.utils.parseEther("1.5"));
  await tx.wait();
}
