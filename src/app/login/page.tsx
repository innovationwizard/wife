"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"

function LoginForm() {
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
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Wife App
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
              className="appearance-none rounded relative block w-full px-4 py-3 border border-gray-300 text-base min-h-[48px]"
            />
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="appearance-none rounded relative block w-full px-4 py-3 border border-gray-300 text-base min-h-[48px]"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] text-base font-medium"
          >
            {isSubmitting ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Wife App
            </h2>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
            Loading...
          </div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}