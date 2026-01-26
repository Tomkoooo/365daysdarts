import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import connectDB from "@/lib/db"
import User from "@/models/User"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.subscriptionStatus = token.subscriptionStatus;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.subscriptionStatus = user.subscriptionStatus;
      }
      return token;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        try {
          const existingUser = await User.findOne({ email: user.email });
          if (!existingUser) {
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              image: user.image,
              role: 'student', // Default role
            });
            // Attach role/id to user object for the jwt callback which runs after this
            user.role = newUser.role;
            user.id = newUser._id.toString();
            user.subscriptionStatus = newUser.subscriptionStatus;
          } else {
            user.role = existingUser.role;
            user.id = existingUser._id.toString();
            user.subscriptionStatus = existingUser.subscriptionStatus;
          }
          return true;
        } catch (error) {
          console.error("Error saving user", error);
          return false;
        }
      }
      return true;
    },
  },
  pages: {
    signIn: '/login', // Custom login page
    error: '/error',
  },
  session: {
    strategy: "jwt",
  },
}
