export class Header {
  getHomeBtn() {
    return cy.getById("header-home-btn");
  }

  getAboutBtn() {
    return cy.getById("header-about-btn");
  }

  getConfigBtn() {
    return cy.getById("home-btn");
  }
}
