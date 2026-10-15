describe('TC-001 to TC-004 — Authentication', () => {

  beforeEach(() => {
    cy.task('resetTestData')
    cy.visit('/')
  })

  // TC-001: User Registration
  it('TC-001: registers a new user successfully', () => {
    cy.visit('/auth')
    cy.get('[data-testid="register-tab"]').click()
    cy.get('[data-testid="reg-username-input"]').type('TestPlayer1')
    cy.get('[data-testid="reg-email-input"]').type('testplayer1@brainbattle.test')
    cy.get('[data-testid="reg-password-input"]').type('Password123!')
    cy.get('[data-testid="register-btn"]').click()
    // Should redirect to home and show username in nav
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
    cy.get('[data-testid="nav-username"]').should('contain', 'TestPlayer1')
    // JWT should be stored
    cy.window().its('localStorage').invoke('getItem', 'bb_token').should('not.be.null')
  })

  // TC-002: Login with valid credentials
  it('TC-002: logs in with valid credentials', () => {
    // First register via API
    cy.registerUser('TestPlayer2', 'testplayer2@brainbattle.test', 'Password123!')
    cy.clearLocalStorage()
    cy.visit('/auth')
    cy.get('[data-testid="username-input"]').type('TestPlayer2')
    cy.get('[data-testid="password-input"]').type('Password123!')
    cy.get('[data-testid="login-btn"]').click()
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
    cy.get('[data-testid="nav-username"]').should('contain', 'TestPlayer2')
  })

  // TC-003: Login with invalid credentials
  it('TC-003: shows error for invalid credentials', () => {
    cy.visit('/auth')
    cy.get('[data-testid="username-input"]').type('TestPlayer2')
    cy.get('[data-testid="password-input"]').type('WrongPassword!')
    cy.get('[data-testid="login-btn"]').click()
    // Toast error should appear
    cy.contains('Invalid credentials').should('be.visible')
    // No token stored
    cy.window().its('localStorage').invoke('getItem', 'bb_token').should('be.null')
    // Still on auth page
    cy.url().should('include', '/auth')
  })

  // TC-004: Guest login
  it('TC-004: allows guest access without an account', () => {
    cy.visit('/auth')
    cy.get('[data-testid="guest-tab"]').click()
    cy.get('[data-testid="guest-username-input"]').type('GuestPlayer1')
    cy.get('[data-testid="guest-btn"]').click()
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
    cy.get('[data-testid="nav-username"]').should('contain', 'GuestPlayer1')
    // Guest stored in sessionStorage, not localStorage
    cy.window().its('sessionStorage').invoke('getItem', 'bb_guest').should('not.be.null')
    cy.window().its('localStorage').invoke('getItem', 'bb_token').should('be.null')
  })

  // TC-016: Logout
  it('TC-016: logs out and clears session', () => {
    cy.registerUser('TestPlayer3', 'testplayer3@brainbattle.test', 'Password123!')
    cy.visit('/')
    cy.get('[data-testid="user-menu-btn"]').click()
    cy.get('[data-testid="logout-btn"]').click()
    cy.window().its('localStorage').invoke('getItem', 'bb_token').should('be.null')
    cy.url().should('eq', Cypress.config('baseUrl') + '/')
    cy.get('[data-testid="nav-username"]').should('not.exist')
  })

})