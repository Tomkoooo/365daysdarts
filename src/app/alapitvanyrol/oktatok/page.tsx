import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"

export default function StaffPage() {
  const staff = [
    {
      name: "Balázs-Treszner Tímea",
      role: "Instruktor képzés",
      bio: "Pedagógiai diplomával rendelkező egészségügyi és fitness szakember. Szakmai alapjaimat a Pécsi Tudományegyetemen, a Semmelweis Egyetemen és a Kodolányi János Főiskolán szereztem. Jelenleg meditációs coachként a légzésterápia eszközeivel nyújtok segítséget a stressz kezelésben.",
      image: "/instrukturok/BalazsTresznerTimeaoktato.jpg"
    },
    {
      name: "Bodó Balázs",
      role: "Instruktor képzés",
      bio: "Az alapképzést a Budapesti Gazdasági Egyetem Nemzetközi Kapcsolatok szakán, a mesterképzést a Testnevelési Egyetem Sportmenedzser szakán végezte. Jelenleg is utóbbi intézmény Rekreáció mesterképzés szak hallgatója. Az elmúlt 3 évben a sportirányításban dolgozott, jelenleg a Magyar Darts Szövetség főtitkára",
      image: "/instrukturok/BB.jpg" // No image provided
    },
    {
      name: "Balázs Gábor",
      role: "MDSZ Elnök, Alapító",
      bio: "Közgazdász, sportmenedzser, a Magyar Darts Szövetség elnöke. A Magyar Darts Akadémia Alapítvány társalapítója. Célom a tudás alapú sportágfejlesztés és egy magas szintű szakmai központ működtetése.",
      image: "/instrukturok/602977677_33335356592745099_2402076347139985134_n.jpg"
    },
    {
      name: "Rucska József",
      role: "Instruktor képzés és edző",
      bio: "2022 óta főállású darts versenyzőként és edzőként tevékenykedem. 28-szoros válogatott, magyar bajnok, Magyar Kupa győztes. Ihász Veronika felkészítésében 15 éve veszek részt edzőként.",
      image: "/instrukturok/Rucska Jozsef.jpg"
    },
    {
      name: "Kovács István",
      role: "Instruktor képzés és edző",
      bio: "Testnevelő tanár, középfokú atlétika edző. A Szolnoki Baglyok Darts Klub alapítója. 2017 óta foglalkozom utánpótlás korú versenyzőkkel, többek között Kovács Tamara Európa-bajnok felkészítője.",
      image: "/instrukturok/isu.jpg" 
    },
    {
      name: "Veress Gréta",
      role: "Versenyszervező, digitális tartalomkészítő",
      bio: "Több mint 10 éve része az életemnek a darts. Dolgoztam a Magyar Darts Szövetségnél versenyszervezésben. Jelenleg a csapatot social média oldalon erősítem.",
      image: "/instrukturok/greta.jpeg"
    },
    {
      name: "Szilágyi Szonja",
      role: "Digitális tartalomkészítő",
      bio: "ELTE PPK sportszervező szakos, jelenleg utolsó féléves hallgatója. A sport iránti elköteleződésem a digitális világban is megmutatkozik: ezen a platformon elsősorban a tananyagok fejlesztéséért és a tartalmi struktúra kialakításáért feleltem. Célom, hogy a sportszakmai tudásomat a digitális tartalomgyártással ötvözve segítsem a darts közösség fejlődését.",
      image: null // No image provided
    },
    {
      name: "Neumajer Kitti",
      role: "Instruktor képzés, digitális tartalomkészítő",
      bio: "Háromszoros ifjúsági Európa-bajnok és világbajnoki bronzérmes. Jelenleg a Magyar Darts Szövetség operatív igazgatója. Célom, hogy a megszerzett tapasztalataimat az oktatásban és mentorálásban is továbbadjam.",
      image: "/instrukturok/Kitti Neumajer - Girls manager.jpg"
    }
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-navy-darker py-16 border-b border-navy-lighter">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Stáb</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Ismerd meg a 365daysdarts csapatát, akik a képzésekért, versenyekért és a tartalomért felelnek.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {staff.map((member, i) => (
            <Card key={i} className="bg-navy border-navy-lighter overflow-hidden hover:border-cta/50 transition-colors flex flex-col">
              <div className="h-64 bg-navy-lighter w-full relative shrink-0">
                 {member.image ? (
                   <Image 
                     src={member.image} 
                     alt={member.name}
                     fill
                     className="object-contain object-center"
                   />
                 ) : (
                   <div className="absolute inset-0 flex items-center justify-center text-gray-500 bg-navy-lighter">
                      Nincs fotó
                   </div>
                 )}
              </div>
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                    <p className="text-cta text-sm font-medium">{member.role}</p>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                    {member.bio}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
