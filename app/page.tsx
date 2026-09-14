'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, CircleHelp, Clock3, Eye, EyeOff, Filter, Focus, ListFilter, LockKeyhole, Mail, MoreHorizontal, Pencil, Plus, Search, Settings, Sparkles, Sun, Tag, Trash2, X, Zap } from 'lucide-react'
import { authErrorMessage, loginAccount, loginWithGoogle, registerAccount, resetPassword } from '@/lib/firebase-auth'

type Priority = 'High' | 'Medium' | 'Low'
type View = 'Sab kaam' | 'Baki Hai 🥴' | 'Ho Gaya 😁' | 'Ruko jara sabar karo🤗'
type Sort = 'created' | 'due' | 'priority'
type Task = { id: string; title: string; notes: string; due: string; time: string; priority: Priority; done: boolean; tags: string[]; subtasks: string[]; recurring: boolean; createdAt: number }
type Profile = { name: string; email: string }
const seed: Task[] = [
  { id: '1', title: 'Project banana hai', notes: 'Kal time se pele Project jama karna hai.', due: '2026-09-14', time: '10:30', priority: 'Low', done: false, tags: ['Work'], subtasks: ['Review deck', 'Send to team'], recurring: false, createdAt: 1 },
  { id: '2', title: 'Kirana', notes: 'Dud, Nahane ka sabun, Colgate, Maggi', due: '2026-09-14', time: '17:00', priority: 'Medium', done: false, tags: ['Personal'], subtasks: [], recurring: false, createdAt: 2 },
  { id: '3', title: 'Mammi ka phone', notes: '2 kilo aalu llana hai.', due: '2026-09-15', time: '19:00', priority: 'High', done: true, tags: ['Personal'], subtasks: [], recurring: false, createdAt: 3 },
]
const today = '2026-09-14'

export default function Page() {
  const [hydrated, setHydrated] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [profile, setProfile] = useState<Profile>({ name: '', email: '' })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(seed)
  const [view, setView] = useState<View>('Sab kaam')
  const [sort, setSort] = useState<Sort>('created')
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState('All')
  const [modal, setModal] = useState<'task' | 'settings' | 'focus' | null>(null)
  const [editing, setEditing] = useState<Task | null>(null)
  const [dark, setDark] = useState(false)
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  const [error, setError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)

  useEffect(() => { try { const saved = localStorage.getItem('taskly-state'); if (saved) { const s = JSON.parse(saved); setAuthenticated(Boolean(s.authenticated)); setProfile(s.profile?.name ? s.profile : { name: s.email?.split('@')[0] || '', email: s.email || '' }); setTasks(s.tasks || seed); setView((s.view === 'Sab kaam' || s.view === 'Baki Hai 🥴' || s.view === 'Ho Gaya 😁' || s.view === 'Ruko jara sabar karo🤗') ? s.view : 'Sab kaam'); setSort(s.sort || 'created'); setDark(Boolean(s.dark)) } } catch { setError('We could not restore your saved workspace.') } setHydrated(true) }, [])
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!hydrated) return
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => {
      localStorage.setItem('taskly-state', JSON.stringify({ authenticated, profile, tasks, view, sort, dark }))
    }, 180)
    return () => { if (persistTimer.current) clearTimeout(persistTimer.current) }
  }, [hydrated, authenticated, profile, tasks, view, sort, dark])
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])

  const tags = ['All', ...Array.from(new Set(tasks.flatMap((t) => t.tags)))]
  const visible = useMemo(() => tasks.filter((task) => { const matchView = view === 'Sab kaam' ? !task.done : (view === 'Baki Hai 🥴' && !task.done) || (view === 'Ho Gaya 😁' && task.done) || (view === 'Ruko jara sabar karo🤗' && !task.done && task.due < today); const matchSearch = `${task.title} ${task.notes} ${task.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()); const matchTag = tag === 'All' || task.tags.includes(tag); return matchView && matchSearch && matchTag }).toSorted((a, b) => sort === 'due' ? a.due.localeCompare(b.due) : sort === 'priority' ? ({ High: 0, Medium: 1, Low: 2 }[a.priority] - { High: 0, Medium: 1, Low: 2 }[b.priority]) : b.createdAt - a.createdAt), [tasks, view, sort, query, tag])
  const completed = tasks.filter((task) => task.done).length

  async function submitAuth(e: React.FormEvent) { e.preventDefault(); const trimmedEmail = email.trim().toLowerCase(); const trimmedName = name.trim(); if (mode === 'register' && trimmedName.length < 2) return setError('Enter your name to create an account.'); if (!trimmedEmail.includes('@')) return setError('Enter a valid email address.'); if (password.length < 8 || !/[0-9]/.test(password)) return setError('aabe 8 character se jyada daal.'); setAuthBusy(true); setError(''); try { const nextProfile = mode === 'register' ? await registerAccount(trimmedName, trimmedEmail, password) : await loginAccount(trimmedEmail, password); setProfile(nextProfile); setEmail(nextProfile.email); setPassword(''); setAuthenticated(true) } catch (authError) { setError(authErrorMessage(authError)) } finally { setAuthBusy(false) } }
  function toggle(id: string) { setTasks((all) => all.map((task) => task.id === id ? { ...task, done: !task.done } : task)) }
  function saveTask(task: Task) {
    const taskId = editing?.id ?? task.id
    setTasks((all) => {
      const exists = all.some((item) => item.id === taskId)
      if (exists) return all.map((item) => item.id === taskId ? { ...task, id: taskId } : item)
      return [...all, { ...task, id: taskId }]
    })
    setEditing(null)
    setModal(null)
  }
  function reset() { setTasks(seed); setAuthenticated(false); setModal(null); localStorage.removeItem('taskly-state') }

  if (!hydrated) return <div className="loading-screen"><div className="brand-mark"><Check size={20} /></div><span>Loading your flow…</span></div>
  if (!authenticated) return <AuthScreen mode={mode} setMode={setMode} name={name} setName={setName} email={email} setEmail={setEmail} password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} onSubmit={submitAuth} onGoogle={async () => { setAuthBusy(true); setError(''); try { setProfile(await loginWithGoogle()); setAuthenticated(true) } catch (authError) { setError(authErrorMessage(authError)) } finally { setAuthBusy(false) } }} onResetPassword={async () => { if (!email.includes('@')) return setError('Enter your email first.'); try { await resetPassword(email); setError('Password reset email sent.') } catch (authError) { setError(authErrorMessage(authError)) } }} busy={authBusy} error={error} />

  return <main className="app-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Check size={20} strokeWidth={3} /></div><span>Taskly</span></div><div className="top-actions"><button className="icon-button" onClick={() => setModal('settings')} aria-label="Open settings"><Settings size={18} /></button><button className="profile" onClick={() => setModal('settings')}><span className="avatar">{profile.name.slice(0, 2).toUpperCase()}</span><span className="user-name">{profile.name}</span><ChevronDown size={15} /></button></div></header>
    <div className="workspace"><aside className="sidebar"><div className="side-greeting"><p>Kaisa hai?</p><h2>{profile.name ? profile.name.split(' ')[0] : 'there'} <span>✦</span></h2></div><button className="add-button" onClick={() => { setEditing(null); setModal('task') }}><Plus size={19} /> Add task</button><nav className="filter-nav" aria-label="Task views">{(['Sab kaam', 'Baki Hai 🥴', 'Ho Gaya 😁', 'Ruko jara sabar karo🤗'] as View[]).map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}><span className="nav-icon"><Check size={15} /></span>{item} <b>{item === 'Sab kaam' ? tasks.filter(t => !t.done).length : item === 'Baki Hai 🥴' ? tasks.filter(t => !t.done).length : item === 'Ho Gaya 😁' ? completed : tasks.filter(t => !t.done && t.due < today).length}</b></button>)}</nav><div className="progress-card"><div className="progress-header"><span>Aaj ka progress</span><strong>{completed}/{tasks.length}</strong></div><div className="progress-track"><span style={{ width: `${tasks.length ? completed / tasks.length * 100 : 0}%` }} /></div><p><Zap size={13} /> Chalo, momentum maintain rakho.</p></div><button className="signout" onClick={() => setAuthenticated(false)}>Sign out</button></aside>
      <section className="content"><div className="content-heading"><div><p className="eyebrow">Haan meri jaaan</p><h1>{view}</h1><p className="muted">"ये भी मुमकिन है कि आँख भिगोने लग जाऊँ, वो कहें कैसे हो आप? और मैं रोने लग जाऊँ"</p></div><div className="date-pill"><span>Monday</span><strong>14 Sep</strong></div></div><div className="insights"><div><Sparkles size={17} /><span><b>{tasks.filter(t => !t.done).length}</b> things already in motion</span></div><button onClick={() => { setFocusTask(tasks.find(t => !t.done) || null); setModal('focus') }}><Focus size={16} /> Krapya dhyan de</button></div><div className="toolbar"><div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search mar le" aria-label="Search tasks" /></div><select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort tasks"><option value="created">Naya</option><option value="due">Due date</option><option value="priority">Priority</option></select><button className="filter-button" onClick={() => setTag(tag === 'All' ? (tags[1] || 'All') : 'All')}><ListFilter size={17} /> {tag === 'All' ? 'Filter' : tag}</button></div><div className="tag-row">{tags.map((item) => <button key={item} className={tag === item ? 'tag active' : 'tag'} onClick={() => setTag(item)}><Tag size={13} />{item}</button>)}</div><div className="task-list">{visible.map((task) => <TaskCard key={task.id} task={task} onToggle={() => toggle(task.id)} onDelete={() => setTasks(all => all.filter(item => item.id !== task.id))} onEdit={() => { setEditing(task); setModal('task') }} onFocus={() => { setFocusTask(task); setModal('focus') }} />)}{visible.length === 0 && <div className="empty-state"><Sparkles size={28} /><h3>Abhi kuch nahi hai</h3><p>Try another view, tag, or add something new to get the momentum back.</p></div>}</div><button className="quick-add" onClick={() => { setEditing(null); setModal('task') }}><Plus size={18} /> Add a new task</button></section></div>
    {modal === 'task' && <TaskModal initial={editing} onSave={saveTask} onClose={() => setModal(null)} />}{modal === 'settings' && <SettingsModal profile={profile} dark={dark} setDark={setDark} onReset={reset} onClose={() => setModal(null)} />}{modal === 'focus' && <FocusModal task={focusTask} onClose={() => setModal(null)} onComplete={() => { if (focusTask) toggle(focusTask.id); setModal(null) }} />}
  </main>
}

function TaskCard({ task, onToggle, onDelete, onEdit, onFocus }: { task: Task; onToggle: () => void; onDelete: () => void; onEdit: () => void; onFocus: () => void }) { return <article className={`task-card ${task.done ? 'completed' : ''}`}><button className="check-button" aria-label={`Mark ${task.title} complete`} onClick={onToggle}>{task.done && <Check size={16} />}</button><div className="task-copy"><div className="task-title-row"><h3>{task.title}</h3><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span></div><p>{task.notes || 'No notes added. Basic but effective.'}</p><small><CalendarDays size={14} /> {task.due === today ? 'Today' : task.due} {task.time && `· ${task.time}`} {task.recurring && '· Recurring'}</small><div className="card-tags">{task.tags.map(t => <span key={t}>{t}</span>)}{task.subtasks.length > 0 && <span>{task.subtasks.length} subtasks</span>}</div></div><div className="task-actions"><button onClick={onFocus} aria-label={`Focus on ${task.title}`}><Focus size={16} /></button><button onClick={onEdit} aria-label={`Edit ${task.title}`}><Pencil size={16} /></button><button onClick={onDelete} aria-label={`Delete ${task.title}`}><Trash2 size={16} /></button></div></article> }

function TaskModal({ initial, onSave, onClose }: { initial: Task | null; onSave: (task: Task) => void; onClose: () => void }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [notes, setNotes] = useState(initial?.notes || '')
  const [due, setDue] = useState(initial?.due || today)
  const [time, setTime] = useState(initial?.time || '')
  const [priority, setPriority] = useState<Priority>(initial?.priority || 'Medium')
  const [tag, setTag] = useState(initial?.tags[0] || 'Personal')
  const [recurring, setRecurring] = useState(initial?.recurring || false)
  const [subtasks, setSubtasks] = useState(initial?.subtasks.join(', ') || '')

  useEffect(() => {
    setTitle(initial?.title || '')
    setNotes(initial?.notes || '')
    setDue(initial?.due || today)
    setTime(initial?.time || '')
    setPriority(initial?.priority || 'Medium')
    setTag(initial?.tags[0] || 'Personal')
    setRecurring(Boolean(initial?.recurring))
    setSubtasks(initial?.subtasks.join(', ') || '')
  }, [initial])

  function submit(e: React.FormEvent) { e.preventDefault(); if (!title.trim()) return; onSave({ id: initial?.id || crypto.randomUUID(), title: title.trim(), notes: notes.trim(), due, time, priority, done: initial?.done || false, tags: [tag.trim() || 'Personal'], subtasks: subtasks.split(',').map(s => s.trim()).filter(Boolean), recurring, createdAt: initial?.createdAt || Date.now() }) }
  return <Overlay onClose={onClose}><form className="composer" onSubmit={submit}><button type="button" className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><p className="eyebrow">To Chaliye shuru karte hai bina kisi ...</p><h2>{initial ? 'Edit task' : 'Task Likho'}</h2><label>What needs doing?<input autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. picture dekhane chale" /></label><label>Notes<textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add helpful context..." rows={3} /></label><div className="form-grid"><label>Due<input type="date" value={due} onChange={e => setDue(e.target.value)} /></label><label>Time<input type="time" value={time} onChange={e => setTime(e.target.value)} /></label><label>Priority<select value={priority} onChange={e => setPriority(e.target.value as Priority)}><option>High</option><option>Medium</option><option>Low</option></select></label><label>Tag<input value={tag} onChange={e => setTag(e.target.value)} /></label></div><label>Subtasks <input value={subtasks} onChange={e => setSubtasks(e.target.value)} placeholder="Separate subtasks with commas" /></label><label className="check-label"><input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} /> Repeat karna hi ki ni</label><button className="add-button full" type="submit"><Check size={18} /> {initial ? 'Save changes' : 'Add task'}</button></form></Overlay> }
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) { useEffect(() => { const close = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close) }, [onClose]); return <div className="modal-backdrop" onMouseDown={onClose}><div onMouseDown={e => e.stopPropagation()}>{children}</div></div> }
function FocusModal({ task, onClose, onComplete }: { task: Task | null; onClose: () => void; onComplete: () => void }) { return <Overlay onClose={onClose}><div className="focus-modal"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><div className="focus-icon"><Focus size={24} /></div><p className="eyebrow">Krapya Dhyan de</p><h2>{task?.title || 'Abhi kuch nahi hai boss'}</h2><p>{task ? '``अब किसी की सादगी पे दिल नहीं आता,कोई कितना भी सच्चा हो यकीन नहीं आता``' : 'Add an active task to start a serious focus session.'}</p>{task && <button className="add-button full" onClick={onComplete}><Check size={18} /> Mark complete</button>}</div></Overlay> }
function SettingsModal({ profile, dark, setDark, onReset, onClose }: { profile: Profile; dark: boolean; setDark: (v: boolean) => void; onReset: () => void; onClose: () => void }) { return <Overlay onClose={onClose}><div className="settings-modal"><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><p className="eyebrow">Account</p><h2>Settings</h2><div className="setting-row"><span><Sun size={17} /> Appearance</span><button className="switch" aria-label="Toggle dark mode" aria-pressed={dark} onClick={() => setDark(!dark)}><span className={dark ? 'on' : ''} /></button></div><div className="setting-row"><span><CircleHelp size={17} /> Notifications</span><input type="checkbox" defaultChecked /></div><div className="setting-row"><span><Settings size={17} /> Profile</span><small>{profile.name}<br />{profile.email}</small></div><button className="danger-button" onClick={onReset}>Reset local workspace</button></div></Overlay> }
function AuthScreen({ mode, setMode, name, setName, email, setEmail, password, setPassword, showPassword, setShowPassword, onSubmit, onGoogle, onResetPassword, busy, error }: { mode: 'login' | 'register'; setMode: (m: 'login' | 'register') => void; name: string; setName: (v: string) => void; email: string; setEmail: (v: string) => void; password: string; setPassword: (v: string) => void; showPassword: boolean; setShowPassword: (v: boolean) => void; onSubmit: (e: React.FormEvent) => void; onGoogle: () => void; onResetPassword: () => void; busy: boolean; error: string }) { return <main className="auth-shell"><div className="auth-visual"><div className="auth-orb orb-one" /><div className="auth-orb orb-two" /><div className="auth-brand"><div className="brand-mark"><Check size={20} /></div><span>Taskly</span></div><div className="visual-copy"><p className="eyebrow light">A cleaner way to handle the chaos</p><h1>Make space for<br /><em>what actually matters.</em></h1><p>Organize your day, keep the chaos in check, and still keep your sanity intact.</p></div><div className="quote-card"><Sparkles size={17} /><span>Small wins. Big momentum. No overthinking.</span></div></div><section className="auth-panel"><div className="auth-form-wrap"><div className="mobile-logo"><div className="brand-mark"><Check size={19} /></div><span>Taskly</span></div><p className="eyebrow">Welcome back</p><h2>{mode === 'login' ? 'Aaj phir kaam shuru karte hain?' : 'Ready to make life easier?'}</h2><p className="auth-muted">{mode === 'login' ? 'Log in and pick up your flow without the drama.' : 'Create an account and make today less chaotic, more sorted.'}</p><form onSubmit={onSubmit}>{mode === 'register' && <label>Your name<div className="input-wrap"><Pencil size={17} /><input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required /></div></label>}<label>Email address<div className="input-wrap"><Mail size={17} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="yaha email daal" required /></div></label><label>Password<div className="input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="or yaha password" required /><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="error-message" role="alert">{error}</p>}<button className="primary-submit" type="submit">{mode === 'login' ? 'Log in' : 'Create account'} <span>→</span></button></form><p className="switch-auth">{mode === 'login' ? 'New to Taskly?' : 'Already have an account?'} <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'naya aadmi yaha pele khata khole' : 'Log in'}</button></p></div></section></main> }
