"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Image from "next/image"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, ChevronDown, User, LogOut, LayoutDashboard } from "lucide-react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const NavLink = ({ href, children, mobile = false }: { href: string; children: React.ReactNode; mobile?: boolean }) => {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        onClick={() => mobile && setOpen(false)}
        className={cn(
          "text-sm font-medium transition-colors hover:text-cta",
          isActive ? "text-cta" : "text-white/90",
          mobile ? "text-lg py-2" : ""
        )}
      >
        {children}
      </Link>
    )
  }

  return (
    <nav className="bg-card border-b border-border/50 text-white backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        
        {/* Logo */}
        <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-2 mr-8">
           <Image src="/logo.svg" alt="Logo" width={40} height={40} className="w-10 h-10" />
           <span className="text-2xl hidden sm:inline-block"><span className="text-cta">365days</span>darts</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 flex-1">
           {/* Alapítvány Dropdown */}
           <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-cta outline-none">
                Alapítványról <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-navy-darker border-navy-lighter text-white">
                <DropdownMenuItem asChild className="focus:bg-navy-lighter focus:text-cta cursor-pointer">
                  <Link href="/alapitvanyrol/magunkrol">Magunkról</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-navy-lighter focus:text-cta cursor-pointer">
                  <Link href="/alapitvanyrol/kuratorium">Kuratórium</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-navy-lighter focus:text-cta cursor-pointer">
                  <Link href="/alapitvanyrol/oktatok">Stáb</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>

           {/* Dartsosoknak Dropdown */}
           <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-white/90 hover:text-cta outline-none">
                Dartsosoknak <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-navy-darker border-navy-lighter text-white">
                <DropdownMenuItem asChild className="focus:bg-navy-lighter focus:text-cta cursor-pointer">
                  <Link href="/dartsosoknak">Bevezető</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-navy-lighter focus:text-cta cursor-pointer">
                  <Link href="/dartsosoknak/kezdoknek">Kezdőknek</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-navy-lighter focus:text-cta cursor-pointer">
                  <Link href="/dartsosoknak/haladoknak">Haladóknak</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>

           <NavLink href="/instruktoroknak">Instruktoroknak</NavLink>
           <NavLink href="/diamonds-cup">Diamonds Cup</NavLink>
        </div>

        <div className="flex items-center gap-4">
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-navy-lighter">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback className="bg-navy text-cta">{session.user.name?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-navy-darker border-navy-lighter text-white" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2 border-b border-navy-lighter mb-2">
                  <p className="text-sm font-medium leading-none">{session.user.name}</p>
                  <p className="text-xs leading-none text-gray-400">{session.user.email}</p>
                </div>
                <DropdownMenuItem asChild className="focus:bg-navy-lighter focus:text-cta cursor-pointer">
                  <Link href="/dashboard" className="flex items-center"><LayoutDashboard className="mr-2 h-4 w-4" /> Irányítópult</Link>
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => signOut()} className="focus:bg-navy-lighter focus:text-destructive cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Kijelentkezés
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex gap-2">
                <Button variant="ghost" className="text-white hover:text-cta hover:bg-navy-lighter" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
                    Belépés
                </Button>
                <Button className="bg-cta hover:bg-cta-hover text-white" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
                    Regisztráció
                </Button>
            </div>
          )}

          {/* Mobile Toggle */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-navy-lighter">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-navy-darker border-l-navy-lighter text-white w-[300px] sm:w-[400px] p-0 flex flex-col h-full">
                <div className="flex flex-col gap-6 mt-8 h-full overflow-y-auto flex-1 px-6 pb-12">
                    {/* Mobile Brand */}
                    <div className="flex items-center gap-2 font-bold text-xl mb-4 shrink-0">
                        <span className="text-cta">365days</span>darts
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Alapítvány</h4>
                            <NavLink href="/alapitvanyrol/magunkrol" mobile>Magunkról</NavLink>
                            <NavLink href="/alapitvanyrol/kuratorium" mobile>Kuratórium</NavLink>
                            <NavLink href="/alapitvanyrol/oktatok" mobile>Stáb</NavLink>
                        </div>

                        <div className="flex flex-col gap-2">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Dartsosoknak</h4>
                            <NavLink href="/dartsosoknak" mobile>Bevezető</NavLink>
                            <NavLink href="/dartsosoknak/kezdoknek" mobile>Kezdőknek</NavLink>
                            <NavLink href="/dartsosoknak/haladoknak" mobile>Haladóknak</NavLink>
                        </div>

                        <NavLink href="/instruktoroknak" mobile>Instruktoroknak</NavLink>
                        <NavLink href="/diamonds-cup" mobile>Diamonds Cup</NavLink>
                    </div>

                    {!session?.user && (
                        <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-navy-lighter shrink-0">
                            <Button variant="ghost" className="w-full justify-start text-lg" onClick={() => { setOpen(false); signIn("google", { callbackUrl: "/dashboard" }); }}>
                                Belépés
                            </Button>
                            <Button className="w-full bg-cta hover:bg-cta-hover" onClick={() => { setOpen(false); signIn("google", { callbackUrl: "/dashboard" }); }}>
                                Regisztráció
                            </Button>
                        </div>
                    )}
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
