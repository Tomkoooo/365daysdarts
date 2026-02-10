import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function BoardPage() {
  const members = [
    { 
      name: "Lukács Kovács Henriette", 
      role: "Elnök", 
      bio: "A Pannon Egyetemen folytatott tanulmányaim után Exeterben DMBA szakon másod-diplomáztam, ahol elsősorban szervezet menedzsmenttel, marketinggel és stratégia fejlesztéssel foglalkoztam. Az alapítvány elnökeként célom, hogy a dartson keresztül - amely fegyelemre, kitartásra és célkitűzésre tanít - minél több fiatal találjon lehetőséget a sportolásra.",
      image: "/instrukturok/Kovacs Heni.JPG"
    },
    { 
      name: "Marti György", 
      role: "Kuratóriumi Tag", 
      bio: "Építőipari diplomáim mellett kezdtem el sportszervezéssel, és vezetéssel foglalkozni. 40 éve vezetek szakosztályt, 15 éve klubelnök vagyok. Dolgoztam két országos szakszövetségben, a Magyar Sakkszövetségben 15 évig voltam Szervezési igazgató, a Magyar Darts Szövetségben voltam Operatív igazgató, és Főtitkár is.",
      image: "/instrukturok/Marti Gyorgy.jpg" 
    },
    { 
      name: "Tekauer Norbert", 
      role: "Kuratóriumi Tag", 
      bio: "Sportmenedzseri végzettséggel rendelkező sportvezető és sportszakember. Közel három évtizedes tapasztalattal rendelkezem a sport világában. Jelenleg a Magyar Darts Szövetség alelnöke vagyok, ahol célom a sportág strukturált fejlesztése, az utánpótlás-nevelés erősítése.",
      image: null // Image not provided in recent update
    },
  ]

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-navy-darker py-16 border-b border-navy-lighter">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Kuratórium</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Ismerd meg az alapítvány vezetőit, akik a stratégiai irányokért felelnek.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className=" justify-around">
          {members.map((member, i) => (
            <Card key={i} className="bg-navy border-navy-lighter text-center">
              <CardHeader>
                <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-cta">
                  <AvatarImage src={member.image || "/instrukturok/placeholder.png"} />
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                </Avatar>
                <CardTitle className="text-white">{member.name}</CardTitle>
                <CardDescription className="text-cta">{member.role}</CardDescription>
              </CardHeader>
              <CardContent className="text-gray-400 text-sm">
                {member.bio}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
