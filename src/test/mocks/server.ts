import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Set up Mock Service Worker for Node.js testing
export const server = setupServer(...handlers)

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'error',
  })
})

// Reset any request handlers that we may add during the tests
afterEach(() => {
  server.resetHandlers()
})

// Clean up after the tests are finished
afterAll(() => {
  server.close()
})