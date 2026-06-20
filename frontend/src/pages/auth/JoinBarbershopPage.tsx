import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, KeyRound } from 'lucide-react'
import { authService } from '@/services/auth.service'
import { useAuth } from '@/contexts/AuthContext'

export default function JoinBarbershopPage() {
  const navigate = useNavigate()
  const { setTokens } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tokens = await authService.joinBarbershop(code)
      setTokens(tokens)
      navigate('/user/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Código inválido o inactivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="text-red-600 w-8 h-8" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Scissors className="text-red-600 w-5 h-5" />
            <span className="text-white font-bold text-xl">BarberOS</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Unirte a una barbería</h1>
          <p className="text-zinc-400 text-sm">
            Ingresa el código de invitación que te compartió tu barbero
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              maxLength={10}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4 text-white text-center text-2xl font-mono tracking-[0.4em] placeholder-zinc-600 focus:outline-none focus:border-red-600"
              placeholder="XXXXXXXXXX"
              required
            />
            <p className="text-zinc-600 text-xs text-center mt-2">10 caracteres alfanuméricos</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 10}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-600/30 text-white font-bold py-3.5 rounded-xl transition-colors"
          >
            {loading ? 'Verificando...' : 'Unirme a la barbería'}
          </button>
        </form>
      </div>
    </div>
  )
}
