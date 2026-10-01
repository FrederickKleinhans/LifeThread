import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../test/server'
import { supabase } from './supabase'
import {
  insertRemoteThread,
  loadRemoteData,
} from './remoteRepository'

const apiUrl = 'http://127.0.0.1:54321/rest/v1'
const user = { id: 'user-1' }

describe('remote repository', () => {
  beforeEach(() => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user },
      error: null,
    } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads journal data for the authenticated user and removes server-only owner fields', async () => {
    server.use(
      http.get(`${apiUrl}/threads`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('user_id')).toBe('eq.user-1')
        return HttpResponse.json([
          {
            id: 'thread-1',
            title: 'A thread',
            folder: 'Life',
            tags: [],
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            archived_at: null,
            abandoned_at: null,
            user_id: user.id,
          },
        ])
      }),
      http.get(`${apiUrl}/entries`, () => HttpResponse.json([])),
      http.get(`${apiUrl}/tags`, () => HttpResponse.json([])),
    )

    const result = await loadRemoteData()

    expect(result.threads).toHaveLength(1)
    expect(result.threads[0]).not.toHaveProperty('user_id')
    expect(result.entries).toEqual([])
    expect(result.tags).toEqual([])
  })

  it('rejects journal access when no user is signed in', async () => {
    vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
      data: { user: null },
      error: null,
    } as never)

    await expect(loadRemoteData()).rejects.toThrow(
      'You must be signed in to access your journal.',
    )
  })

  it('surfaces remote CRUD failures and scopes inserted data to the current user', async () => {
    let insertedBody: unknown
    server.use(
      http.post(`${apiUrl}/threads`, async ({ request }) => {
        insertedBody = await request.json()
        return HttpResponse.json(
          { code: '42501', message: 'row-level security policy denied insert' },
          { status: 403 },
        )
      }),
    )

    await expect(
      insertRemoteThread({
        id: 'thread-1',
        title: 'A thread',
        folder: 'Life',
        tags: [],
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
        archived_at: null,
        abandoned_at: null,
      }),
    ).rejects.toMatchObject({ code: '42501' })

    expect(insertedBody).toMatchObject({ user_id: user.id, id: 'thread-1' })
  })
})
