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
            A 365daysdarts Alapítvány küldetése, víziója és története.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 space-y-20">
        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center rounded-full bg-cta/10 px-3 py-1 text-sm text-cta border border-cta/20">
              Küldetésünk
            </div>
            <h2 className="text-3xl font-bold text-white">A Darts Mindenkié</h2>
            <p className="text-gray-300 leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
          </div>
          <div className="bg-navy p-8 rounded-2xl border border-navy-lighter flex items-center justify-center min-h-[300px]">
            <Target className="h-32 w-32 text-navy-lighter" />
          </div>
        </div>

        {/* Vision */}
        <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
          <div className="bg-navy p-8 rounded-2xl border border-navy-lighter flex items-center justify-center min-h-[300px] md:order-1">
            <Heart className="h-32 w-32 text-navy-lighter" />
          </div>
          <div className="space-y-6 md:order-2">
            <div className="inline-flex items-center rounded-full bg-purple-500/10 px-3 py-1 text-sm text-purple-400 border border-purple-500/20">
              Vízió
            </div>
            <h2 className="text-3xl font-bold text-white">Egy Támogató Közösség</h2>
            <p className="text-gray-300 leading-relaxed">
              Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </div>
        </div>

        {/* History timeline teaser */}
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <History className="h-12 w-12 text-cta mx-auto" />
          <h2 className="text-3xl font-bold text-white">Történetünk</h2>
          <p className="text-gray-300">
            2020-ban indultunk egy kis baráti társaságból, mára pedig az ország egyik legnagyobb darts oktatási központjává nőttük ki magunkat.
          </p>
        </div>
      </div>
    </div>
  )
}
