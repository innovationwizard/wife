"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type QueueItem = {
  id: string
  content: string
  createdAt: string
}

type MinimalRecognitionAlternative = { transcript?: string }

interface MinimalRecognitionResult {
  readonly length: number
  [index: number]: MinimalRecognitionAlternative | undefined
}

interface MinimalRecognitionEvent extends Event {
  readonly results: {
    readonly length: number
    [index: number]: MinimalRecognitionResult | undefined
  }
}

interface MinimalRecognitionErrorEvent extends Event {
  readonly error?: string
}

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  maxAlternatives?: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: MinimalRecognitionEvent) => void) | null
  onerror: ((event: MinimalRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

const STORAGE_KEY = "ssot.capture.queue.v1"

type CaptureVariant = "full" | "pwa"

interface CaptureComposerProps {
  variant?: CaptureVariant
}

export function CaptureComposer({ variant = "full" }: CaptureComposerProps) {
  const [input, setInput] = useState("")
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [isOnline, setIsOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  )
  const [isRecording, setIsRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null)

  const queueLoadedRef = useRef(false)
  const queueRef = useRef<QueueItem[]>([])
  const syncingRef = useRef(false)
  const skipClickRef = useRef(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const liveTranscriptRef = useRef("")

  const persistQueue = useCallback((next: QueueItem[]) => {
    if (typeof window === "undefined") return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as QueueItem[]
        setQueue(parsed)
        queueRef.current = parsed
      }
    } catch (error) {
      console.error("Failed to hydrate capture queue", error)
    } finally {
      queueLoadedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (!queueLoadedRef.current) return
    queueRef.current = queue
    persistQueue(queue)
  }, [queue, persistQueue])

  const syncQueue = useCallback(async () => {
    if (syncingRef.current) return
    if (typeof navigator !== "undefined" && !navigator.onLine) return
    if (!queueRef.current.length) return

    syncingRef.current = true
    const pending = [...queueRef.current].reverse()

    try {
      for (const entry of pending) {
        const response = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: entry.content })
        })

        if (!response.ok) {
          throw new Error("Failed to sync captured idea.")
        }

        setQueue((prev) => {
          const next = prev.filter((item) => item.id !== entry.id)
          queueRef.current = next
          return next
        })
      }
    } catch (error) {
      console.warn("Capture sync paused", error)
    } finally {
      syncingRef.current = false
    }
  }, [])

  useEffect(() => {
    const updateConnection = () => {
      if (typeof navigator === "undefined") return
      setIsOnline(navigator.onLine)
      if (navigator.onLine) {
        void syncQueue()
      }
    }

    window.addEventListener("online", updateConnection)
    window.addEventListener("offline", updateConnection)

    return () => {
      window.removeEventListener("online", updateConnection)
      window.removeEventListener("offline", updateConnection)
    }
  }, [syncQueue])

  useEffect(() => {
    if (typeof window === "undefined") return
    const globalWindow = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
    const RecognitionCtor =
      globalWindow.SpeechRecognition || globalWindow.webkitSpeechRecognition || null

    if (!RecognitionCtor) return

    const recognition: SpeechRecognitionInstance = new RecognitionCtor()
    recognition.lang = "en-US"
    recognition.interimResults = true
    if ("maxAlternatives" in recognition) {
      recognition.maxAlternatives = 1
    }

    recognition.onresult = (event: MinimalRecognitionEvent) => {
      const { results } = event
      let transcript = ""
      for (let i = 0; i < results.length; i += 1) {
        const result = results[i]
        if (!result) continue
        const alternative = result[0]
        if (alternative?.transcript) {
          transcript += alternative.transcript + " "
        }
      }
      liveTranscriptRef.current = transcript.trim()
    }

    recognition.onerror = (event: MinimalRecognitionErrorEvent) => {
      console.warn("Voice capture error", event.error)
      setVoiceStatus("Voice capture unavailable right now.")
      setIsRecording(false)
      skipClickRef.current = true
    }

    recognition.onend = () => {
      setIsRecording(false)
      const transcript = liveTranscriptRef.current.trim()
      if (transcript) {
        setInput((prev) =>
          prev ? `${prev.trim()}\n${transcript}` : transcript
        )
      }
      liveTranscriptRef.current = ""
      skipClickRef.current = true
      setVoiceStatus(null)
    }

    recognitionRef.current = recognition
    setVoiceSupported(true)

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isOnline) {
      void syncQueue()
    }
  }, [isOnline, syncQueue])

  const generateId = () => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }
    return Math.random().toString(36).slice(2)
  }

  const enqueueCapture = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) return

      const entry: QueueItem = {
        id: generateId(),
        content: trimmed,
        createdAt: new Date().toISOString()
      }

      setQueue((prev) => {
        const next = [entry, ...prev]
        queueRef.current = next
        return next
      })

      if (typeof navigator === "undefined" || navigator.onLine) {
        await syncQueue()
      }
    },
    [syncQueue]
  )

  const handleCaptureClick = async () => {
    if (skipClickRef.current) {
      skipClickRef.current = false
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
      return
    }

    const trimmed = input.trim()
    if (!trimmed) return

    await enqueueCapture(trimmed)
    setInput("")
  }

  const beginVoiceCapture = () => {
    if (!voiceSupported || isRecording || input.trim()) return

    try {
      liveTranscriptRef.current = ""
      recognitionRef.current?.start()
      setIsRecording(true)
      setVoiceStatus("Listening… release to capture")
      skipClickRef.current = true
    } catch (error) {
      console.warn("Unable to start voice capture", error)
      setVoiceStatus("Voice capture unavailable.")
      skipClickRef.current = false
    }
  }

  const endVoiceCapture = () => {
    if (!isRecording) return
    recognitionRef.current?.stop()
  }

  const handlePointerDown = () => {
    if (!voiceSupported) return
    if (input.trim().length > 0) return
    beginVoiceCapture()
  }

  const handlePointerUp = () => {
    endVoiceCapture()
  }

  const handlePointerLeave = () => {
    if (isRecording) {
      recognitionRef.current?.abort()
      setIsRecording(false)
      liveTranscriptRef.current = ""
      setVoiceStatus("Voice capture cancelled.")
      skipClickRef.current = true
    }
  }

  const layoutStyles =
    variant === "pwa"
      ? "flex min-h-screen flex-col gap-4 bg-white px-4 py-6 sm:px-6"
      : "flex min-h-full flex-col gap-6"

  const buttonClasses =
    variant === "pwa"
      ? "flex h-14 w-full items-center justify-center rounded-full bg-slate-900 text-base font-medium text-white transition-colors hover:bg-slate-800 active:scale-[0.99]"
      : "flex h-12 w-full items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white transition-colors hover:bg-slate-800 active:scale-[0.99] sm:h-14 sm:text-base"

  const textareaClasses =
    variant === "pwa"
      ? "w-full min-h-[200px] resize-none rounded-3xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
      : "w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base shadow-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 sm:text-lg"

  return (
    <div className={layoutStyles}>
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Step 1 · Capture
        </p>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          {variant === "pwa"
            ? "Capture quickly"
            : "Get it out of your head"}
        </h1>
        {variant === "full" && (
          <p className="text-sm text-slate-500">
            Type or hold the button to dictate. We will safely store everything,
            even if you&apos;re offline.
          </p>
        )}
      </header>

      <section className="flex flex-col gap-3">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="What should we remember?"
          rows={variant === "pwa" ? 5 : 6}
          className={textareaClasses}
        />

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span
            className={
              isOnline
                ? "inline-flex items-center gap-2 text-emerald-600"
                : "inline-flex items-center gap-2 text-amber-600"
            }
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {isOnline ? "Online" : "Offline — will sync later"}
          </span>
          {queue.length > 0 && (
            <span>
              {queue.length} idea{queue.length === 1 ? "" : "s"} waiting to sync
            </span>
          )}
        </div>
      </section>

      {voiceSupported ? (
        <p className="text-xs text-slate-400">
          Hold the button to dictate. Release to save the transcript.
        </p>
      ) : (
        <p className="text-xs text-slate-400">
          Voice capture not supported in this browser.
        </p>
      )}

      {voiceStatus && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {voiceStatus}
        </div>
      )}

      <button
        type="button"
        onClick={handleCaptureClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className={buttonClasses}
      >
        {isRecording
          ? "Listening…"
          : input.trim()
            ? "Capture"
            : "Hold to capture voice"}
      </button>
    </div>
  )
}

