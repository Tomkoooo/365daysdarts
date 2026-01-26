import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function BoardPage() {
  const members = [
    { name: "Kovács János", role: "Elnök", bio: "20 éve a darts sportért dolgozik, korábbi válogatott játékos." },
    { name: "Nagy Éva", role: "Alelnök", bio: "Szervezetfejlesztési szakember, a női szakág vezetője." },
    { name: "Szabó Péter", role: "Kuratóriumi Tag", bio: "Pénzügyi szakember, az alapítvány gazdasági vezetője." },
    { name: "Kiss Anna", role: "Kuratóriumi Tag", bio: "Ifjúsági nevelésért felelős szakmai igazgató." },
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((member, i) => (
            <Card key={i} className="bg-navy border-navy-lighter text-center">
              <CardHeader>
                <Avatar className="w-24 h-24 mx-auto mb-4 border-2 border-cta">
                  <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
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
