import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lock, TrendingUp } from "lucide-react"

export default function AdvancedPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-navy-darker py-16 border-b border-navy-lighter relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <Badge className="bg-purple-600 text-white hover:bg-purple-700 mb-4">Haladó Szint</Badge>
          <h1 className="text-4xl font-bold text-white mb-4">Mesterkurzus</h1>
          <p className="text-xl text-gray-300">
            Finomhangolás, mentális felkészülés és verseny-szintű stratégiák.
          </p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 bg-purple-900/20 blur-3xl" />
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-navy rounded-xl border border-navy-lighter p-8 text-center mb-12">
            <TrendingUp className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Emeld a szintet!</h2>
            <p className="text-gray-400 mb-6">A haladó anyagok megtekintéséhez bejelentkezés szükséges.</p>
            <div className="flex justify-center gap-4">
                <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700 text-white border-none">
                    <Link href="/courses">Bejelentkezés / Regisztráció</Link>
                </Button>
            </div>
        </div>

        <div className="space-y-4 opacity-75">
            {["Kiszálló kombinációk (61-100)", "Bull-ra játszás stratégiája", "Mentális tréning: Nyomás kezelése", "Versenyfelkészülési rutin", "Videóelemzés haladóknak"].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-navy/50 border border-navy-lighter/50">
                    <div className="bg-navy-darker p-2 rounded-full">
                        <Lock className="h-5 w-5 text-gray-600" />
                    </div>
                    <span className="text-gray-400 font-medium">{item}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  )
}
