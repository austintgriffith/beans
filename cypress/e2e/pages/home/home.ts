import { Header } from "../header";
import { Transfer } from "./transfer";
import { Share } from "./share";

import Loggable = Cypress.Loggable;
import Timeoutable = Cypress.Timeoutable;
import Withinable = Cypress.Withinable;
import Shadow = Cypress.Shadow;

import VisitOptions = Cypress.VisitOptions;

export class Home {
  constructor(
    public readonly header = new Header(),
    public readonly transfer = new Transfer(),
    public readonly share = new Share(),
  ) {}

  visit(options?: Partial<VisitOptions>) {
    cy.visit("/", options);
  }

  getTransferBtn() {
    return cy.getById("home-segments").find("label:nth-child(1)");
  }

  getShareBtn() {
    return cy.getById("home-segments").find("label:nth-child(2)");
  }

  getBalance(options?: Partial<Loggable & Timeoutable & Withinable & Shadow>) {
    return cy.getById("home-balance", options);
  }
}
