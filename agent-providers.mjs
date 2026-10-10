// Chat-completion providers for agents that are not Claude Code.
// agent-runtime.mjs sends a task here when the agent's provider is not 'claude-code'.
//
// These are plain chat calls: no shell, no files, no MCP connectors. The agent's tool
// settings (mode, allowedTools) do not apply to them.

// Where to send the request, which env var holds the key, and the default model.
// Set <PROVIDER>_BASE_URL (e.g. DEEPSEEK_BASE_URL) to point at a proxy or a test server.
export const PROVIDERS = {
  openai:   { baseUrl: 'https://api.openai.com/v1',     keyEnv: 'OPENAI_API_KEY',   model: 'gpt-4o' },
  deepseek: { baseUrl: 'https://api.deepseek.com',      keyEnv: 'DEEPSEEK_API_KEY', model: 'deepseek-v4-pro' },
  mimo:     { baseUrl: 'https://api.xiaomimimo.com/v1', keyEnv: 'MIMO_API_KEY',     model: 'mimo-v2.5-pro' },
}

export const CHAT_PROVIDERS = [...Object.keys(PROVIDERS), 'ollama']

export const isChatProvider = name => CHAT_PROVIDERS.includes(name)

/**
 * Send one system message and one user message; return the reply text.
 * Errors never include an API key.
 */
export async function complete({ provider, model, system, user, timeoutSec = 300, signal }) {
  const timeout = AbortSignal.timeout(timeoutSec * 1000)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  const messages = [{ role: 'system', content: system }, { role: 'user', content: user }]

  if (provider === 'ollama') {
    const base = process.env.OLLAMA_URL || 'http://localhost:11434'
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: model || 'llama3.1', messages, stream: false }),
      signal: combined,
    })
    if (!res.ok) throw new Error(`ollama error ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`)
    const data = await res.json()
    return data.message?.content ?? ''
  }

  const p = PROVIDERS[provider]
  if (!p) throw new Error(`unknown provider: ${provider}`)
  const apiKey = process.env[p.keyEnv]
  if (!apiKey) throw new Error(`${p.keyEnv} is not set`)
  const baseUrl = process.env[`${provider.toUpperCase()}_BASE_URL`] || p.baseUrl

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: model || p.model, messages, max_tokens: 4096 }),
    signal: combined,
  })
  if (!res.ok) throw new Error(`${provider} error ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
