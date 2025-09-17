import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// Set up Mock Service Worker for browser testing
export const worker = setupWorker(...handlers)

// Start the worker with error handling
export const startMockWorker = async () => {
  if (typeof window !== 'undefined') {
    try {
      await worker.start({
        onUnhandledRequest: 'warn',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      })
      console.log('🔧 MSW Worker started for browser testing')
    } catch (error) {
      console.warn('Failed to start MSW worker:', error)
    }
  }
}