import { CaptureComposer } from "@/components/capture-composer"

export default function CapturePage() {
  return (
    <div className="flex justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl">
        <CaptureComposer variant="full" />
      </div>
    </div>
  )
}

