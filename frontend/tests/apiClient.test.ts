import assert from 'node:assert/strict'
import test from 'node:test'
import { ApiError, apiRequest } from '../src/api/client.ts'

test('network failures use a friendly server-unavailable message', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => {
    throw new TypeError('connection refused')
  }

  try {
    await assert.rejects(
      () => apiRequest('/classes', '12345678901234567'),
      (error: unknown) => {
        assert.ok(error instanceof ApiError)
        assert.equal(error.status, 0)
        assert.equal(
          error.message,
          'The server is unavailable. Please check your connection and try again.',
        )
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('API problem details become friendly action errors', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        title: 'No seats available',
        detail: 'All seats for this class are currently held or confirmed.',
      }),
      { status: 409, headers: { 'Content-Type': 'application/problem+json' } },
    )

  try {
    await assert.rejects(
      () =>
        apiRequest('/classes/example/holds', '12345678901234567', {
          method: 'POST',
        }),
      (error: unknown) => {
        assert.ok(error instanceof ApiError)
        assert.equal(error.status, 409)
        assert.equal(
          error.message,
          'All seats for this class are currently held or confirmed.',
        )
        return true
      },
    )
  } finally {
    globalThis.fetch = originalFetch
  }
})
