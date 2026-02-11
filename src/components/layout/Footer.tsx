import Link from "next/link"
import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-navy-darker text-white border-t border-navy-lighter mt-auto">
      {/* Partners Section */}
      <div className="border-b border-navy-lighter bg-navy-darker/50">
        <div className="container mx-auto px-4 py-8">
            <h4 className="text-sm font-semibold text-gray-400 mb-6 text-center uppercase tracking-wider">Partnereink</h4>
                <div className="flex flex-wrap gap-8 items-center justify-center opacity-80 grayscale hover:grayscale-0 transition-all duration-300">
                    <img src="/instrukturok/aktiv-magyarorszag-logo (1).png" alt="Aktív Magyarország" className="h-12 w-auto object-contain" />
                    <img src="/instrukturok/bethlen_gabor_alapkezelo_zrt_logo.png" alt="Bethlen Gábor Alapkezelő" className="h-12 w-auto object-contain" />
                    <img src="/instrukturok/mdsz_logo_vektor.svg" alt="Magyar Darts Szövetség" className="h-16 w-auto object-contain" />
                    <img src="/instrukturok/Remiz_logo.png" alt="Remiz" className="h-10 w-auto object-contain" />
                    {/* Scolia logo missing, using placeholder if needed or just skipping */}
                    <img src="/instrukturok/Sakkmed logo (2).png" alt="Sakkmed" className="h-12 w-auto object-contain" />
                    <img src="/instrukturok/drk-logo.svg" alt="Dorko" className="h-8 w-auto object-contain" />
                    <img src="/instrukturok/tdarts_logo.svg" alt="T-Darts" className="h-10 w-auto object-contain" />
                </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Mission */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="text-cta">365days</span>darts
            </h3>
            <div className="space-y-2 text-sm text-gray-400 leading-relaxed">
                <p>Küldetésünk a darts sport népszerűsítése és oktatása minden korosztály számára.</p>
                <div className="pt-2 space-y-1 text-xs text-gray-500 border-t border-white/5 mt-2">
                    <p className="font-semibold text-gray-400">Magyar Darts Akadémia Alapítvány</p>
                    <p>Székhely: 3126 Bárna, Nagykő utca 2.</p>
                    <p>Rendezvényterem: 1146 Budapest, Istvánmezei út 6. (Récsei Center)</p>
                    <p>Adószám: 19320210-2-12</p>
                    <p>Bank: CIB Bank Zrt.<br/>10701324-73041278-51100005</p>
                </div>
            </div>
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
                <a href="mailto:info@magyardarts.hu" className="hover:text-white transition-colors">info@magyardarts.hu</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cta" />
                <span>+36 30 123 4567</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-cta mt-1" />
                <span>1146 Budapest,<br />Istvánmezei út 6.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-navy-lighter mt-12 pt-8 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Magyar Darts Akadémia Alapítvány. Minden jog fenntartva.
        </div>
      </div>
    </footer>
  )
}
