describe('TC-020 — Leaderboard', () => {

  beforeEach(() => {
    cy.task('resetTestData'); 
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.registerUser('LBPlayer', 'lbplayer@brainbattle.test', 'Password123!');
    cy.visit('/');
  })

  it('TC-020: global leaderboard page loads and displays rankings', () => {
  cy.intercept('GET', '/api/leaderboard/global').as('getLeaderboard');
  
  cy.visit('/leaderboard');
  
  // 1. Wait for the API 
  cy.wait('@getLeaderboard');

  // 2. Wait for loading spinner to disappear explicitly
  cy.get('[class*="loading"], .spinner').should('not.exist');

  // 3. TARGET THE MAIN CONTENT ONLY
  // We use .within() to tell Cypress: "Only look inside the main section"
  // This prevents it from accidentally finding words in the Navbar
  cy.get('main, [class*="content"], #root > div > div:nth-child(2)').within(() => {
    
    // Look for the specific headers that belong in a table
    cy.contains(/Rank|Player|Points|Score|No rankings/i, { timeout: 10000 })
      .should('be.visible');

    // Check for the table specifically inside the main area
    // If you don't have a <table> tag, try looking for a div with a 'row' class
    cy.get('table, [class*="table"], [data-testid*="leaderboard"]', { timeout: 5000 })
      .should('exist');
  });
});

});
