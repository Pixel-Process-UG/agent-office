import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import http from 'node:http'
import { PROVIDERS, CHAT_PROVIDERS, isChatProvider, complete } from '../agent-providers.mjs'
import { registerAgent, unregisterAgent, dispatchTask, cancelTask } from '../agent-runtime.mjs'

// A tiny OpenAI-compatible + Ollama-compatible server, so requests go over real HTTP.
let server
let port
let lastRequest = null
let mode = 'ok' // 'ok' | 'error' | 'hang'

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let body = ''
    req.on('data', d => { body += d })
    req.on('end', () => {
      lastRequest = { url: req.url, headers: req.headers, body: body ? JSON.parse(body) : null }
      if (mode === 'hang') return // never answer; used to test cancel and timeout
      if (mode === 'error') { res.writeHead(401, { 'content-type': 'application/json' }); return res.end('{"error":"bad key"}') }
      res.writeHead(200, { 'content-type': 'application/json' })
      if (req.url === '/api/chat') return res.end(JSON.stringify({ message: { role: 'assistant', content: 'ollama reply' } }))
      res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'chat reply' } }] }))
    })
  })
  await new Promise(r => server.listen(0, '127.0.0.1', r))
  port = server.address().port
})

afterAll(() => new Promise(r => server.close(r)))

const base = () => `http://127.0.0.1:${port}`
const ENV_KEYS = ['OPENAI_API_KEY', 'DEEPSEEK_API_KEY', 'MIMO_API_KEY', 'OPENAI_BASE_URL', 'DEEPSEEK_BASE_URL', 'MIMO_BASE_URL', 'OLLAMA_URL']
let saved

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map(k => [k, process.env[k]]))
  for (const k of ENV_KEYS) delete process.env[k]
  mode = 'ok'
  lastRequest = null
})
afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe('provider table', () => {
  it('lists DeepSeek, MiMo, OpenAI and Ollama', () => {
    expect(CHAT_PROVIDERS).toEqual(expect.arrayContaining(['openai', 'deepseek', 'mimo', 'ollama']))
    expect(isChatProvider('deepseek')).toBe(true)
    expect(isChatProvider('claude-code')).toBe(false)
    expect(isChatProvider(undefined)).toBe(false)
  })

  it('points each provider at its own endpoint and key', () => {
    expect(PROVIDERS.deepseek).toMatchObject({ baseUrl: 'https://api.deepseek.com', keyEnv: 'DEEPSEEK_API_KEY' })
    expect(PROVIDERS.mimo).toMatchObject({ baseUrl: 'https://api.xiaomimimo.com/v1', keyEnv: 'MIMO_API_KEY' })
    expect(PROVIDERS.openai).toMatchObject({ baseUrl: 'https://api.openai.com/v1', keyEnv: 'OPENAI_API_KEY' })
  })
})

describe('complete()', () => {
  it('fails clearly when the key is missing', async () => {
    await expect(complete({ provider: 'deepseek', system: 's', user: 'u' })).rejects.toThrow('DEEPSEEK_API_KEY is not set')
  })

  it('sends the key as a Bearer token to <base>/chat/completions with the default model', async () => {
    process.env.DEEPSEEK_API_KEY = 'sk-test-123'
    process.env.DEEPSEEK_BASE_URL = base()
    const text = await complete({ provider: 'deepseek', system: 'be brief', user: 'hello' })
    expect(text).toBe('chat reply')
    expect(lastRequest.url).toBe('/chat/completions')
    expect(lastRequest.headers.authorization).toBe('Bearer sk-test-123')
    expect(lastRequest.body.model).toBe('deepseek-v4-pro')
    expect(lastRequest.body.messages).toEqual([
      { role: 'system', content: 'be brief' },
      { role: 'user', content: 'hello' },
    ])
  })

  it('uses the model the agent asked for, and MiMo its own env var', async () => {
    process.env.MIMO_API_KEY = 'mimo-key'
    process.env.MIMO_BASE_URL = base()
    await complete({ provider: 'mimo', model: 'mimo-v2.5-pro', system: 's', user: 'u' })
    expect(lastRequest.body.model).toBe('mimo-v2.5-pro')
    expect(lastRequest.headers.authorization).toBe('Bearer mimo-key')
  })

  it('error text is reported, and the key never appears in it', async () => {
    process.env.DEEPSEEK_API_KEY = 'sk-secret-999'
    process.env.DEEPSEEK_BASE_URL = base()
    mode = 'error'
    const err = await complete({ provider: 'deepseek', system: 's', user: 'u' }).catch(e => e)
    expect(err.message).toContain('deepseek error 401')
    expect(err.message).not.toContain('sk-secret-999')
  })

  it('talks to Ollama without a key', async () => {
    process.env.OLLAMA_URL = base()
    const text = await complete({ provider: 'ollama', model: 'llama3.1', system: 's', user: 'u' })
    expect(text).toBe('ollama reply')
    expect(lastRequest.url).toBe('/api/chat')
    expect(lastRequest.body.stream).toBe(false)
  })

  it('times out instead of hanging', async () => {
    process.env.DEEPSEEK_API_KEY = 'k'
    process.env.DEEPSEEK_BASE_URL = base()
    mode = 'hang'
    await expect(complete({ provider: 'deepseek', system: 's', user: 'u', timeoutSec: 0.2 })).rejects.toThrow()
  })
})

describe('dispatchTask() for a chat provider', () => {
  it('runs the task through the provider and reports the reply, without spawning claude', async () => {
    process.env.DEEPSEEK_API_KEY = 'k'
    process.env.DEEPSEEK_BASE_URL = base()
    registerAgent('agent-ds', 'Dana', 'Analyst', '', { provider: 'deepseek', timeoutSec: 5, mode: 'full' })
    const done = new Promise((resolve, reject) => {
      const started = dispatchTask('agent-ds', { id: 'a1', taskTitle: 'Summarise', taskBrief: 'short' }, {
        onStart: () => {},
        onComplete: (id, result) => resolve({ id, result }),
        onError: (id, error) => reject(new Error(error)),
      })
      expect(started).toBe(true)
    })
    await expect(done).resolves.toEqual({ id: 'a1', result: 'chat reply' })
    expect(lastRequest.body.messages[1].content).toContain('Task: Summarise')
    unregisterAgent('agent-ds')
  })

  it('reports an error to the task when the key is missing', async () => {
    registerAgent('agent-nokey', 'Nia', 'Analyst', '', { provider: 'mimo', timeoutSec: 5 })
    const err = await new Promise(resolve => {
      dispatchTask('agent-nokey', { id: 'a2', taskTitle: 't', taskBrief: '' }, {
        onStart: () => {},
        onComplete: () => resolve('unexpected success'),
        onError: (_id, e) => resolve(e),
      })
    })
    expect(err).toBe('MIMO_API_KEY is not set')
    unregisterAgent('agent-nokey')
  })

  it('cancel stops the request and sends no completion', async () => {
    process.env.DEEPSEEK_API_KEY = 'k'
    process.env.DEEPSEEK_BASE_URL = base()
    mode = 'hang'
    registerAgent('agent-cancel', 'Cy', 'Analyst', '', { provider: 'deepseek', timeoutSec: 30 })
    let reported = false
    dispatchTask('agent-cancel', { id: 'a3', taskTitle: 't', taskBrief: '' }, {
      onStart: () => {},
      onComplete: () => { reported = true },
      onError: () => { reported = true },
    })
    await new Promise(r => setTimeout(r, 100))
    expect(cancelTask('agent-cancel')).toBe('a3')
    await new Promise(r => setTimeout(r, 300))
    expect(reported).toBe(false)
    unregisterAgent('agent-cancel')
  })
})
