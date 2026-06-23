import { useEffect, useRef, useState } from 'react'
import { Camera, Upload } from 'lucide-react'
import QrScanner from 'qr-scanner'
import QrScannerWorkerPath from 'qr-scanner/qr-scanner-worker.min.js?url'

QrScanner.WORKER_PATH = QrScannerWorkerPath

/** Reads a QR code either via live camera (with permission) or from an uploaded image. */
export function QrCodeReader({ onDecode }: { onDecode: (text: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<QrScanner | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => {
    scannerRef.current?.stop()
    scannerRef.current?.destroy()
  }, [])

  async function startCamera() {
    setError(null)
    if (!videoRef.current) return
    try {
      const scanner = new QrScanner(
        videoRef.current,
        result => onDecode(typeof result === 'string' ? result : result.data),
        { highlightScanRegion: true, highlightCodeOutline: true },
      )
      scannerRef.current = scanner
      await scanner.start()
      setCameraActive(true)
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.')
    }
  }

  function stopCamera() {
    scannerRef.current?.stop()
    scannerRef.current?.destroy()
    scannerRef.current = null
    setCameraActive(false)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      onDecode(result.data)
    } catch {
      setError('No se encontró un código QR en esa imagen.')
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-zinc-950 aspect-square">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={startCamera}
              className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Activar cámara
            </button>
          </div>
        )}
      </div>

      {cameraActive && (
        <button
          type="button"
          onClick={stopCamera}
          className="w-full border border-zinc-700 text-zinc-400 hover:text-white py-2 rounded-xl text-sm transition-colors"
        >
          Detener cámara
        </button>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-zinc-800" />
        <span className="text-zinc-600 text-xs">o</span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full border border-dashed border-zinc-700 hover:border-red-600 rounded-xl py-3 flex items-center justify-center gap-2 text-zinc-400 hover:text-red-500 text-sm transition-colors"
      >
        <Upload className="w-4 h-4" />
        Subir imagen con el QR
      </button>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
    </div>
  )
}

/** Extracts the opaque invite token from a scanned QR payload — either a full join
 * URL (`.../join?token=<guid>`) or, defensively, a bare token string. */
export function extractInviteToken(payload: string): string | null {
  try {
    const url = new URL(payload)
    const token = url.searchParams.get('token')
    if (token) return token
  } catch {
    // not a URL — fall through to bare-token check below
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.trim())
    ? payload.trim()
    : null
}
