import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      on('task', {
        // Reset test data between runs
        async resetTestData() {
          const { MongoClient } = await import('mongodb')
          const client = await MongoClient.connect(
            'mongodb://localhost:27017/brainbattle'
          )
          const db = client.db()
          await db.collection('users').deleteMany({
            email: /brainbattle\.test$/
          })
          await db.collection('gameresults').deleteMany({
            roomCode: /^TEST/
          })
          await client.close()
          return null
        }
      })
    }
  }
})