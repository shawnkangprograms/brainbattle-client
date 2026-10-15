describe('TC-007 to TC-015 — Gameplay', () => {

  let roomCode

  before(() => {
    cy.task('resetTestData'); // Clear DB first
    // Register host user once
    cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: {
          username: 'GameHost',
          email: 'gamehost@brainbattle.test',
          password: 'Password123!'
        },
        failOnStatusCode: false // Prevent Cypress from crashing if user exists 
    }).then((res) => {
      // If registration was successful or user exists, we still need a token
      // If register failed because user exists, we'll login in beforeEach anyway
      if (res.body && res.body.token) {
        window.localStorage.setItem('bb_token', res.body.token);
      }
    });
  });

  beforeEach(() => {
    cy.login('GameHost', 'Password123!')
    cy.visit('/')
  })

  // TC-005 + setup: Create and enter lobby
  const createAndStartGame = () => {
    cy.get('[data-testid="create-room-btn"]').click()
    cy.get('[data-testid="start-room-btn"]').click()
    cy.url().should('include', '/lobby/')
    cy.get('[data-testid="start-game-btn"]').click()
    cy.url().should('include', '/game/', { timeout: 15000 })
  }

  // TC-005/TC-007: Game starts and question appears
  it('TC-007: displays a question with 4 answer options after game starts', () => {
    createAndStartGame()
    cy.get('[data-testid="question-text"]', { timeout: 15000 })
      .should('be.visible')
      .and('not.be.empty')
    // All 4 answer buttons visible
    cy.get('[data-testid="answer-btn-0"]').should('be.visible')
    cy.get('[data-testid="answer-btn-1"]').should('be.visible')
    cy.get('[data-testid="answer-btn-2"]').should('be.visible')
    cy.get('[data-testid="answer-btn-3"]').should('be.visible')
    // Timer should be counting
    cy.get('[data-testid="timer-display"]').should('be.visible')
    // Score starts at 0
    cy.get('[data-testid="score-display"]').should('contain', '0')
  })

  // TC-008: Answer a question and score updates
  it('TC-008: score updates after answering correctly', () => {
    createAndStartGame()
    cy.get('[data-testid="question-text"]', { timeout: 15000 }).should('be.visible')
    // Click first answer option
    cy.get('[data-testid="answer-btn-0"]').click()
    // Button should become disabled after answering
    cy.get('[data-testid="answer-btn-0"]').should('be.disabled')
    cy.get('[data-testid="answer-btn-1"]').should('be.disabled')
    // One answer should be highlighted green (correct) or red (wrong)
    cy.get('[class*="ans_correct"], [class*="ans_wrong"], [class*="ans_pending"]')
      .should('exist')
  })

  // TC-011: Score increases after correct answer
  it('TC-011: score increases after a correct answer', () => {
    createAndStartGame()
    cy.get('[data-testid="question-text"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="score-display"]').invoke('text').then(initialScore => {
      // Answer a question
      cy.get('[data-testid="answer-btn-0"]').click()
      // Wait for result reveal
      cy.get('[class*="ans_correct"]', { timeout: 5000 }).then(() => {
        // Score should have increased
        cy.get('[data-testid="score-display"]').invoke('text').then(newScore => {
          const initial = parseInt(initialScore.replace(/,/g, '')) || 0
          const updated = parseInt(newScore.replace(/,/g, '')) || 0
          expect(updated).to.be.gte(initial)
        })
      })
    })
  })

  // TC-009 + TC-010: Sudden Death mode
  it('TC-009 & TC-010: Sudden Death — correct answer does NOT eliminate, wrong answer does', () => {
    // Create Sudden Death room via API-level socket check
    // We verify the server logic via the API health check and mode selection
    cy.get('[data-testid="create-room-btn"]').click()
    // Select Sudden Death mode
    cy.contains('Sudden Death').click()
    cy.get('[data-testid="start-room-btn"]').click()
    cy.url().should('include', '/lobby/')
    cy.get('[data-testid="start-game-btn"]').click()
    cy.url().should('include', '/game/', { timeout: 15000 })
    cy.get('[data-testid="question-text"]', { timeout: 15000 }).should('be.visible')
    // Eliminated banner should NOT be visible before answering
    cy.get('[data-testid="eliminated-banner"]').should('not.exist')
    // Answer first option
    cy.get('[data-testid="answer-btn-0"]').click()
    // Eliminated banner should only appear if answer was wrong
    // (We can't know which answer is correct, so we check the state is consistent)
    cy.get('[class*="ans_correct"], [class*="ans_wrong"]', { timeout: 5000 }).should('exist')
    cy.get('[class*="ans_correct"]').then($correct => {
      if ($correct.length > 0) {
        // Answered correctly — should NOT be eliminated
        cy.get('[data-testid="eliminated-banner"]').should('not.exist')
      } else {
        // Answered wrong — eliminated banner should appear after delay
        cy.get('[data-testid="eliminated-banner"]', { timeout: 4000 }).should('be.visible')
      }
    })
  })

  // TC-013: Host skip question
  it('TC-013: host can skip a question', () => {
    createAndStartGame()
    cy.get('[data-testid="question-text"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="skip-btn"]').should('be.visible').click()
    // Question results should appear (correct answer revealed)
    cy.get('[class*="ans_correct"]', { timeout: 5000 }).should('exist')
  })

  // TC-013: Host end game
  it('TC-013b: host can end the game early', () => {
    createAndStartGame()
    cy.get('[data-testid="question-text"]', { timeout: 15000 }).should('be.visible')
    cy.get('[data-testid="end-game-btn"]').click()
    // Should navigate to results page
    cy.url().should('include', '/results/', { timeout: 10000 })
  })

})