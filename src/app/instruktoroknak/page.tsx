import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle, ArrowRight, BookOpen, GraduationCap, Award, Calendar } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function InstructorsPage() {
  return (
    <div className="min-h-screen bg-background">
      
      {/* Hero */}
      <section className="bg-navy-darker py-20 border-b border-navy-lighter">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Instruktor Képzési Program
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Válj hivatalos 365daysdarts instruktorrá! Átfogó képzési rendszerünk, online vizsgák és gyakorlati tréningek biztosítják, hogy magas szintű tudást adhass át tanítványaidnak.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-cta hover:bg-cta-hover text-white w-full sm:w-auto">
                Regisztráció a képzésre
              </Button>
              <Button size="lg" variant="outline" className="text-white border-navy-lighter hover:bg-navy-lighter w-full sm:w-auto">
                Már van fiókom: Belépés
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Program Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">A Minősítés Lépései</h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: BookOpen,
                title: "1. Tananyag Elsajátítás",
                desc: "Hozzáférés a teljes instruktori tudásbázishoz és videós anyagokhoz a regisztráció után."
              },
              {
                icon: CheckCircle,
                title: "2. Online Vizsga",
                desc: "400-500 kérdéses elméleti vizsga (szabályok, technika, oktatásmódszertan) teljesítése."
              },
              {
                icon: Users,
                title: "3. Gyakorlati Tréning",
                desc: "Részvétel a gyakorlati oktatásokon tapasztalt trénerek vezetésével."
              },
              {
                icon: Award,
                title: "4. Minősítés",
                desc: "Sikeres vizsgák után megkapod a hivatalos instruktori oklevelet és bekerülsz a regiszterbe."
              }
            ].map((step, i) => (
              <Card key={i} className="bg-navy border-navy-lighter relative mt-6 md:mt-0">
                <div className="absolute -top-4 left-4 w-8 h-8 bg-cta rounded-full flex items-center justify-center font-bold text-navy shadow-lg">
                  {i + 1}
                </div>
                <CardHeader>
                  <step.icon className="h-10 w-10 text-cta mb-2" />
                  <CardTitle className="text-white">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-400 text-sm">
                  {step.desc}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Exam Info & Dashboard Teaser */}
      <section className="py-20 bg-navy-darker">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6">Online Vizsgaközpont & Dashboard</h2>
            <p className="text-gray-300 mb-6">
              A 365daysdarts platformon minden egy helyen elérhető. Regisztráció után azonnali hozzáférést kapsz a tanulói felülethez.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                <div>
                  <h4 className="text-white font-semibold">Átfogó Kérdésbank</h4>
                  <p className="text-sm text-gray-400">Több száz kérdéses adatbázis, amely lefedi a szabályismeretet és az edzéselméletet.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                <div>
                  <h4 className="text-white font-semibold">Azonnali Kiértékelés</h4>
                  <p className="text-sm text-gray-400">A vizsgák eredményét azonnal megkapod, részletes elemzéssel.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 shrink-0" />
                <div>
                  <h4 className="text-white font-semibold">Instruktor Regiszter</h4>
                  <p className="text-sm text-gray-400">A sikeres vizsgázók automatikusan bekerülnek a hivatalos oktatói adatbázisba.</p>
                </div>
              </li>
            </ul>
            <Button asChild variant="outline" className="border-cta text-cta hover:bg-cta hover:text-white">
              <Link href="/dashboard">Tovább az irányítópultra (Demo)</Link>
            </Button>
          </div>
          
          {/* Visual Placeholder for Dashboard */}
          <div className="bg-navy p-4 rounded-xl border border-navy-lighter shadow-2xl relative">
             <div className="bg-background rounded-lg p-6 space-y-4 opacity-90">
                <div className="flex justify-between items-center border-b border-border pb-4">
                   <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
                   <div className="h-8 w-8 bg-gray-700 rounded-full animate-pulse" />
                </div>
                <div className="space-y-3">
                   <div className="h-20 bg-gray-800 rounded animate-pulse" />
                   <div className="h-20 bg-gray-800 rounded animate-pulse" />
                   <div className="h-20 bg-gray-800 rounded animate-pulse" />
                </div>
             </div>
             <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-sm">
                <span className="text-white font-bold text-xl">Dashboard Felület</span>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ / Curriculum Accordion */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-8">Tananyag Témakörök</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-navy-lighter">
              <AccordionTrigger className="text-lg">Alapok és Szabályismeret</AccordionTrigger>
              <AccordionContent className="text-gray-400">
                A darts története, eszközismeret, játékszabályok (501, Cricket, stb.), versenyelmélet alapjai.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-navy-lighter">
              <AccordionTrigger className="text-lg">Dobástechnika és Biomechanika</AccordionTrigger>
              <AccordionContent className="text-gray-400">
                A helyes beállás, fogás, dobás fázisai, hibaelemzés, videóelemzési alapok.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-navy-lighter">
              <AccordionTrigger className="text-lg">Edzéstervezés és Pszichológia</AccordionTrigger>
              <AccordionContent className="text-gray-400">
                Edzéstervek összeállítása kezdőknek és haladóknak, mentális felkészülés, versenyzők menedzselése.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Sample Material Teaser */}
      <section className="py-16 bg-navy-darker text-center">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold mb-4">Betekintés a tananyagba</h3>
          <p className="text-gray-400 mb-8">Töltsd le mintaanyagunkat PDF formátumban, hogy lásd, mire számíthatsz.</p>
          <Button variant="ghost" className="text-cta hover:bg-navy-lighter gap-2 border border-dashed border-cta">
            <BookOpen className="h-4 w-4" /> Minta Tananyag Letöltése (PDF)
          </Button>
        </div>
      </section>

    </div>
  )
}

function Users({ className }: { className?: string }) {
    return <UsersIcon className={className} />
}
import { Users as UsersIcon } from "lucide-react"
