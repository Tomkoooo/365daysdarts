"use client"

import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionExpired = searchParams.get("session") === "expired"

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Üdvözlünk!</CardTitle>
          <CardDescription>Jelentkezz be a kurzusaid eléréséhez</CardDescription>
          {sessionExpired && (
            <p className="text-sm text-amber-600 dark:text-amber-400 pt-2">
              A munkamenet lejárt. Kérjük, jelentkezz be újra.
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button size="lg" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            Bejelentkezés Google-fiókkal
          </Button>
          <div className="text-center text-sm text-muted-foreground mt-2">
            <Link href="/" className="hover:underline">Vissza a főoldalra</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
