import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, FileText } from "lucide-react"

export default function BeginnersPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-navy-darker py-16 border-b border-navy-lighter">
        <div className="container mx-auto px-4 max-w-4xl">
          <Badge className="bg-cta text-navy hover:bg-cta mb-4">Ingyenes Kurzus</Badge>
          <h1 className="text-4xl font-bold text-white mb-4">Alapozó Tréning</h1>
          <p className="text-xl text-gray-300">
            Minden, amit tudnod kell az első nyíl eldobása előtt. Regisztrálj és férj hozzá azonnal!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-navy rounded-xl border border-navy-lighter p-8 text-center mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Csatlakozz és kezd el a tanulást!</h2>
            <p className="text-gray-400 mb-6">A teljes videótár és a gyakorló feladatok eléréséhez ingyenes regisztráció szükséges.</p>
            <div className="flex justify-center gap-4">
                <Button asChild size="lg" className="bg-cta hover:bg-cta-hover text-white">
                    <Link href="/courses">Kurzus Elkezdése</Link>
                </Button>
            </div>
        </div>

        <div className="space-y-4">
            {["A tábla és a pálya méretei", "A nyilak típusai és kiválasztása", "Alapállás és egyensúly", "A fogás technikája", "A dobás fázisai"].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-navy/50 border border-navy-lighter/50">
                    <div className="bg-navy-darker p-2 rounded-full">
                        <PlayCircle className="h-5 w-5 text-gray-500" />
                    </div>
                    <span className="text-gray-300 font-medium">{item}</span>
                    <div className="ml-auto">
                        <Badge variant="outline" className="text-xs text-gray-500 border-gray-700">Locked</Badge>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  )
}
