import { useState, useEffect, useMemo, useRef } from 'react'
import { useConfirm } from '@/contexts/ConfirmContext'
import { notifyBrandLogoUpdated } from '@/hooks/useBrandLogo'
import { StatCard } from '@/components/ui/StatCard'
import {
  Shield, Plus, Eye, EyeOff, Settings, Building2, KeyRound, MessageSquareQuote,
  LayoutDashboard, Copy, CheckCircle2, Users, UserCheck, AlertTriangle, Scissors,
  ChevronDown, Lock, X, Heart, Smile, ThumbsUp, MessageCircle, Send, Newspaper, Trash2,
  ImagePlus, Loader2,
} from 'lucide-react'
import { api } from '@/services/api'
import { uploadsService } from '@/services/uploads.service'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface License {
  id: string
  code: string
  tenantId?: string
  expiresAt: string
  isAssigned: boolean
  isExpired: boolean
  notes?: string
}

interface TenantSummary {
  id: string
  name: string
  slug: string
  ownerName?: string
  address?: string
  status: string
  licenseCode?: string
  licenseExpiresAt?: string
  licenseActive: boolean
  barberCount: number
  customerCount: number
  createdAt: string
  ownerEmail?: string
  ownerPhone?: string
  activeInvitationCode?: string
  appointmentCount: number
  averageRatingStars: number
  ratingCount: number
  logoUrl?: string | null
}

interface TenantMember {
  userId: string
  fullName: string
  email: string
  role: string
}

interface PlatformCustomer {
  id: string
  userId?: string | null
  fullName: string
  phone: string
  email?: string
  tenantId: string
  tenantName: string
  createdAt: string
}

interface Testimonial {
  id: string
  content: string
  authorName: string
  barbershipName: string
  status: 'Pending' | 'Approved' | 'Rejected'
  showOnHome: boolean
  showOnLogin: boolean
  showOnRegister: boolean
}

interface PlatformSettings {
  contactPhone?: string
  contactEmail?: string
  contactWhatsApp?: string
  contactMessage?: string
  logoUrl?: string
}

interface PhoneAuditCounts {
  total: number
  empty: number
  tooShort: number
  tooLong: number
  invalidChars: number
  valid: number
}

interface PhoneAuditReport {
  users: PhoneAuditCounts
  barbers: PhoneAuditCounts
  customers: PhoneAuditCounts
}

interface OwnerPost {
  id: string
  content: string
  imageUrl?: string
  authorName: string
  authorAvatarUrl?: string
  createdAt: string
  reactions: { type: string; count: number }[]
  comments: { id: string; authorName: string; text: string; createdAt: string }[]
}

type Tab = 'overview' | 'tenants' | 'clients' | 'licenses' | 'novedades' | 'testimonials' | 'settings'

// 23.17.2 — same 3 reactions, same colors, same icons everywhere in the app (picker, summary,
// comments, detail) — this used to diverge from PostsPage.tsx's REACTIONS (red instead of yellow
// for "Me divierte"), which is exactly the inconsistency this round flags.
const OWNER_REACTIONS = [
  { type: 1, label: 'Like', icon: ThumbsUp, displayLabel: 'Me gusta', color: 'text-blue-400' },
  { type: 2, label: 'Love', icon: Heart, displayLabel: 'Me encanta', color: 'text-red-400' },
  { type: 3, label: 'Funny', icon: Smile, displayLabel: 'Me divierte', color: 'text-yellow-400' },
]

const statusLabel: Record<string, { label: string; cls: string }> = {
  PendingLicense: { label: 'Sin licencia', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  Trial: { label: 'Prueba', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  Active: { label: 'Activa', cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
  Suspended: { label: 'Suspendida', cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  Churned: { label: 'Cancelada', cls: 'bg-zinc-700 text-zinc-400 border-zinc-600' },
}


export default function SuperAdminPage() {
  const { user, logout } = useAuth()
  const confirmDialog = useConfirm()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')
  const [licenses, setLicenses] = useState<License[]>([])
  const [tenants, setTenants] = useState<TenantSummary[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({})
  const [phoneAudit, setPhoneAudit] = useState<PhoneAuditReport | null>(null)
  const [loading, setLoading] = useState(false)

  // New license form — owner only picks the expiry date, code is auto-generated server-side
  const [newExpiry, setNewExpiry] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [licenseMsg, setLicenseMsg] = useState('')
  const [licenseErr, setLicenseErr] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Settings form
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>({})
  const [settingsMsg, setSettingsMsg] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Tenant members / password reset
  const [expandedTenant, setExpandedTenant] = useState<string | null>(null)
  const [members, setMembers] = useState<Record<string, TenantMember[]>>({})
  const [resetTarget, setResetTarget] = useState<TenantMember | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetMsg, setResetMsg] = useState<{ text: string; error: boolean } | null>(null)
  const [resetting, setResetting] = useState(false)

  // Clientes — vista global de todas las barberías
  const [allCustomers, setAllCustomers] = useState<PlatformCustomer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customersLoaded, setCustomersLoaded] = useState(false)
  const [customerQuery, setCustomerQuery] = useState('')

  // Mi contraseña (SuperAdmin)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ text: string; error: boolean } | null>(null)

  // Novedades (owner viewing any barbershop's posts)
  const [novedadesTenantId, setNovedadesTenantId] = useState<string>('')
  const [ownerPosts, setOwnerPosts] = useState<OwnerPost[]>([])
  const [ownerPostsLoading, setOwnerPostsLoading] = useState(false)
  const [openComments, setOpenComments] = useState<string | null>(null)
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [showGlobalPostForm, setShowGlobalPostForm] = useState(false)
  const [globalPostContent, setGlobalPostContent] = useState('')
  const [globalPostImageUrl, setGlobalPostImageUrl] = useState<string | null>(null)
  const [uploadingGlobalImage, setUploadingGlobalImage] = useState(false)
  const [globalPostSaving, setGlobalPostSaving] = useState(false)
  const globalImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.role !== 'SuperAdmin') {
      navigate('/')
      return
    }
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [l, t, te, s, pa] = await Promise.all([
        api.get('/super-admin/licenses').then(r => r.data),
        api.get('/super-admin/tenants').then(r => r.data),
        api.get('/super-admin/testimonials').then(r => r.data),
        api.get('/super-admin/platform-settings').then(r => r.data),
        api.get('/super-admin/phone-audit').then(r => r.data).catch(() => null),
      ])
      setLicenses(l)
      setTenants(t)
      setTestimonials(te)
      const ps = s ?? {}
      setPlatformSettings(ps)
      setSettingsForm(ps)
      setPhoneAudit(pa)
    } finally {
      setLoading(false)
    }
  }

  async function generateLicense(e: React.FormEvent) {
    e.preventDefault()
    if (!newExpiry) return
    setGenerating(true); setLicenseMsg(''); setLicenseErr(false)
    try {
      const isoExpiry = new Date(`${newExpiry}T23:59:59`).toISOString()
      const res = await api.post('/super-admin/licenses', { expiresAt: isoExpiry, notes: newNotes || null })
      setNewExpiry(''); setNewNotes('')
      setLicenseMsg(`Licencia generada: ${res.data.code}`)
      await loadAll()
    } catch (err: any) {
      setLicenseErr(true)
      setLicenseMsg(err?.response?.data?.title ?? 'Error al generar la licencia')
    } finally {
      setGenerating(false)
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  async function setTestimonialVisibility(t: Testimonial, patch: Partial<Pick<Testimonial, 'showOnHome' | 'showOnLogin' | 'showOnRegister'>>) {
    await api.put(`/super-admin/testimonials/${t.id}/visibility`, {
      showOnHome: t.showOnHome, showOnLogin: t.showOnLogin, showOnRegister: t.showOnRegister, ...patch,
    })
    await loadAll()
  }

  async function approveTestimonial(id: string) {
    await api.post(`/super-admin/testimonials/${id}/approve`)
    await loadAll()
  }

  async function rejectTestimonial(id: string) {
    await api.post(`/super-admin/testimonials/${id}/reject`)
    await loadAll()
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.put('/super-admin/platform-settings', settingsForm)
      setSettingsMsg('Configuración guardada')
    } catch {
      setSettingsMsg('Error al guardar')
    }
  }

  // Logo oficial: siempre por archivo subido — nunca por URL externa (23.11.10)
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    try {
      const url = await uploadsService.uploadImage(file)
      await api.put('/super-admin/platform-settings/logo', { logoUrl: url })
      setSettingsForm(f => ({ ...f, logoUrl: url }))
      setPlatformSettings(f => ({ ...f, logoUrl: url }))
      notifyBrandLogoUpdated()
    } catch {
      setSettingsMsg('Error al subir el logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function loadAllCustomers() {
    setCustomersLoading(true)
    try {
      const r = await api.get('/super-admin/customers')
      setAllCustomers(r.data ?? [])
      setCustomersLoaded(true)
    } finally {
      setCustomersLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'clients' && !customersLoaded) loadAllCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  async function deleteCustomer(c: PlatformCustomer) {
    if (!await confirmDialog(`Quitar a ${c.fullName} de ${c.tenantName}? Esta acción no se puede deshacer.`, { confirmLabel: 'Quitar' })) return
    await api.delete(`/super-admin/customers/${c.id}`)
    loadAllCustomers()
  }

  async function deleteTenant(t: TenantSummary) {
    if (!await confirmDialog(`Eliminar la barbería ${t.name}? Esta acción no se puede deshacer — sus barberos y clientes perderán acceso a ella inmediatamente.`, { confirmLabel: 'Eliminar' })) return
    await api.delete(`/super-admin/tenants/${t.id}`)
    loadAll()
  }

  async function deleteLicense(l: License) {
    const warning = l.isAssigned
      ? `Esta licencia está asignada — al eliminarla, el barbero pierde acceso de inmediato. ¿Eliminar igual?`
      : `Eliminar esta licencia disponible?`
    if (!await confirmDialog(warning, { confirmLabel: 'Eliminar' })) return
    await api.delete(`/super-admin/licenses/${l.id}`)
    loadAll()
  }

  async function saveMyPassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: 'Las contraseñas no coinciden', error: true })
      return
    }
    setSavingPw(true); setPwMsg(null)
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPwMsg({ text: 'Contraseña actualizada', error: false })
    } catch (err: any) {
      setPwMsg({ text: err?.response?.data?.title ?? 'Error al cambiar la contraseña', error: true })
    } finally {
      setSavingPw(false)
    }
  }

  async function toggleTenantMembers(tenantId: string) {
    if (expandedTenant === tenantId) { setExpandedTenant(null); return }
    setExpandedTenant(tenantId)
    if (!members[tenantId]) {
      const r = await api.get(`/super-admin/tenants/${tenantId}/members`)
      setMembers(m => ({ ...m, [tenantId]: r.data }))
    }
  }

  async function submitPasswordReset(e: React.FormEvent) {
    e.preventDefault()
    if (!resetTarget || resetPassword.length < 8) return
    setResetting(true); setResetMsg(null)
    try {
      await api.post(`/super-admin/users/${resetTarget.userId}/reset-password`, { newPassword: resetPassword })
      setResetMsg({ text: 'Contraseña actualizada', error: false })
      setResetPassword('')
    } catch (err: any) {
      setResetMsg({ text: err?.response?.data?.title ?? 'Error al restablecer', error: true })
    } finally {
      setResetting(false)
    }
  }

  async function loadOwnerPosts(tenantId: string) {
    if (!tenantId) { setOwnerPosts([]); return }
    setOwnerPostsLoading(true)
    try {
      const r = await api.get(`/super-admin/tenants/${tenantId}/posts`)
      setOwnerPosts(r.data ?? [])
    } finally {
      setOwnerPostsLoading(false)
    }
  }

  async function ownerReact(postId: string, type: number) {
    await api.post(`/super-admin/posts/${postId}/reactions`, { type })
    loadOwnerPosts(novedadesTenantId)
  }

  async function deleteOwnerPost(postId: string) {
    if (!await confirmDialog('Eliminar esta publicación? Esta acción no se puede deshacer.')) return
    await api.delete(`/super-admin/posts/${postId}`)
    loadOwnerPosts(novedadesTenantId)
  }

  async function handleGlobalImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingGlobalImage(true)
    try {
      const url = await uploadsService.uploadImage(file)
      setGlobalPostImageUrl(url)
    } catch {
      // best-effort — keep the post usable without the image
    } finally {
      setUploadingGlobalImage(false)
    }
  }

  async function createGlobalPost(e: React.FormEvent) {
    e.preventDefault()
    if (!globalPostContent.trim()) return
    setGlobalPostSaving(true)
    try {
      await api.post('/super-admin/posts/global', { content: globalPostContent.trim(), imageUrl: globalPostImageUrl })
      setGlobalPostContent('')
      setGlobalPostImageUrl(null)
      setShowGlobalPostForm(false)
      loadOwnerPosts(novedadesTenantId)
    } finally {
      setGlobalPostSaving(false)
    }
  }

  async function ownerComment(postId: string) {
    const text = (commentDrafts[postId] ?? '').trim()
    if (!text) return
    await api.post(`/super-admin/posts/${postId}/comments`, { text })
    setCommentDrafts(d => ({ ...d, [postId]: '' }))
    loadOwnerPosts(novedadesTenantId)
  }

  const stats = useMemo(() => {
    const activeLicenses = licenses.filter(l => !l.isExpired && !l.isAssigned).length
    const expiredLicenses = licenses.filter(l => l.isExpired && !l.isAssigned).length
    const activeTenants = tenants.filter(t => t.licenseActive).length
    const totalBarbers = tenants.reduce((s, t) => s + t.barberCount, 0)
    const totalCustomers = tenants.reduce((s, t) => s + t.customerCount, 0)
    return { activeLicenses, expiredLicenses, activeTenants, totalBarbers, totalCustomers }
  }, [licenses, tenants])

  const navItems: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Resumen', icon: LayoutDashboard },
    { key: 'tenants', label: 'Barberías', icon: Building2 },
    { key: 'clients', label: 'Clientes', icon: Users },
    { key: 'licenses', label: 'Licencias', icon: KeyRound },
    { key: 'novedades', label: 'Novedades', icon: Newspaper },
    { key: 'testimonials', label: 'Testimonios', icon: MessageSquareQuote },
    { key: 'settings', label: 'Configuración', icon: Settings },
  ]

  useEffect(() => {
    if (tab === 'novedades' && !novedadesTenantId && tenants.length > 0) {
      setNovedadesTenantId(tenants[0].id)
    }
  }, [tab, tenants, novedadesTenantId])

  useEffect(() => {
    if (tab === 'novedades' && novedadesTenantId) loadOwnerPosts(novedadesTenantId)
  }, [tab, novedadesTenantId])

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 h-screen bg-zinc-950 border-r border-zinc-800 fixed left-0 top-0">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-zinc-800">
          <Shield className="text-red-600 w-6 h-6" />
          <div>
            <p className="text-white font-black text-sm leading-none">BarberOS</p>
            <p className="text-zinc-500 text-xs">SuperAdmin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                tab === key
                  ? 'bg-red-600/15 text-red-500 border border-red-600/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-zinc-800">
          <p className="text-zinc-200 text-sm font-medium truncate px-2">{user?.fullName}</p>
          <button onClick={logout} className="w-full text-left px-2 py-2 text-sm text-zinc-500 hover:text-red-400 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 bg-zinc-950 border-b border-zinc-800 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-red-600 w-5 h-5" />
          <span className="text-white font-bold text-sm">SuperAdmin</span>
        </div>
        <button onClick={logout} className="text-zinc-400 text-sm">Salir</button>
      </header>

      <div className="flex-1 min-w-0 md:ml-60 pt-14 md:pt-0">
        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1 overflow-x-auto px-4 py-3 border-b border-zinc-800">
          {navItems.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[40px] ${
                tab === key ? 'bg-red-600 text-white' : 'text-zinc-400 bg-zinc-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">Resumen de la plataforma</h1>
                <p className="text-zinc-500 text-sm mt-1">Vista general de BarberOS — barberías, licencias y crecimiento</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                <StatCard icon={Building2} label="Barberías" value={tenants.length} accent="bg-blue-500/10 text-blue-400" />
                <StatCard icon={CheckCircle2} label="Con licencia activa" value={stats.activeTenants} accent="bg-green-500/10 text-green-400" />
                <StatCard icon={AlertTriangle} label="Sin licencia / vencidas" value={tenants.length - stats.activeTenants} accent="bg-orange-500/10 text-orange-400" />
                <StatCard icon={KeyRound} label="Licencias disponibles" value={stats.activeLicenses} accent="bg-red-500/10 text-red-500" />
                <StatCard icon={UserCheck} label="Barberos totales" value={stats.totalBarbers} accent="bg-red-500/10 text-red-500" />
                <StatCard icon={Users} label="Clientes totales" value={stats.totalCustomers} accent="bg-blue-500/10 text-blue-400" />
              </div>

              {/* 23.17.5 — auditoría de teléfonos existentes registrados antes de la regla de 10 dígitos */}
              {phoneAudit && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-800">
                    <h2 className="text-white font-bold text-sm">Auditoría de teléfonos existentes</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">Registros que no cumplen la regla de 10 dígitos numéricos</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
                    {([
                      ['Usuarios', phoneAudit.users],
                      ['Barberos', phoneAudit.barbers],
                      ['Clientes', phoneAudit.customers],
                    ] as const).map(([label, c]) => {
                      const toFix = c.tooShort + c.tooLong + c.invalidChars
                      return (
                        <div key={label} className="px-6 py-4">
                          <p className="text-white font-semibold text-sm mb-2">{label} <span className="text-zinc-500 font-normal">({c.total})</span></p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-zinc-500">Válidos</span><span className="text-green-400">{c.valid}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Sin teléfono</span><span className="text-zinc-400">{c.empty}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Muy corto</span><span className={c.tooShort > 0 ? 'text-orange-400' : 'text-zinc-600'}>{c.tooShort}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Muy largo</span><span className={c.tooLong > 0 ? 'text-orange-400' : 'text-zinc-600'}>{c.tooLong}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Caracteres inválidos</span><span className={c.invalidChars > 0 ? 'text-orange-400' : 'text-zinc-600'}>{c.invalidChars}</span></div>
                            <div className="flex justify-between pt-1 border-t border-zinc-800 font-semibold"><span className="text-zinc-300">A corregir</span><span className={toFix > 0 ? 'text-red-400' : 'text-green-400'}>{toFix}</span></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-800">
                  <h2 className="text-white font-bold text-sm">Barberías recientes</h2>
                </div>
                {tenants.length === 0 ? (
                  <p className="text-zinc-600 text-center py-10 text-sm">Aún no hay barberías registradas</p>
                ) : (
                  <div className="divide-y divide-zinc-800">
                    {tenants.slice(0, 6).map(t => (
                      <div key={t.id} className="px-6 py-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{t.name}</p>
                          <p className="text-zinc-500 text-xs">/{t.slug} · {t.barberCount} barberos · {t.customerCount} clientes</p>
                        </div>
                        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border ${statusLabel[t.status]?.cls ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                          {statusLabel[t.status]?.label ?? t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tenants */}
          {tab === 'tenants' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">Barberías</h1>
                <p className="text-zinc-500 text-sm mt-1">{tenants.length} barberías registradas en la plataforma</p>
              </div>

              {tenants.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
                  <Building2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">No hay barberías aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenants.map(t => (
                    <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 bg-red-600/10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                            {t.logoUrl ? (
                              <img src={t.logoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Scissors className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-bold">{t.name}</p>
                            <p className="text-zinc-500 text-xs">/{t.slug} · creada {new Date(t.createdAt).toLocaleDateString('es-CO')}</p>
                            {t.address && <p className="text-zinc-600 text-xs mt-0.5">{t.address}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 self-start">
                          <span className={`text-xs px-2.5 py-1 rounded-lg border ${statusLabel[t.status]?.cls ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                            {statusLabel[t.status]?.label ?? t.status}
                          </span>
                          <button
                            onClick={() => deleteTenant(t)}
                            title="Eliminar barbería"
                            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-red-500/10 flex items-center justify-center transition-colors group"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 transition-colors" />
                          </button>
                        </div>
                      </div>

                      {/* 23.15.5 — dueño, contacto y código de invitación, todo en la misma tarjeta */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-zinc-800 text-xs">
                        <div>
                          <p className="text-zinc-600">Dueño</p>
                          <p className="text-white">{t.ownerName ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Correo dueño</p>
                          <p className="text-white truncate">{t.ownerEmail ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Teléfono dueño</p>
                          <p className="text-white">{t.ownerPhone ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600">Código de invitación</p>
                          <p className="text-white font-mono">{t.activeInvitationCode ?? '—'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-3 pt-3 border-t border-zinc-800">
                        <div>
                          <p className="text-zinc-600 text-xs">Barberos</p>
                          <p className="text-white font-semibold text-sm">{t.barberCount}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-xs">Clientes</p>
                          <p className="text-white font-semibold text-sm">{t.customerCount}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-xs">Citas</p>
                          <p className="text-white font-semibold text-sm">{t.appointmentCount}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-xs">Calificación</p>
                          <p className="text-white font-semibold text-sm">{t.ratingCount > 0 ? `${t.averageRatingStars.toFixed(1)} ★ (${t.ratingCount})` : '—'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-xs">Licencia</p>
                          <p className="text-white font-mono text-xs">{t.licenseCode ?? '—'}</p>
                        </div>
                        <div>
                          <p className="text-zinc-600 text-xs">Vence</p>
                          <p className="text-white text-xs">{t.licenseExpiresAt ? new Date(t.licenseExpiresAt).toLocaleDateString('es-CO') : '—'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleTenantMembers(t.id)}
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors mt-3"
                      >
                        <Users className="w-3.5 h-3.5" />
                        Ver miembros y restablecer contraseñas
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedTenant === t.id ? 'rotate-180' : ''}`} />
                      </button>

                      {expandedTenant === t.id && (
                        <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                          {!members[t.id] ? (
                            <p className="text-zinc-600 text-xs py-2">Cargando miembros...</p>
                          ) : members[t.id].length === 0 ? (
                            <p className="text-zinc-600 text-xs py-2">Sin miembros aún</p>
                          ) : (
                            members[t.id].map(m => (
                              <div key={m.userId} className="flex items-center justify-between gap-3 bg-zinc-800/50 rounded-xl px-3 py-2">
                                <div className="min-w-0">
                                  <p className="text-zinc-200 text-xs font-medium truncate">{m.fullName} <span className="text-zinc-600">· {m.role}</span></p>
                                  <p className="text-zinc-600 text-xs truncate">{m.email}</p>
                                </div>
                                <button
                                  onClick={() => { setResetTarget(m); setResetPassword(''); setResetMsg(null) }}
                                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                                >
                                  <Lock className="w-3 h-3" /> Restablecer
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clientes — vista global de todas las barberías */}
          {tab === 'clients' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">Clientes</h1>
                <p className="text-zinc-500 text-sm mt-1">{allCustomers.length} clientes en toda la plataforma</p>
              </div>

              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  className="w-full pl-9 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-red-600"
                  placeholder="Buscar por nombre, correo, teléfono o barbería..."
                  value={customerQuery}
                  onChange={e => setCustomerQuery(e.target.value)}
                />
              </div>

              {customersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Un mismo correo puede aparecer varias veces a propósito — multi-tenant: un
                      cliente puede unirse a varias barberías, y cada vínculo es un registro
                      separado. Se agrupan aquí por usuario para que eso quede claro, en vez de
                      parecer un dato duplicado/incorrecto. */}
                  {Array.from(
                    allCustomers
                      .filter(c => {
                        const q = customerQuery.toLowerCase()
                        if (!q) return true
                        return c.fullName.toLowerCase().includes(q) ||
                          c.email?.toLowerCase().includes(q) ||
                          c.phone.includes(q) ||
                          c.tenantName.toLowerCase().includes(q)
                      })
                      .reduce((groups, c) => {
                        const key = c.userId ?? c.id
                        if (!groups.has(key)) groups.set(key, [])
                        groups.get(key)!.push(c)
                        return groups
                      }, new Map<string, PlatformCustomer[]>())
                      .values()
                  ).map(group => {
                    const first = group[0]
                    return (
                      <div key={first.userId ?? first.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 flex items-start gap-4">
                        <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-sm">{first.fullName[0]?.toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{first.fullName}</p>
                          <p className="text-zinc-500 text-xs mt-0.5 truncate">{first.email ?? first.phone}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {group.map(c => (
                              <span key={c.id} className="inline-flex items-center gap-1.5 bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-lg">
                                <Building2 className="w-3 h-3 shrink-0" /> {c.tenantName}
                                <button
                                  onClick={() => deleteCustomer(c)}
                                  title="Quitar de esta barbería"
                                  className="text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                        {first.userId && (
                          <button
                            onClick={() => { setResetTarget({ userId: first.userId!, fullName: first.fullName, email: first.email ?? first.phone, role: 'Customer' }); setResetPassword(''); setResetMsg(null) }}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0"
                          >
                            <Lock className="w-3 h-3" /> Restablecer
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {allCustomers.length === 0 && (
                    <p className="text-zinc-600 text-center py-8">No hay clientes registrados aún</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Licenses */}
          {tab === 'licenses' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">Licencias</h1>
                <p className="text-zinc-500 text-sm mt-1">Cada licencia tiene un solo uso — el código se genera automáticamente</p>
              </div>

              <form onSubmit={generateLicense} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-red-600" /> Generar nueva licencia
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Fecha de caducidad *</label>
                    <input
                      type="date"
                      value={newExpiry}
                      onChange={e => setNewExpiry(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Notas (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: licencia anual cliente X"
                      value={newNotes}
                      onChange={e => setNewNotes(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-4">
                  <button
                    type="submit"
                    disabled={generating || !newExpiry}
                    className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
                  >
                    {generating ? 'Generando...' : 'Generar licencia'}
                  </button>
                  {licenseMsg && (
                    <span className={`text-sm ${licenseErr ? 'text-red-500' : 'text-green-400'}`}>{licenseMsg}</span>
                  )}
                </div>
              </form>

              <div className="space-y-3">
                {licenses.map(l => (
                  <div key={l.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="font-mono text-red-500 font-bold text-base break-all">{l.code}</span>
                      <button onClick={() => copyCode(l.code)} className="text-zinc-500 hover:text-white transition-colors shrink-0" title="Copiar">
                        {copiedCode === l.code ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <div className="text-zinc-500 text-xs">
                        {l.notes && <span className="mr-2">{l.notes}</span>}
                        Vence: {new Date(l.expiresAt).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {l.isExpired && <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded-lg">Expirada</span>}
                      {l.isAssigned && <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-lg">Usada (1 solo uso)</span>}
                      {!l.isAssigned && !l.isExpired && <span className="bg-red-600/20 text-red-500 text-xs px-2 py-1 rounded-lg">Disponible</span>}
                      <button
                        onClick={() => deleteLicense(l)}
                        title="Eliminar licencia"
                        className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-red-500/10 flex items-center justify-center transition-colors group"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-zinc-500 group-hover:text-red-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                ))}
                {licenses.length === 0 && !loading && (
                  <p className="text-zinc-600 text-center py-8">No hay licencias aún</p>
                )}
              </div>
            </div>
          )}

          {/* Novedades — owner browses any barbershop's posts and reacts/comments as "Dueño {nick}" */}
          {tab === 'novedades' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-white">Novedades</h1>
                  <p className="text-zinc-500 text-sm mt-1">Mira y participa en las publicaciones de cualquier barbería</p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <select
                    value={novedadesTenantId}
                    onChange={e => setNovedadesTenantId(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-red-600 min-w-0 flex-1 sm:min-w-[180px] sm:flex-initial"
                  >
                    {tenants.length === 0 && <option value="">Sin barberías</option>}
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button
                    onClick={() => setShowGlobalPostForm(v => !v)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors whitespace-nowrap"
                  >
                    + Anuncio BarberOS
                  </button>
                </div>
              </div>

              {showGlobalPostForm && (
                <form onSubmit={createGlobalPost} className="bg-zinc-900 border border-blue-600/30 rounded-2xl p-5 space-y-3">
                  <h2 className="text-white font-semibold text-sm">Publicación BarberOS — se muestra a todas las barberías y usuarios</h2>
                  <textarea
                    value={globalPostContent}
                    onChange={e => setGlobalPostContent(e.target.value)}
                    rows={3}
                    placeholder="Anuncio oficial de la plataforma..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 resize-none"
                  />

                  {globalPostImageUrl ? (
                    <div className="relative">
                      <img src={globalPostImageUrl} alt="Vista previa" className="w-full max-h-56 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => setGlobalPostImageUrl(null)}
                        className="absolute top-2 right-2 w-7 h-7 bg-black/70 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => globalImageInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault()
                        const file = e.dataTransfer.files?.[0]
                        if (file) {
                          setUploadingGlobalImage(true)
                          uploadsService.uploadImage(file).then(setGlobalPostImageUrl).finally(() => setUploadingGlobalImage(false))
                        }
                      }}
                      disabled={uploadingGlobalImage}
                      className="w-full border border-dashed border-zinc-700 hover:border-blue-500 rounded-xl py-4 flex items-center justify-center gap-2 text-zinc-500 hover:text-blue-400 transition-colors text-sm"
                    >
                      {uploadingGlobalImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                      {uploadingGlobalImage ? 'Subiendo imagen...' : 'Subir o arrastrar una foto (opcional)'}
                    </button>
                  )}
                  <input ref={globalImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleGlobalImagePick} />

                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setShowGlobalPostForm(false); setGlobalPostImageUrl(null) }} className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2 rounded-xl text-sm transition-colors">
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={globalPostSaving || !globalPostContent.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 rounded-xl text-sm transition-colors"
                    >
                      {globalPostSaving ? 'Publicando...' : 'Publicar para todos'}
                    </button>
                  </div>
                </form>
              )}

              {ownerPostsLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : ownerPosts.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
                  <Newspaper className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500">Esta barbería aún no tiene publicaciones</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-2xl">
                  {ownerPosts.map(p => {
                    const total = p.reactions.reduce((s, r) => s + r.count, 0)
                    return (
                      <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-blue-600 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                                {p.authorAvatarUrl ? <img src={p.authorAvatarUrl} className="w-full h-full object-cover" /> : <Scissors className="w-4 h-4 text-white" />}
                              </div>
                              <div>
                                <p className="text-white text-sm font-semibold">{p.authorName}</p>
                                <p className="text-zinc-500 text-xs">
                                  {new Date(p.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => deleteOwnerPost(p.id)} className="text-zinc-600 hover:text-red-500 transition-colors shrink-0" title="Eliminar publicación">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>
                        </div>

                        {p.imageUrl && <img src={p.imageUrl} alt="Post" className="w-full max-h-96 object-cover" />}

                        <div className="px-5 py-3 border-t border-zinc-800 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {OWNER_REACTIONS.map(r => {
                              const count = p.reactions.find(x => x.type === r.label)?.count ?? 0
                              return (
                                <button
                                  key={r.type}
                                  onClick={() => ownerReact(p.id, r.type)}
                                  className={`flex items-center gap-1 text-xs transition-colors hover:scale-110 ${r.color}`}
                                  title={r.displayLabel}
                                >
                                  <r.icon className="w-4 h-4" />
                                  {count > 0 && <span>{count}</span>}
                                </button>
                              )
                            })}
                            <span className="text-zinc-500 text-xs">{total > 0 ? `· ${total} total` : ''}</span>
                          </div>
                          <button
                            onClick={() => setOpenComments(openComments === p.id ? null : p.id)}
                            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>{p.comments.length}</span>
                          </button>
                        </div>

                        {openComments === p.id && (
                          <div className="px-5 pb-4 space-y-2 border-t border-zinc-800 pt-3">
                            {p.comments.map(c => (
                              <div key={c.id} className="bg-zinc-800/50 rounded-xl px-4 py-2.5">
                                <p className="text-xs font-semibold text-blue-400 mb-0.5">{c.authorName}</p>
                                <p className="text-zinc-300 text-sm">{c.text}</p>
                              </div>
                            ))}
                            <div className="flex gap-2 mt-2">
                              <input
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                                placeholder="Comentar como Dueño..."
                                value={commentDrafts[p.id] ?? ''}
                                onChange={e => setCommentDrafts(d => ({ ...d, [p.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && ownerComment(p.id)}
                              />
                              <button onClick={() => ownerComment(p.id)} className="text-blue-400 hover:text-blue-300 transition-colors">
                                <Send className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Testimonials */}
          {tab === 'testimonials' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">Testimonios</h1>
                <p className="text-zinc-500 text-sm mt-1">Aprueba o rechaza testimonios de barberías, y elige cuáles se muestran en Home, Login y Registro</p>
              </div>
              <div className="space-y-3">
                {testimonials.length === 0 && (
                  <p className="text-zinc-600 text-center py-8">No hay testimonios aún</p>
                )}
                {testimonials.map(t => (
                  <div key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-white text-sm mb-2">"{t.content}"</p>
                        <p className="text-zinc-400 text-xs">— {t.authorName} · {t.barbershipName}</p>
                      </div>
                      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border ${
                        t.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : t.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/30'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                      }`}>
                        {t.status === 'Approved' ? 'Aprobado' : t.status === 'Rejected' ? 'Rechazado' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-zinc-800 flex-wrap">
                      {t.status !== 'Approved' && (
                        <button
                          onClick={() => approveTestimonial(t.id)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600/15 text-green-400 hover:bg-green-600/25 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar
                        </button>
                      )}
                      {t.status !== 'Rejected' && (
                        <button
                          onClick={() => rejectTestimonial(t.id)}
                          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600/15 text-red-400 hover:bg-red-600/25 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" /> Rechazar
                        </button>
                      )}

                      {t.status === 'Approved' && (
                        <>
                          <div className="w-px h-5 bg-zinc-800 mx-1" />
                          <button
                            onClick={() => setTestimonialVisibility(t, { showOnHome: !t.showOnHome })}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                              t.showOnHome ? 'bg-red-600/20 text-red-500' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                            }`}
                          >
                            {t.showOnHome ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            Home
                          </button>
                          <button
                            onClick={() => setTestimonialVisibility(t, { showOnLogin: !t.showOnLogin })}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                              t.showOnLogin ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                            }`}
                          >
                            {t.showOnLogin ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            Login
                          </button>
                          <button
                            onClick={() => setTestimonialVisibility(t, { showOnRegister: !t.showOnRegister })}
                            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                              t.showOnRegister ? 'bg-purple-500/20 text-purple-400' : 'bg-zinc-800 text-zinc-500 hover:text-white'
                            }`}
                          >
                            {t.showOnRegister ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                            Registro
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          {tab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-white">Configuración</h1>
                <p className="text-zinc-500 text-sm mt-1">Información de contacto que ven los barberos al registrarse</p>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-semibold text-sm">Logo oficial BarberOS</h2>
                <p className="text-zinc-500 text-xs">Sube un archivo PNG, JPG o WEBP — no se admiten links externos</p>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden shrink-0">
                    {platformSettings.logoUrl ? (
                      <img src={platformSettings.logoUrl} alt="Logo BarberOS" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="w-7 h-7 text-zinc-600" />
                    )}
                  </div>
                  <label className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors cursor-pointer flex items-center gap-2">
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                    {uploadingLogo ? 'Subiendo...' : platformSettings.logoUrl ? 'Reemplazar logo' : 'Subir logo'}
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleLogoUpload} disabled={uploadingLogo} />
                  </label>
                </div>
              </div>
              <form onSubmit={saveSettings} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="grid gap-4">
                  <input
                    type="text"
                    placeholder="Teléfono"
                    value={settingsForm.contactPhone ?? ''}
                    onChange={e => setSettingsForm(f => ({ ...f, contactPhone: e.target.value }))}
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                  />
                  <input
                    type="email"
                    placeholder="Correo electrónico"
                    value={settingsForm.contactEmail ?? ''}
                    onChange={e => setSettingsForm(f => ({ ...f, contactEmail: e.target.value }))}
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                  />
                  <input
                    type="text"
                    placeholder="WhatsApp (con código de país)"
                    value={settingsForm.contactWhatsApp ?? ''}
                    onChange={e => setSettingsForm(f => ({ ...f, contactWhatsApp: e.target.value }))}
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
                  />
                  <textarea
                    placeholder="Mensaje para nuevos barberos"
                    rows={3}
                    value={settingsForm.contactMessage ?? ''}
                    onChange={e => setSettingsForm(f => ({ ...f, contactMessage: e.target.value }))}
                    className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600 resize-none"
                  />
                </div>
                <div className="flex items-center flex-wrap gap-4">
                  <button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl transition-colors">
                    Guardar
                  </button>
                  {settingsMsg && <span className="text-sm text-red-500">{settingsMsg}</span>}
                </div>
              </form>

              <form onSubmit={saveMyPassword} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-white font-bold text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-500" /> Mi contraseña
                </h2>
                <p className="text-zinc-500 text-xs">Cambia la contraseña de tu propia cuenta SuperAdmin ({user?.fullName ?? user?.email}).</p>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1.5">Contraseña actual</label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Nueva contraseña</label>
                    <input
                      type="password"
                      value={pwForm.newPassword}
                      onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
                      minLength={8}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-1.5">Confirmar contraseña</label>
                    <input
                      type="password"
                      value={pwForm.confirmPassword}
                      onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      minLength={8}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-4">
                  <button
                    type="submit"
                    disabled={savingPw}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors"
                  >
                    {savingPw ? 'Actualizando...' : 'Actualizar mi contraseña'}
                  </button>
                  {pwMsg && <span className={`text-sm ${pwMsg.error ? 'text-red-500' : 'text-green-400'}`}>{pwMsg.text}</span>}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {resetTarget && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-bold">Restablecer contraseña</h3>
              </div>
              <button onClick={() => setResetTarget(null)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-zinc-400 text-sm">
              Nueva contraseña para <span className="text-white font-medium">{resetTarget.fullName}</span> ({resetTarget.email})
            </p>
            <form onSubmit={submitPasswordReset} className="space-y-3">
              <input
                type="password"
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                required
              />
              {resetMsg && <p className={`text-sm ${resetMsg.error ? 'text-red-500' : 'text-green-400'}`}>{resetMsg.text}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-xl text-sm transition-colors"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={resetting || resetPassword.length < 8}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {resetting ? 'Guardando...' : 'Restablecer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
