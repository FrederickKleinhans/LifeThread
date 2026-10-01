import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { db } from '../db'
import { server } from '../test/server'
import { supabase } from './supabase'
import { enqueueMutation, failedMutationCount, pendingMutationCount, replayMutations } from './mutationQueue'

const apiUrl = 'http://127.0.0.1:54321/rest/v1'
const thread = {
  id: 'thread-1',
  title: 'Queued thread',
  folder: 'Life' as const,
  tags: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  archived_at: null,
  abandoned_at: null,
}

describe('offline mutation replay', () => {
  beforeEach(async () => {
    await db.mutations.clear()
    await db.failedMutations.clear()
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    } as never)
  })

  afterEach(async () => {
    await db.mutations.clear()
    await db.failedMutations.clear()
    vi.restoreAllMocks()
  })

  it('keeps a queued mutation when the remote write fails', async () => {
    server.use(
      http.post(`${apiUrl}/threads`, () =>
        HttpResponse.json(
          { code: '42501', message: 'row-level security policy denied insert' },
          { status: 403 },
        ),
      ),
    )
    await enqueueMutation({ kind: 'insertThread', value: thread })

    await replayMutations()

    expect(await pendingMutationCount()).toBe(1)
    const [queued] = await db.mutations.toArray()
    expect(queued.attempts).toBe(1)
    expect(queued.lastError).toBeTruthy()
  })

  it('removes a queued mutation after the remote write succeeds', async () => {
    server.use(
      http.post(`${apiUrl}/threads`, () => new HttpResponse(null, { status: 201 })),
    )
    await enqueueMutation({ kind: 'insertThread', value: thread })

    await replayMutations()

    expect(await pendingMutationCount()).toBe(0)
  })

  it('honors the exponential backoff window between retries', async () => {
    let attempts = 0
    server.use(
      http.post(`${apiUrl}/threads`, () => {
        attempts += 1
        return HttpResponse.json({ message: 'temporary outage' }, { status: 503 })
      }),
    )
    await enqueueMutation({ kind: 'insertThread', value: thread })

    await replayMutations()
    await replayMutations()

    expect(attempts).toBe(1)
    expect(await pendingMutationCount()).toBe(1)
  })

  it('moves mutations to the failed queue after eight failed attempts', async () => {
    server.use(
      http.post(`${apiUrl}/threads`, () =>
        HttpResponse.json({ message: 'temporary outage' }, { status: 503 }),
      ),
    )
    await enqueueMutation({ kind: 'insertThread', value: thread })

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const queued = await db.mutations.toCollection().first()
      if (queued?.id !== undefined) {
        await db.mutations.update(queued.id, { attempts: attempt, lastAttemptAt: 0 })
      }
      await replayMutations()
    }

    expect(await pendingMutationCount()).toBe(0)
    expect(await failedMutationCount()).toBe(1)
    await expect(db.failedMutations.toCollection().first()).resolves.toMatchObject({
      attempts: 8,
      failureReason: 'temporary outage',
    })
  })
})
