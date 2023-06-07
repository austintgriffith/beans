import { ethers } from "ethers";

// Helpers
import { fundWallet } from "../helpers/wallet";

// Pages
import { Home } from "../pages/home/home";
import { Claim } from "../pages/claim/claim";

import { getParamsFromLink } from "@modules/peanut/utils";

const homePage = new Home();
const claimPage = new Claim();

const wallet = ethers.Wallet.createRandom();
const faucetWallet = new ethers.Wallet(Cypress.env("CYPRESS_FAUCET_PK"));

let deposit: { depositIdx: number; password: string };

const pageOptions = {
  onBeforeLoad(win) {
    // eth-hooks' useBurnerSigner reads from localStorage to initialize the burner wallet
    win.localStorage.setItem("scaffold-eth-burner-privateKey", wallet.privateKey);
  },
};

describe("App", () => {
  before(() => {
    return cy.wrap(fundWallet(wallet, faucetWallet), { timeout: 10_000 });
  });

  describe("Home", () => {
    beforeEach(() => {
      homePage.visit(pageOptions);
    });

    it("should fetch correct balance", () => {
      homePage.getBalance().should("contain.text", "1.50");
    });

    context("Transfer", () => {
      it("should transfer tokens to faucet wallet", () => {
        homePage.transfer.getInputRecipient().type(faucetWallet.address);
        homePage.transfer.getInputAmount().type("0.1");
        homePage.transfer.getSendBtn().click();

        homePage.transfer.getAlert({ timeout: 20_000 }).should("be.visible");
        homePage.transfer.getAlert().should("contain.text", "Transfer Executed");
      });

      it("should display insufficient funds balance", () => {
        homePage.transfer.getInputRecipient().type(faucetWallet.address);
        homePage.transfer.getInputAmount().type("10");

        homePage.transfer.getInsufficientFundsAlert().should("contain.text", "exceeds balance");
        homePage.transfer.getSendBtn().should("be.disabled");
      });
    });

    context("Share", () => {
      beforeEach(() => {
        homePage.getShareBtn().click();
      });

      it("should share tokens using links", () => {
        homePage.share.getInputAmount().type("0.3");
        homePage.share.getSendBtn().click();

        homePage.share.getAlert({ timeout: 20_000 }).should("be.visible");
        homePage.share.getAlert().should("contain.text", "Share link created");

        homePage.share.getShareLink().then(element => {
          const { depositIdx, password } = getParamsFromLink(element.get(0).innerText);

          expect(depositIdx).to.not.be.undefined;
          expect(password).to.not.be.null;

          deposit = { depositIdx: depositIdx!, password: password! };
        });
      });

      it("should display insufficient funds balance", () => {
        homePage.share.getInputAmount().type("10");

        homePage.share.getInsufficientFundsAlert().should("contain.text", "exceeds balance");
        homePage.share.getSendBtn().should("be.disabled");
      });
    });
  });

  describe("Claim", () => {
    before(() => {
      if (!deposit) throw new Error("Claim link not created successfully");
      claimPage.visit(deposit.depositIdx.toString(), deposit.password, pageOptions);
    });

    it("should claim link", () => {
      claimPage.getClaimAmount().should("contain.text", "0.3");
      claimPage.getClaimBtn().click();
      claimPage.getClaimBtn().should("be.disabled");

      cy.waitUntil(() => homePage.getBalance({ timeout: 20_000 }).then(elemt => elemt.get(0).innerText === "0.56"), {
        timeout: 25_000,
        interval: 1000,
      });

      cy.url().should("not.include", "claim");
    });
  });
});
