import { useState, useEffect, useRef } from 'react'
import { User as UserIcon, Mail, Phone, Camera, KeyRound, Save, Loader2 } from 'lucide-react'
import { profileService } from '@/services/profile.service'
import { uploadsService } from '@/services/uploads.service'
import { useAuth } from '@/contexts/AuthContext'
import { sanitizePhoneInput, validatePhone } from '@/utils/phone'
import { BackButton } from '@/components/shared/BackButton'
import type { MyProfile } from '@/types'

const roleLabel: Record<string, string> = {
  SuperAdmin: 'Dueño de BarberOS',
  Barber: 'Barbero',
  Customer: 'Cliente',
}

export default function ProfilePage() {
  const { user, refreshProfile, updateUserLocal } = useAuth()
  const [profile, setProfile] = useState<MyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [form, setForm] = useState({ fullName: '', displayName: '', email: '', phone: '' })
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ text: string; error: boolean } | null>(null)

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ text: string; error: boolean } | null>(null)

  useEffect(() => {
    profileService.get().then(p => {
      setProfile(p)
      setForm({
        fullName: p.fullName,
        displayName: p.displayName ?? '',
        email: p.email,
        phone: p.phone ?? '',
      })
    }).finally(() => setLoading(false))
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const url = await uploadsService.uploadImage(file)
      await profileService.updateAvatar(url)
      setProfile(p => p ? { ...p, avatarUrl: url } : p)
      updateUserLocal({ avatarUrl: url })
    } catch {
      setProfileMsg({ text: 'No se pudo subir la foto', error: true })
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    const phoneError = validatePhone(form.phone)
    if (phoneError) { setProfileMsg({ text: phoneError, error: true }); return }
    setSavingProfile(true); setProfileMsg(null)
    try {
      await profileService.update({
        fullName: form.fullName,
        displayName: form.displayName || null,
        email: form.email,
        phone: form.phone || null,
      })
      await refreshProfile()
      setProfileMsg({ text: 'Perfil actualizado', error: false })
    } catch (err: any) {
      setProfileMsg({ text: err?.response?.data?.title ?? 'Error al guardar', error: true })
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMsg({ text: 'Las contraseñas no coinciden', error: true })
      return
    }
    setSavingPw(true); setPwMsg(null)
    try {
      await profileService.changePassword({
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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <BackButton fallback={user?.role === 'Barber' ? '/barberia/dashboard' : '/user/dashboard'} />
      <div>
        <h1 className="text-2xl font-black text-white">Editar perfil</h1>
        <p className="text-zinc-400 text-sm mt-1">{profile && roleLabel[profile.role]}</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-blue-600 flex items-center justify-center overflow-hidden shrink-0">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-8 h-8 text-white" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition-colors border-2 border-zinc-900"
            title="Cambiar foto"
          >
            {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-white font-bold truncate">{form.displayName || form.fullName}</p>
          <p className="text-zinc-500 text-sm truncate">{form.email}</p>
        </div>
      </div>

      <form onSubmit={saveProfile} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-red-600" /> Datos personales
        </h2>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Nombre completo</label>
          <input
            type="text"
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5">Apodo (se muestra en novedades, ej: "Moiso")</label>
          <input
            type="text"
            value={form.displayName}
            onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red-600"
            placeholder="Opcional — si lo dejas vacío se usa tu nombre completo"
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
            <Mail className="w-3 h-3" /> Correo electrónico
          </label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1.5 flex items-center gap-1">
            <Phone className="w-3 h-3" /> Teléfono
          </label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: sanitizePhoneInput(e.target.value) }))}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-600"
          />
        </div>
        <div className="flex items-center flex-wrap gap-4">
          <button
            type="submit"
            disabled={savingProfile}
            className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {savingProfile ? 'Guardando...' : 'Guardar cambios'}
          </button>
          {profileMsg && <span className={`text-sm ${profileMsg.error ? 'text-red-500' : 'text-green-400'}`}>{profileMsg.text}</span>}
        </div>
      </form>

      <form onSubmit={savePassword} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-blue-500" /> Cambiar contraseña
        </h2>
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
            {savingPw ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
          {pwMsg && <span className={`text-sm ${pwMsg.error ? 'text-red-500' : 'text-green-400'}`}>{pwMsg.text}</span>}
        </div>
      </form>
    </div>
  )
}
