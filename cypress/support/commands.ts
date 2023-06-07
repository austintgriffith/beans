import "cypress-wait-until";

Cypress.Commands.add("getById", (id, options) => cy.get(`[data-cy="${id}"]`, options));

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable<Subject> {
      getById(
        value: string,
        options?: Partial<Loggable & Timeoutable & Withinable & Shadow>,
      ): Chainable<JQuery<HTMLElement>>;
    }
  }
}
