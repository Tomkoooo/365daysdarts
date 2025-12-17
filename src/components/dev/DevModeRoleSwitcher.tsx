"use client"

import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { setDevRole } from "@/actions/dev-actions"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function DevModeRoleSwitcher() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (process.env.NODE_ENV === 'production') return null // Only show in dev

  const handleRoleSwitch = async (role: string) => {
    setLoading(true)
    try {
        await setDevRole(role)
        // Force full reload to pick up new session in RootLayout
        window.location.href = '/dashboard'
    } catch (e) {
        console.error(e)
    } finally {
        setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="p-4 bg-muted/90 backdrop-blur border-primary space-y-2">
         <p className="text-xs font-mono font-bold">DEV_MODE: Role Switcher</p>
         <div className="flex gap-2">
            {['student', 'lecturer', 'business', 'admin'].map(role => (
                <Button 
                   key={role} 
                   size="sm" 
                   variant={session?.user?.role === role ? "default" : "outline"}
                   onClick={() => handleRoleSwitch(role)}
                   disabled={loading}
                >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </Button>
            ))}
         </div>
         <p className="text-xs text-muted-foreground">Current: {session?.user?.role || 'None'}</p>
      </Card>
    </div>
  )
}
