"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { UserNav } from "@/components/user-nav"

export function AuthStatus() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === "loading") {
    return <div className="h-8 w-8"></div>
  }

  if (status === "unauthenticated") {
    return (
      <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
        Sign In
      </Button>
    )
  }

  return <UserNav />
}

