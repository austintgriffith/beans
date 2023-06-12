import Loggable = Cypress.Loggable;
import Timeoutable = Cypress.Timeoutable;
import Withinable = Cypress.Withinable;
import Shadow = Cypress.Shadow;

export class Share {
  getInputAmount() {
    return cy.getById("share-input-amount");
  }
  getSendBtn() {
    return cy.getById("share-send-btn");
  }
  getInsufficientFundsAlert() {
    return cy.getById("share-insufficient-funds");
  }
  getAlert(options?: Partial<Loggable & Timeoutable & Withinable & Shadow>) {
    return cy.get(".share-alert", options);
  }
  getShareLink() {
    return this.getAlert().find("pre");
  }
}
