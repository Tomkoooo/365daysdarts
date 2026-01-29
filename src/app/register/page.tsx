"use client"

import { signIn, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"

export default function RegisterPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Regisztráció</CardTitle>
          <CardDescription>Hozz létre fiókot a Google segítségével</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button size="lg" className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            Regisztráció Google-fiókkal
          </Button>
          <div className="text-center text-sm text-muted-foreground mt-2">
            <p>Már van fiókod? <Link href="/login" className="text-cta hover:underline">Jelentkezz be</Link></p>
            <Link href="/" className="hover:underline mt-4 block">Vissza a főoldalra</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
