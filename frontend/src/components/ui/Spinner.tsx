export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="border-2 border-red-600 border-t-transparent rounded-full animate-spin inline-block"
    />
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={40} />
    </div>
  )
}
