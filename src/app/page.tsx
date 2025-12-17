import { Navbar } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-20 lg:py-32 text-center px-4 bg-gradient-to-b from-background to-muted/50">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl">
          Érd el a <span className="text-primary">profik szintjét</span> a darts táblánál
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mb-10">
          A végső platform darts játékosok számára. Interaktív leckék, gyakorló feladatok és haladáskövetés, hogy a legjobb legyél.
        </p>
        <div className="flex gap-4 flex-col sm:flex-row">
          <Button size="lg" className="h-12 px-8 text-lg" asChild>
            <Link href="/dashboard">Kezdj el tanulni</Link>
          </Button>
          <Button size="lg" variant="outline" className="h-12 px-8 text-lg" asChild>
             <Link href="#features">Tudj meg többet</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Miért válassz minket?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <Card>
             <CardHeader>
               <CardTitle>Interaktív Leckék</CardTitle>
             </CardHeader>
             <CardContent>
               Multimédiás előadások, szakértőktől, hogy könnyen elsajátítsd a technikákat és stratégiákat.
             </CardContent>
           </Card>
           <Card>
             <CardHeader>
               <CardTitle>Okos Gyakorlás</CardTitle>
             </CardHeader>
             <CardContent>
               Adaptív feladatok, amelyek a gyenge pontjaidra fókuszálnak, hogy vizsgakész legyél.
             </CardContent>
           </Card>
           <Card>
             <CardHeader>
               <CardTitle>Verseny Szimuláció</CardTitle>
             </CardHeader>
             <CardContent>
               Valósághű végső vizsgák és meccs szituációk, amelyek felkészítenek az éles játékra.
             </CardContent>
           </Card>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-10 border-t text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} 365daysdarts Platform. Minden jog fenntartva.</p>
      </footer>
    </main>
  )
}
