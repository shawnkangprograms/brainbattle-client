describe('T-13 & T-14 — API Endpoints', () => {
  
    // This is the "Magic Reset" button
  beforeEach(() => {
    cy.task('resetTestData')
  })

  it('T-14: GET /api/health returns 200 and correct payload', () => {
    cy.request('GET', 'http://localhost:5000/api/health').then(res => {
      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('status')
      expect(res.body.status).to.include('BrainBattle server online')
    })
  })

  it('T-13: GET /api/questions/fetch-opentdb returns questions array', () => {
    cy.request({
      method: 'GET',
      url: 'http://localhost:5000/api/questions/fetch-opentdb',
      qs: { category: 'General Knowledge', difficulty: 'easy', amount: 5 },
      failOnStatusCode: false
    }).then(res => {
      // Either success from OpenTDB or graceful fallback
      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('questions')
      expect(res.body.questions).to.be.an('array')
    })
  })

  it('POST /api/auth/register creates a user', () => {
    cy.request('POST', 'http://localhost:5000/api/auth/register', {
      username: 'APITestUser',
      email: 'apitest@brainbattle.test',
      password: 'Password123!'
    }).then(res => {
      expect(res.status).to.equal(200)
      expect(res.body).to.have.property('token')
      expect(res.body).to.have.property('user')
      expect(res.body.user.username).to.equal('APITestUser')
    })
  })

  it('POST /api/auth/login rejects wrong password', () => {
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      body: { username: 'APITestUser', password: 'WrongPass' },
      failOnStatusCode: false
    }).then(res => {
      expect(res.status).to.equal(400)
      expect(res.body).to.have.property('error')
    })
  })

})