import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function InstructorsListPage() {
  const instructors = Array(6).fill(null).map((_, i) => ({
    name: `Instruktor ${i + 1}`,
    level: i % 2 === 0 ? "Master Trainer" : "Certified Coach",
    specialty: i % 3 === 0 ? "Mental Game" : i % 3 === 1 ? "Technika" : "Stratégia",
    bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore."
  }))

  return (
    <div className="min-h-screen bg-background pb-20">
      <section className="bg-navy-darker py-16 border-b border-navy-lighter">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Oktatók Bemutatása</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Hivatalos 365daysdarts instruktoraink, akik segítenek a fejlődésben.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {instructors.map((inst, i) => (
            <Card key={i} className="bg-navy border-navy-lighter overflow-hidden hover:border-cta/50 transition-colors">
              <div className="h-48 bg-navy-lighter w-full relative">
                 {/* Placeholder for photo */}
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                    Fotó Helye
                 </div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">{inst.name}</h3>
                        <p className="text-cta text-sm">{inst.level}</p>
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-400">{inst.specialty}</Badge>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                    {inst.bio}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
