import NextAuth, { DefaultSession } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { compare } from "bcryptjs"

// User roles enum
export type UserRole = "ADMIN" | "COORDINATOR" | "RECRUITER" | "SCRAPER"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      isActive: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    isActive: boolean
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    role: UserRole
    isActive: boolean
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as any, // Type incompatibility between versions
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email as string,
            deletedAt: null, // Exclude soft-deleted users
          },
        })

        if (!user) {
          throw new Error("Invalid credentials")
        }

        if (!user.isActive) {
          throw new Error("Account is inactive")
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role as UserRole
        token.isActive = user.isActive
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.isActive = token.isActive as boolean
      }
      return session
    },
  },
})

/**
 * Role-based authorization check
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const session = await auth()
  
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  if (!session.user.isActive) {
    throw new Error("Account is inactive")
  }

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("Forbidden: Insufficient permissions")
  }

  return session
}

/**
 * Get current user from session
 */
export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}
