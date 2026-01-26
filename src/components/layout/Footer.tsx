import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-navy-darker text-white border-t border-navy-lighter mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="text-cta">365days</span>darts
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Küldetésünk a darts sport népszerűsítése és oktatása minden korosztály számára. Profi képzés, közösségépítés és utánpótlás-nevelés egy helyen.
            </p>
            <div className="flex gap-4 pt-2">
              <Button size="icon" variant="ghost" className="hover:text-cta h-8 w-8 text-gray-400">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:text-cta h-8 w-8 text-gray-400">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="ghost" className="hover:text-cta h-8 w-8 text-gray-400">
                <Youtube className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-white">Gyorslinkek</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/alapitvanyrol/magunkrol" className="hover:text-cta transition-colors">Rólunk</Link></li>
              <li><Link href="/dartsosoknak" className="hover:text-cta transition-colors">Dartsosoknak</Link></li>
              <li><Link href="/instruktoroknak" className="hover:text-cta transition-colors">Instruktor Program</Link></li>
              <li><Link href="/courses" className="hover:text-cta transition-colors">Kurzusok</Link></li>
              <li><Link href="/diamonds-cup" className="hover:text-cta transition-colors">Diamonds Cup</Link></li>
            </ul>
          </div>

          {/* Programs */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-white">Programjaink</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/dartsosoknak/kezdoknek" className="hover:text-cta transition-colors">Kezdő Képzés</Link></li>
              <li><Link href="/dartsosoknak/haladoknak" className="hover:text-cta transition-colors">Haladó Tréning</Link></li>
              <li><Link href="/instruktoroknak" className="hover:text-cta transition-colors">Oktatói Minősítés</Link></li>
              <li><Link href="/exams" className="hover:text-cta transition-colors">Vizsgaközpont</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg text-white">Kapcsolat</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cta" />
                <span>info@365daysdarts.hu</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cta" />
                <span>+36 30 123 4567</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-cta mt-1" />
                <span>1234 Budapest,<br />Darts utca 180.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-lighter mt-12 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} 365daysdarts Alapítvány. Minden jog fenntartva.
        </div>
      </div>
    </footer>
  )
}
