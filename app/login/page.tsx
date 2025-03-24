import { UserAuthForm } from "@/components/user-auth-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - AI Text Processor",
  description: "Login to access the AI Text Processor & English Learning platform",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col space-y-2 text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Login to Your Account</h1>
          <p className="text-sm text-muted-foreground">Sign in with your Google account to continue</p>
        </div>
        <UserAuthForm />
      </div>
    </div>
  )
}

