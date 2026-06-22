import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface ConfirmOptions {
  title?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmFn = (message: string, options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** 23.20.11 — replaces the native window.confirm() popup (which shows the raw "localhost:4200
 * dice" browser chrome) with a modal visually consistent with the rest of BarberOS. */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ message: string; options: ConfirmOptions } | null>(null)
  const resolver = useRef<((value: boolean) => void) | undefined>(undefined)

  const confirm = useCallback<ConfirmFn>((message, options = {}) => {
    setState({ message, options })
    return new Promise(resolve => { resolver.current = resolve })
  }, [])

  function close(result: boolean) {
    resolver.current?.(result)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${state.options.danger !== false ? 'bg-red-600/15' : 'bg-zinc-800'}`}>
                <AlertTriangle className={`w-4.5 h-4.5 ${state.options.danger !== false ? 'text-red-500' : 'text-zinc-400'}`} />
              </div>
              <div className="min-w-0">
                {state.options.title && <p className="text-white font-bold text-sm mb-1">{state.options.title}</p>}
                <p className="text-zinc-300 text-sm leading-relaxed">{state.message}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => close(false)}
                className="flex-1 border border-zinc-700 text-zinc-400 hover:text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {state.options.cancelLabel ?? 'Cancelar'}
              </button>
              <button
                onClick={() => close(true)}
                className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition-colors ${
                  state.options.danger !== false
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                }`}
              >
                {state.options.confirmLabel ?? 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx
}
