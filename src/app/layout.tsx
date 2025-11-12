import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/providers"

const title = "OS – Organization Strategy"
const description = "AI-powered capture, routing, and kanban intelligence."
const imageUrl = "/og-brain.svg"
const iconUrl = "/brain.svg"

export const metadata: Metadata = {
  title,
  description,
  icons: {
    icon: iconUrl,
    shortcut: iconUrl,
    apple: iconUrl
  },
  openGraph: {
    title,
    description,
    siteName: "OS",
    images: [
      {
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: "OS – Organization Strategy"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [imageUrl]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
