import { Card, CardContent } from "@/components/ui/card"
import { Target, Heart, History } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero */}
      <section className="bg-navy-darker py-16 border-b border-navy-lighter">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Rólunk</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            A Magyar Darts Akadémia Alapítvány története és küldetése.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-20">
        
        {/* MDAA BEMUTATKOZÓ */}
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Bemutatkozás</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed text-lg">
              <p>
                A Magyar Darts Akadémia Alapítványt alapítóink - <strong>Balázs Gábor</strong> és <strong>Tekauer Norbert</strong> - 2021-ben azzal a céllal hozták létre, 
                hogy a darts sportot Magyarországon minél szélesebb körben megismertesse és népszerűsítse, valamint hogy a sportág iránt 
                érdeklődő és elhivatott játékosok számára folyamatos játék- és versenyzési lehetőségeket biztosítson.
              </p>
              <p>
                Az alapítvány szakmai munkáját szoros együttműködésben végzi a <strong>Magyar Darts Szövetséggel</strong>, mint sportszakmai irányító 
                szervezettel, valamint a hazai darts egyesületekkel. Ennek az együttműködésnek köszönhetően tevékenységünk stabil szakmai 
                alapokon nyugszik, és hosszú távon is fenntartható fejlődést biztosít a sportág számára.
              </p>
              <p>
                Éves szinten kiemelt figyelmet fordítunk arra, hogy minél több eseményt és versenyt szervezzünk amatőr, fiatal, valamint sérült 
                játékosok számára is, lehetőséget adva számukra a fejlődésre és akár a versenyzői szintre való továbblépésre.
              </p>
            </div>
          </div>
          
          <div className="bg-navy p-8 rounded-2xl border border-navy-lighter text-gray-300 space-y-4">
             <p>
                Elsődleges célcsoportunk a fiatal utánpótlás korosztály, valamint az aktív versenyzéstől már visszavonult, de a sportág iránt továbbra is 
                elkötelezett játékosok. Ugyanakkor amatőr versenyeink széles korosztályt szólítanak meg, amely jelentős közösségépítő erőt képvisel.
             </p>
             <p>
                A Magyar Darts Szövetséggel együttműködve, állandó klubhelyszínünkön a <strong>Remiz Event</strong> rendezvénytermében éves 
                szinten közel 60 darts versenyt és eseményt valósítunk meg. Emellett az elmúlt években sikeresen elindítottuk amatőr 
                versenysorozatunkat, a <strong>Diamonds Cup</strong>-ot, amelyre minden darts iránt érdeklődőt szeretettel vár a Magyar Darts Akadémia Alapítvány.
             </p>
          </div>
        </div>

        {/* ALAPÍTÓI KÜLDETÉS NYILATKOZAT */}
        <div className="bg-navy-darker rounded-3xl p-8 md:p-12 border border-navy-lighter relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cta/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                <div className="inline-block px-4 py-1 rounded-full bg-cta/10 text-cta border border-cta/20 text-sm font-semibold tracking-wider uppercase">
                    Alapítói Küldetés Nyilatkozat
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                    Balázs Gábor & Tekauer Norbert
                </h2>

                <div className="text-xl text-gray-300 leading-relaxed italic">
                    "A Magyar Darts Akadémia Alapítvány küldetése, hogy a darts sportot nyitott, befogadó és közösségformáló tevékenységként képviselje Magyarországon."
                </div>

                <div className="grid md:grid-cols-2 gap-8 text-left text-gray-400 mt-8">
                    <p>
                        Célunk, hogy minden korosztály és képesség számára elérhetővé tegyük a darts nyújtotta sportolási és közösségi élményt, különös 
                        hangsúlyt fektetve az utánpótlás-nevelésre, az amatőr sport támogatására, valamint a hátrányos helyzetű és sérült játékosok bevonására.
                    </p>
                    <p>
                        Hiszünk abban, hogy a darts nem csupán versenysport, hanem egy olyan közösségépítő eszköz, amely fejleszti a koncentrációt, az 
                        önfegyelmet és a sportszerűséget, miközben baráti és támogató közeget teremt a résztvevők számára.
                    </p>
                </div>
                
                <div className="pt-8 border-t border-navy-lighter">
                    <p className="text-gray-400">
                        Küldetésünk megvalósítása érdekében hosszú távú, szakmailag megalapozott együttműködésre törekszünk a <strong>Magyar Darts Szövetséggel</strong>, 
                        az egyesületekkel és minden olyan partnerrel, aki osztja értékeinket, és tenni kíván a magyar darts jövőjéért.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}
