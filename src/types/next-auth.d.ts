import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"
import { UserRole } from "@/models/User"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      subscriptionStatus: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: UserRole
    subscriptionStatus: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    role: UserRole
    subscriptionStatus: string
  }
}
