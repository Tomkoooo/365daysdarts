import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { cookies } from "next/headers"
import User, { UserRole } from "@/models/User"
import connectDB from "./db"

export async function getAuthSession() {
  const cookieStore = await cookies()

  // getServerSession may log JWT_SESSION_ERROR for stale cookies; middleware clears those.
  let session = await getServerSession(authOptions)

  if (!session && process.env.DEV_MODE === "true") {
    const devRole = (cookieStore.get("dev_role")?.value || "admin") as UserRole
    
    await connectDB()
    
    let devUser = await User.findOne({ email: `${devRole}@example.com` })
    
    if (!devUser) {
        devUser = await User.create({
            name: `Dev ${devRole.charAt(0).toUpperCase() + devRole.slice(1)}`,
            email: `${devRole}@example.com`,
            role: devRole,
            subscriptionStatus: "active"
        })
    }

    session = {
      user: {
        name: devUser.name,
        email: devUser.email,
        image: devUser.image || "",
        id: devUser._id.toString(),
        role: devUser.role as UserRole,
        subscriptionStatus: devUser.subscriptionStatus || "active"
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  return session
}
