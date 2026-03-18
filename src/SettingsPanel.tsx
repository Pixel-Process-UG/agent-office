import { useState, type FormEvent } from 'react'
import { type PresenceState } from './data'
import { defaultSettings, defaultPresenceColors } from './data'
import { useOffice } from './office-provider'

const presenceLabels: Record<PresenceState, string> = {
  off_hours: 'Off hours',
  available: 'Available',
  active: 'Active',
  in_meeting: 'In meeting',
  paused: 'Paused',
  blocked: 'Blocked'
}

export function SettingsPanel() {
  const { officeSettings, workdayPolicy, rooms, updateSettings, updateRoom, deleteAgent, agents, createRoom, deleteRoom, webhooks, createWebhook, deleteWebhook } = useOffice()

  return (
    <div className="settings-panel" role="tabpanel">
      <GeneralSection officeName={officeSettings.officeName} onSave={updateSettings} />
      <WorkdaySection policy={workdayPolicy} onSave={updateSettings} />
      <RoomsCrudSection rooms={rooms} onSave={updateRoom} onCreate={createRoom} onDelete={deleteRoom} />
      <WebhooksSection webhooks={webhooks} onCreate={createWebhook} onDelete={deleteWebhook} />
      <ThemeSection colors={officeSettings.theme.presenceColors} onSave={updateSettings} />
      <DangerSection
        onReset={async () => {
          await updateSettings({
            officeName: defaultSettings.officeName,
            theme: { presenceColors: { ...defaultPresenceColors } }
          })
        }}
        onDeleteAll={async () => {
          for (const agent of agents) {
            await deleteAgent(agent.id)
          }
        }}
        agentCount={agents.length}
      />
    </div>
  )
}

function GeneralSection({ officeName, onSave }: {
  officeName: string
  onSave: (patch: { officeName: string }) => Promise<boolean>
}) {
  const [name, setName] = useState(officeName)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ officeName: name })
    setSaving(false)
  }

  return (
    <details className="settings-section" open>
      <summary>General</summary>
      <form className="settings-section-body" onSubmit={handleSubmit}>
        <label className="settings-label" htmlFor="settings-office-name">Office name</label>
        <input
          id="settings-office-name"
          className="assign-input"
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={100}
        />
        <button type="submit" className="assign-submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </details>
  )
}

function WorkdaySection({ policy, onSave }: {
  policy: { timezone: string; days: string; hours: string; pauseRule: string; sharedPlaceRule: string }
  onSave: (patch: { workdayPolicy: Record<string, string> }) => Promise<boolean>
}) {
  const [tz, setTz] = useState(policy.timezone)
  const [days, setDays] = useState(policy.days)
  const [hours, setHours] = useState(policy.hours)
  const [pauseRule, setPauseRule] = useState(policy.pauseRule)
  const [sharedRule, setSharedRule] = useState(policy.sharedPlaceRule)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({
      workdayPolicy: { timezone: tz, days, hours, pauseRule, sharedPlaceRule: sharedRule }
    })
    setSaving(false)
  }

  return (
    <details className="settings-section">
      <summary>Workday Policy</summary>
      <form className="settings-section-body" onSubmit={handleSubmit}>
        <label className="settings-label" htmlFor="settings-tz">Timezone</label>
        <input id="settings-tz" className="assign-input" value={tz} onChange={e => setTz(e.target.value)} />

        <label className="settings-label" htmlFor="settings-days">Office days</label>
        <input id="settings-days" className="assign-input" value={days} onChange={e => setDays(e.target.value)} />

        <label className="settings-label" htmlFor="settings-hours">Office hours</label>
        <input id="settings-hours" className="assign-input" value={hours} onChange={e => setHours(e.target.value)} />

        <label className="settings-label" htmlFor="settings-pause">Pause rule</label>
        <textarea id="settings-pause" className="assign-input" rows={2} value={pauseRule} onChange={e => setPauseRule(e.target.value)} />

        <label className="settings-label" htmlFor="settings-shared">Shared place rule</label>
        <textarea id="settings-shared" className="assign-input" rows={2} value={sharedRule} onChange={e => setSharedRule(e.target.value)} />

        <button type="submit" className="assign-submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </form>
    </details>
  )
}

function RoomsCrudSection({ rooms, onSave, onCreate, onDelete }: {
  rooms: Array<{ id: string; name: string; team: string; purpose: string }>
  onSave: (id: string, input: { name?: string; team?: string; purpose?: string }) => Promise<boolean>
  onCreate: (input: { id: string; name: string; team: string; purpose: string; zone: { x: number; y: number; w: number; h: number } }) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [delConfirm, setDelConfirm] = useState<string | null>(null)

  return (
    <details className="settings-section">
      <summary>Rooms</summary>
      <div className="settings-section-body">
        <button type="button" className="add-agent-btn" style={{ margin: '0 0 8px' }} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Add Room'}
        </button>
        {showCreate && (
          <RoomCreateForm onCreate={async (input) => {
            const ok = await onCreate(input)
            if (ok) setShowCreate(false)
            return ok
          }} />
        )}
        {rooms.map(room => (
          <div key={room.id} className="room-edit-card">
            <div className="room-edit-head">
              <span className="room-edit-name">{room.name}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button type="button" className="agent-edit-btn" style={{ flex: 'none', padding: '4px 8px' }}
                  onClick={() => setEditingId(editingId === room.id ? null : room.id)}>
                  {editingId === room.id ? 'Cancel' : 'Edit'}
                </button>
                {room.id !== 'commons' && (
                  delConfirm === room.id ? (
                    <div className="delete-confirm">
                      <button className="delete-yes" onClick={async () => { await onDelete(room.id); setDelConfirm(null) }}>Del</button>
                      <button className="delete-no" onClick={() => setDelConfirm(null)}>No</button>
                    </div>
                  ) : (
                    <button type="button" className="agent-delete-btn" style={{ flex: 'none', padding: '4px 8px' }}
                      onClick={() => setDelConfirm(room.id)}>Del</button>
                  )
                )}
              </div>
            </div>
            <span className="room-edit-team">{room.team}</span>
            {editingId === room.id && (
              <RoomEditForm room={room} onSave={async (input) => {
                const ok = await onSave(room.id, input)
                if (ok) setEditingId(null)
                return ok
              }} />
            )}
          </div>
        ))}
      </div>
    </details>
  )
}

function RoomCreateForm({ onCreate }: {
  onCreate: (input: { id: string; name: string; team: string; purpose: string; zone: { x: number; y: number; w: number; h: number } }) => Promise<boolean>
}) {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.target as HTMLFormElement)
    await onCreate({
      id: fd.get('id') as string,
      name: fd.get('name') as string,
      team: fd.get('team') as string,
      purpose: fd.get('purpose') as string,
      zone: {
        x: Number(fd.get('zoneX')) || 10,
        y: Number(fd.get('zoneY')) || 10,
        w: Number(fd.get('zoneW')) || 30,
        h: Number(fd.get('zoneH')) || 25
      }
    })
    setSaving(false)
  }

  return (
    <form className="settings-section-body" style={{ marginBottom: 8, padding: 8, background: '#181d2a', border: '1px solid rgba(255,255,255,0.05)' }} onSubmit={handleSubmit}>
      <label className="settings-label" htmlFor="new-room-id">ID (kebab-case)</label>
      <input id="new-room-id" name="id" className="assign-input" required pattern="[a-z0-9-]+" placeholder="my-room" />
      <label className="settings-label" htmlFor="new-room-name">Name</label>
      <input id="new-room-name" name="name" className="assign-input" required placeholder="Room name" />
      <label className="settings-label" htmlFor="new-room-team">Team</label>
      <input id="new-room-team" name="team" className="assign-input" required placeholder="Team" />
      <label className="settings-label" htmlFor="new-room-purpose">Purpose</label>
      <input id="new-room-purpose" name="purpose" className="assign-input" required placeholder="Room purpose" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <div><label className="settings-label">X %</label><input name="zoneX" type="number" min="0" max="100" defaultValue="10" className="assign-input" /></div>
        <div><label className="settings-label">Y %</label><input name="zoneY" type="number" min="0" max="100" defaultValue="10" className="assign-input" /></div>
        <div><label className="settings-label">W %</label><input name="zoneW" type="number" min="5" max="100" defaultValue="30" className="assign-input" /></div>
        <div><label className="settings-label">H %</label><input name="zoneH" type="number" min="5" max="100" defaultValue="25" className="assign-input" /></div>
      </div>
      <button type="submit" className="assign-submit" disabled={saving}>{saving ? 'Creating...' : 'Create room'}</button>
    </form>
  )
}

function WebhooksSection({ webhooks, onCreate, onDelete }: {
  webhooks: Array<{ id: string; url: string; events: string[]; enabled: boolean; createdAt: string }>
  onCreate: (input: { url: string; secret?: string; events: string[] }) => Promise<boolean>
  onDelete: (id: string) => Promise<boolean>
}) {
  const [showCreate, setShowCreate] = useState(false)
  const allEvents = ['agent.presence_changed', 'task.completed', 'task.failed', 'agent.created', 'agent.deleted', 'decision.created']

  return (
    <details className="settings-section">
      <summary>Webhooks</summary>
      <div className="settings-section-body">
        <button type="button" className="add-agent-btn" style={{ margin: '0 0 8px' }} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ Add Webhook'}
        </button>
        {showCreate && (
          <WebhookCreateForm events={allEvents} onCreate={async (input) => {
            const ok = await onCreate(input)
            if (ok) setShowCreate(false)
            return ok
          }} />
        )}
        {webhooks.length === 0 && !showCreate && <p className="feed-empty">No webhooks configured</p>}
        {webhooks.map(wh => (
          <div key={wh.id} className="room-edit-card">
            <div className="room-edit-head">
              <span className="room-edit-name" style={{ fontSize: 10, wordBreak: 'break-all' }}>{wh.url}</span>
              <button type="button" className="agent-delete-btn" style={{ flex: 'none', padding: '4px 8px' }} onClick={() => onDelete(wh.id)}>Del</button>
            </div>
            <span className="room-edit-team">{wh.events.length > 0 ? wh.events.join(', ') : 'All events'}</span>
          </div>
        ))}
      </div>
    </details>
  )
}

function WebhookCreateForm({ events, onCreate }: {
  events: string[]
  onCreate: (input: { url: string; secret?: string; events: string[] }) => Promise<boolean>
}) {
  const [saving, setSaving] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.target as HTMLFormElement)
    await onCreate({
      url: fd.get('url') as string,
      secret: (fd.get('secret') as string) || undefined,
      events: selectedEvents
    })
    setSaving(false)
  }

  return (
    <form className="settings-section-body" style={{ marginBottom: 8, padding: 8, background: '#181d2a', border: '1px solid rgba(255,255,255,0.05)' }} onSubmit={handleSubmit}>
      <label className="settings-label" htmlFor="webhook-url">Webhook URL</label>
      <input id="webhook-url" name="url" type="url" className="assign-input" required placeholder="https://..." />
      <label className="settings-label" htmlFor="webhook-secret">Secret (optional)</label>
      <input id="webhook-secret" name="secret" className="assign-input" placeholder="HMAC secret" />
      <label className="settings-label">Events (leave empty for all)</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {events.map(ev => (
          <label key={ev} className="agent-form-checkbox" style={{ fontSize: 9 }}>
            <input type="checkbox" checked={selectedEvents.includes(ev)}
              onChange={e => setSelectedEvents(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))} />
            <span>{ev}</span>
          </label>
        ))}
      </div>
      <button type="submit" className="assign-submit" disabled={saving}>{saving ? 'Creating...' : 'Create webhook'}</button>
    </form>
  )
}

function RoomEditForm({ room, onSave }: {
  room: { name: string; team: string; purpose: string }
  onSave: (input: { name: string; team: string; purpose: string }) => Promise<boolean>
}) {
  const [name, setName] = useState(room.name)
  const [team, setTeam] = useState(room.team)
  const [purpose, setPurpose] = useState(room.purpose)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ name, team, purpose })
    setSaving(false)
  }

  return (
    <form className="settings-section-body" style={{ marginTop: 8 }} onSubmit={handleSubmit}>
      <label className="settings-label" htmlFor={`room-name-${room.name}`}>Name</label>
      <input id={`room-name-${room.name}`} className="assign-input" value={name} onChange={e => setName(e.target.value)} />

      <label className="settings-label" htmlFor={`room-team-${room.name}`}>Team</label>
      <input id={`room-team-${room.name}`} className="assign-input" value={team} onChange={e => setTeam(e.target.value)} />

      <label className="settings-label" htmlFor={`room-purpose-${room.name}`}>Purpose</label>
      <textarea id={`room-purpose-${room.name}`} className="assign-input" rows={2} value={purpose} onChange={e => setPurpose(e.target.value)} />

      <button type="submit" className="assign-submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save room'}
      </button>
    </form>
  )
}

function ThemeSection({ colors, onSave }: {
  colors: Record<PresenceState, string>
  onSave: (patch: { theme: { presenceColors: Record<string, string> } }) => Promise<boolean>
}) {
  const [localColors, setLocalColors] = useState(colors)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    await onSave({ theme: { presenceColors: localColors } })
    setSaving(false)
  }

  return (
    <details className="settings-section">
      <summary>Theme</summary>
      <form className="settings-section-body" onSubmit={handleSubmit}>
        {(Object.keys(presenceLabels) as PresenceState[]).map(state => (
          <div key={state} className="settings-color-row">
            <input
              type="color"
              className="settings-color-input"
              value={localColors[state]}
              onChange={e => setLocalColors(prev => ({ ...prev, [state]: e.target.value }))}
              aria-label={`Color for ${presenceLabels[state]}`}
            />
            <span className="settings-color-label">{presenceLabels[state]}</span>
            <span className="settings-color-hex">{localColors[state]}</span>
          </div>
        ))}
        <button type="submit" className="assign-submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save colors'}
        </button>
      </form>
    </details>
  )
}

function DangerSection({ onReset, onDeleteAll, agentCount }: {
  onReset: () => Promise<void>
  onDeleteAll: () => Promise<void>
  agentCount: number
}) {
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <details className="settings-section">
      <summary>Danger Zone</summary>
      <div className="settings-section-body danger-zone">
        {confirmReset ? (
          <div className="delete-confirm" style={{ marginBottom: 8 }}>
            <span>Reset all settings?</span>
            <button className="delete-yes" disabled={busy} onClick={async () => {
              setBusy(true)
              await onReset()
              setConfirmReset(false)
              setBusy(false)
            }}>Yes</button>
            <button className="delete-no" onClick={() => setConfirmReset(false)}>No</button>
          </div>
        ) : (
          <button type="button" className="agent-delete-btn" style={{ width: '100%' }} onClick={() => setConfirmReset(true)}>
            Reset all settings to defaults
          </button>
        )}

        {agentCount > 0 && (
          confirmDelete ? (
            <div className="delete-confirm" style={{ marginTop: 8 }}>
              <span>Delete all {agentCount} agents?</span>
              <button className="delete-yes" disabled={busy} onClick={async () => {
                setBusy(true)
                await onDeleteAll()
                setConfirmDelete(false)
                setBusy(false)
              }}>Yes</button>
              <button className="delete-no" onClick={() => setConfirmDelete(false)}>No</button>
            </div>
          ) : (
            <button type="button" className="agent-delete-btn" style={{ width: '100%', marginTop: 8 }} onClick={() => setConfirmDelete(true)}>
              Delete all agents ({agentCount})
            </button>
          )
        )}
      </div>
    </details>
  )
}
