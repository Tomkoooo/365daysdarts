import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Target, Trophy } from "lucide-react"

export default function PlayersIntroPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="bg-navy-darker py-20 border-b border-navy-lighter">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Dartsosoknak</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Akár most fogtál először nyilat, akár már versenyekre jársz, nálunk megtalálod a szintednek megfelelő képzést.
          </p>
          <p className="text-gray-400">
            Videós tartalmainkért látogass el a <a href="https://www.facebook.com/magyardartsakademia" target="_blank" rel="noopener noreferrer" className="text-cta hover:underline font-semibold">Magyar Darts Akadémia Facebook oldalára</a>!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12">
            {/* Beginner */}
            <div className="bg-navy p-8 rounded-2xl border border-navy-lighter hover:border-cta transition-all group">
                <Target className="h-12 w-12 text-cta mb-6 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-bold text-white mb-4">Kezdőknek</h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
                    Alapozd meg a tudásod! Ismerd meg a felszerelést, a helyes beállást és a dobómozdulat alapjait. Videós leckék és gyakorlatok várnak.
                </p>
                <Button asChild className="w-full bg-cta/10 text-cta hover:bg-cta hover:text-white border border-cta/20">
                    <Link href="/dartsosoknak/kezdoknek">Kezdő anyagok <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </div>

            {/* Advanced */}
            <div className="bg-navy p-8 rounded-2xl border border-navy-lighter hover:border-purple-500 transition-all group">
                <Trophy className="h-12 w-12 text-purple-500 mb-6 group-hover:scale-110 transition-transform" />
                <h2 className="text-2xl font-bold text-white mb-4">Haladóknak</h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
                    Lépj a következő szintre! Ismerj meg haladó kiszálló stratégiákat, mentális tréning technikákat és versenyfelkészülési módszereket.
                </p>
                <Button asChild className="w-full bg-purple-500/10 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-500/20">
                    <Link href="/dartsosoknak/haladoknak">Haladó tréning <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
            </div>
        </div>
      </div>
    </div>
  )
}
