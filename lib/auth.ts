import NextAuth, { type DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { compare, hash } from "bcryptjs"
import connectDB from "@/lib/db/mongodb"
import User, { type UserRole } from "@/lib/db/models/User"
import AuditLog from "@/lib/db/models/AuditLog"

const defaultUsers = [
  { email: "admin@magnuscopo.com", password: "Admin123!", name: "Super Administrator", role: "SUPER_ADMIN" as UserRole },
  { email: "admin_limited@magnuscopo.com", password: "Admin123!", name: "Limited Administrator", role: "ADMIN" as UserRole },
  { email: "rashmi@magnuscopo.com", password: "Coordinator123!", name: "Rashmi Sharma", role: "COORDINATOR" as UserRole },
  { email: "manjunath@magnuscopo.com", password: "Coordinator123!", name: "Manjunath Kumar", role: "COORDINATOR" as UserRole },
  { email: "priya@magnuscopo.com", password: "Recruiter123!", name: "Priya Patel", role: "RECRUITER" as UserRole },
  { email: "rahul@magnuscopo.com", password: "Recruiter123!", name: "Rahul Singh", role: "RECRUITER" as UserRole },
  { email: "scraper@magnuscopo.com", password: "Scraper123!", name: "Data Scraper", role: "SCRAPER" as UserRole },
]

let ensureDefaultUsersPromise: Promise<void> | null = null

async function ensureDefaultUsers() {
  if (ensureDefaultUsersPromise) return ensureDefaultUsersPromise

  ensureDefaultUsersPromise = (async () => {
    await Promise.all(
      defaultUsers.map(async (user) => {
        const email = user.email.toLowerCase()
        const hashed = await hash(user.password, 12)

        await User.updateOne(
          { email },
          {
            $set: {
              password: hashed,
              name: user.name,
              role: user.role,
              isActive: true,
              deletedAt: null,
            },
          },
          { upsert: true }
        )
      })
    )

    console.log("✅ Default accounts ensured/updated")
  })()

  return ensureDefaultUsersPromise
}

// Extend NextAuth types
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

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
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

        await connectDB()
        await ensureDefaultUsers()

        const normalizedEmail =
          typeof credentials.email === "string"
            ? credentials.email.toLowerCase().trim()
            : ""

        const user = await User.findOne({
          email: normalizedEmail,
          deletedAt: null, // Exclude soft-deleted users
          isActive: true,
        })

        if (!user) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        await AuditLog.create({
          userId: user._id,
          action: "USER_AUTHENTICATED",
          entity: "User",
          entityId: user._id.toString(),
          newValue: { email: user.email, role: user.role },
        })

        return {
          id: user._id.toString(),
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
      const mutable = token as typeof token & {
        id?: string
        role?: UserRole
        name?: string
        isActive?: boolean
      }

      if (user) {
        mutable.id = (user as any).id
        mutable.role = (user as any).role
        mutable.name = (user as any).name
        mutable.isActive = (user as any).isActive
      }
      return mutable
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.name = (token as any).name ?? session.user.name
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

  if (allowedRoles.includes("ADMIN" as UserRole)) {
    if (!allowedRoles.includes("SUPER_ADMIN" as UserRole)) {
      allowedRoles.push("SUPER_ADMIN" as UserRole)
    }
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
