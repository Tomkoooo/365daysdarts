import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy, Clock } from "lucide-react"

export default function DiamondsCupPage() {
  return (
    <div className="min-h-screen bg-navy-darker flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
      
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-navy-lighter/30 via-navy-darker to-navy-darker" />
      
      <div className="relative z-10 max-w-2xl space-y-8">
        <div className="inline-flex p-4 rounded-full bg-navy border border-navy-lighter shadow-2xl mb-8 animate-pulse">
            <Trophy className="h-16 w-16 text-cta" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight">
          DIAMONDS CUP
        </h1>
        
        <div className="space-y-4">
            <p className="text-2xl text-cta font-medium uppercase tracking-widest">Hamarosan Érkezik</p>
            <p className="text-gray-400 text-lg leading-relaxed max-w-lg mx-auto">
                Magyarország legújabb pénzdíjas darts versenysorozata. Készülj fel, mert a 365daysdarts Alapítvány valami különlegessel készül!
            </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button size="lg" disabled className="bg-gray-700 text-gray-400 cursor-not-allowed border-none">
                <Clock className="mr-2 h-4 w-4" /> Nevezés Hamarosan
            </Button>
            <Button variant="outline" size="lg" className="border-cta text-cta hover:bg-cta hover:text-white" asChild>
                <Link href="/">Vissza a főoldalra</Link>
            </Button>
        </div>
      </div>
    </div>
  )
}
