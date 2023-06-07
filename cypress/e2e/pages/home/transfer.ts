import Loggable = Cypress.Loggable;
import Timeoutable = Cypress.Timeoutable;
import Withinable = Cypress.Withinable;
import Shadow = Cypress.Shadow;

export class Transfer {
  getInputAmount() {
    return cy.getById("transfer-input-amount");
  }
  getInputRecipient() {
    return cy.getById("transfer-input-recipient");
  }
  getSendBtn() {
    return cy.getById("transfer-send-btn");
  }
  getInsufficientFundsAlert() {
    return cy.getById("transfer-insufficient-funds");
  }
  getAlert(options?: Partial<Loggable & Timeoutable & Withinable & Shadow>) {
    return cy.get(".transfer-alert", options);
  }
}
