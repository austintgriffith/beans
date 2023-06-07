import { Header } from "../header";

import VisitOptions = Cypress.VisitOptions;

export class Claim {
  constructor(public readonly header = new Header()) {}

  visit(id: string, password: string, options?: Partial<VisitOptions>) {
    cy.visit(`/claim?i=${id}&p=${password}`, options);
  }

  getClaimBtn() {
    return cy.getById("claim-btn");
  }

  getClaimAmount() {
    return cy.getById("claim-amount");
  }
}
