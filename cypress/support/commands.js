// Recommended tweak for the login command to match your register style
Cypress.Commands.add('login', (username, password) => {
  cy.request({ 
    method: 'POST', 
    url: '/api/auth/login', 
    body: { username, password } 
  }).then((res) => { // Accessing the full response object
    window.localStorage.setItem('bb_token', res.body.token);
    window.localStorage.setItem('bb_user', JSON.stringify(res.body.user));
  });
});

// Register a fresh test user or fallback to a unique identity
Cypress.Commands.add('registerUser', (username, email, password) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/register',
    body: { username, email, password },
    failOnStatusCode: false
  }).then((res) => {
    // If the standard user worked, use it.
    if (res.status === 201 || res.status === 200) {
      window.localStorage.setItem('bb_token', res.body.token);
      window.localStorage.setItem('bb_user', JSON.stringify(res.body.user));
    } else {
      // If lbplayer is taken/mismatched, generate a guaranteed fresh user.
      const uniqueEmail = `test-${Date.now()}@brainbattle.test`;
      const uniqueUsername = `${username}_${Math.floor(Math.random() * 1000)}`;

      cy.request({
        method: 'POST',
        url: '/api/auth/register',
        body: { 
          username: uniqueUsername, 
          email: uniqueEmail, 
          password 
        }
      }).then((secondRes) => {
        window.localStorage.setItem('bb_token', secondRes.body.token);
        window.localStorage.setItem('bb_user', JSON.stringify(secondRes.body.user));
      });
    }
  });
});