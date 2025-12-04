"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Brain } from "lucide-react"

function HusbandLoginForm() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect based on user role after login
  useEffect(() => {
    if (user) {
      if (user.role === "WIFE") {
        router.push("/pwa/capture")
      } else {
        router.push("/")
      }
    }
  }, [user, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const success = await login(name, password)

      if (!success) {
        setError("Invalid name or password")
        setIsSubmitting(false)
      }
      // Don't redirect here - let the useEffect handle it when user is set
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="h-12 w-12" style={{ color: "#051C2C" }} />
          </div>
          <h2 className="text-3xl font-bold" style={{ color: "#051C2C" }}>
            CAPTURE
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <input
              type="text"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              autoComplete="username"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300"
            />
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function HusbandLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Brain className="h-12 w-12" style={{ color: "#051C2C" }} />
            </div>
            <h2 className="text-3xl font-bold" style={{ color: "#051C2C" }}>
              CAPTURE
            </h2>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
            Loading...
          </div>
        </div>
      </div>
    }>
      <HusbandLoginForm />
    </Suspense>
  )
}
