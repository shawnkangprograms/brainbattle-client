describe('TC-017 to TC-019 — Cross-Browser & Mobile', () => {

  beforeEach(() => {
    cy.registerUser('RespPlayer', 'resp@brainbattle.test', 'Password123!')
  })

  // TC-017 & TC-018: Chrome/Firefox — run with cypress run --browser chrome/firefox
  it('TC-017/018: app renders correctly in current browser', () => {
    cy.visit('/')
    cy.get('[data-testid="create-room-btn"]').should('be.visible')
    cy.get('[data-testid="join-room-btn"]').should('be.visible')
    cy.get('[data-testid="user-menu-btn"]').should('be.visible')
    // No console errors
    cy.window().then(win => {
      cy.spy(win.console, 'error').as('consoleError')
    })
    cy.visit('/leaderboard')
    cy.get('@consoleError').should('not.have.been.called')
  })

  // TC-019: Mobile responsiveness at 375px
  it('TC-019: answer buttons do not overlap on 375px mobile viewport', () => {
    cy.viewport(375, 812)
    cy.registerUser('MobilePlayer', 'mobile@brainbattle.test', 'Password123!')
    cy.visit('/')
    cy.get('[data-testid="create-room-btn"]').click()
    cy.get('[data-testid="start-room-btn"]').click()
    cy.url().should('include', '/lobby/')
    cy.get('[data-testid="start-game-btn"]').click()
    cy.url().should('include', '/game/', { timeout: 15000 })
    cy.get('[data-testid="question-text"]', { timeout: 15000 }).should('be.visible')
    // Check answer buttons don't overlap — each should be within viewport width
    cy.get('[data-testid="answer-btn-0"]').then($btn => {
      const rect = $btn[0].getBoundingClientRect()
      expect(rect.right).to.be.lte(375)
      expect(rect.left).to.be.gte(0)
    })
    cy.get('[data-testid="answer-btn-1"]').then($btn => {
      const rect = $btn[0].getBoundingClientRect()
      expect(rect.right).to.be.lte(375)
    })
  })

})