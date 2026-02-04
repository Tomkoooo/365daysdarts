import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Target, GraduationCap, Users, Trophy } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-navy-darker">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              A Darts Sport <span className="text-cta">Jövője</span> Itt Kezdődik
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
              A Magyar Darts Akadémia Alapítvány célja, hogy mindenki számára elérhetővé tegye a profi darts oktatást. Csatlakozz közösségünkhöz, fejlődj instruktorainkkal, vagy válj te is oktatóvá!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4 flex-wrap">
              <Button size="lg" className="bg-cta hover:bg-cta-hover text-white text-lg h-12 px-8" asChild>
                <Link href="/dartsosoknak/kezdoknek">Kezdés Ingyenesen</Link>
              </Button>
              <Button size="lg" className="bg-white text-navy hover:bg-gray-100 text-lg h-12 px-8 font-bold" asChild>
                <Link href="/instruktoroknak">Instruktor Képzés</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-navy-lighter text-white hover:bg-navy-lighter text-lg h-12 px-8" asChild>
                <Link href="/alapitvanyrol/magunkrol">Ismerj meg minket</Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-navy-lighter/20 to-transparent pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cta/10 rounded-full blur-3xl" />
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold">Miért válassz minket?</h2>
            <p className="text-muted-foreground">
              Szakmai alapokon nyugvó képzési rendszer, amely a kezdőktől a versenyzői szintig kísér végig.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-navy border-navy-lighter hover:border-cta/50 transition-colors">
              <CardHeader>
                <Target className="h-10 w-10 text-cta mb-2" />
                <CardTitle className="text-white">Strukturált Tananyag</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                Lépésről lépésre felépített videós és szöveges leckék, amelyekkel biztos alapokat szerezhetsz.
              </CardContent>
            </Card>
            <Card className="bg-navy border-navy-lighter hover:border-cta/50 transition-colors">
              <CardHeader>
                <GraduationCap className="h-10 w-10 text-cta mb-2" />
                <CardTitle className="text-white">Instruktor Képzés</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                Szeretnéd átadni a tudást? Hivatalos instruktor képzésünkkel elismert oktatóvá válhatsz.
              </CardContent>
            </Card>
            <Card className="bg-navy border-navy-lighter hover:border-cta/50 transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-cta mb-2" />
                <CardTitle className="text-white">Közösség & Versenyek</CardTitle>
              </CardHeader>
              <CardContent className="text-gray-400">
                Légy része egy támogató közösségnek, és mérettesd meg magad a Diamonds Cup versenysorozaton.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Segments Teaser */}
      <section className="py-20 bg-navy-darker">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            
            {/* Players */}
            <div className="space-y-6">
              <div className="inline-flex items-center rounded-full border border-cta/30 bg-cta/10 px-3 py-1 text-sm text-cta">
                Játékosoknak
              </div>
              <h2 className="text-3xl font-bold text-white">Fejlődj a saját tempódban</h2>
              <p className="text-gray-400 text-lg">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2"><Target className="h-5 w-5 text-cta" /> Kezdő dobástechnika alapok</li>
                <li className="flex items-center gap-2"><Target className="h-5 w-5 text-cta" /> Haladó kiszálló stratégiák</li>
                <li className="flex items-center gap-2"><Target className="h-5 w-5 text-cta" /> Mentális felkészülés</li>
              </ul>
              <Button asChild className="bg-transparent border border-gray-600 hover:border-cta hover:text-cta text-white">
                <Link href="/dartsosoknak">Részletek játékosoknak <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

            {/* Instructors */}
            <div className="space-y-6 md:pl-12 border-l border-navy-lighter">
              <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm text-purple-400">
                Instruktoroknak
              </div>
              <h2 className="text-3xl font-bold text-white">Építs karriert oktatóként</h2>
              <p className="text-gray-400 text-lg">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-purple-400" /> Hivatalos minősítés</li>
                <li className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-purple-400" /> Hozzáférés a tananyaghoz</li>
                <li className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-purple-400" /> Szakmai támogatás</li>
              </ul>
              <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
                <Link href="/instruktoroknak">Instruktor program <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-navy to-navy-lighter rounded-2xl p-12 relative overflow-hidden border border-navy-lighter shadow-2xl">
            <div className="relative z-10 space-y-6">
              <Trophy className="h-16 w-16 text-cta mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">Diamonds Cup</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Hamarosan indul Magyarország legújabb darts versenysorozata! Ne maradj le a részletekről.
              </p>
              <Button size="lg" className="bg-white text-navy hover:bg-gray-100 font-bold" asChild>
                <Link href="/diamonds-cup">Részletek hamarosan</Link>
              </Button>
            </div>
            {/* Decor */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2670&auto=format&fit=crop')] opacity-5 bg-cover bg-center mix-blend-overlay" />
          </div>
        </div>
      </section>

    </div>
  )
}
