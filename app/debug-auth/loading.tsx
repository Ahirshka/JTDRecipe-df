import { RefreshCw } from "lucide-react"

export default function DebugAuthLoading() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <h2 className="text-xl font-semibold mb-2">Loading Debug Tools...</h2>
          <p className="text-gray-600">Preparing authentication debugging interface</p>
        </div>
      </div>
    </div>
  )
}
