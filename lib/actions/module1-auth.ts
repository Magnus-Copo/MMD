"use server"

import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { CreateUserSchema, LoginSchema } from "@/lib/validators/common"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { z } from "zod"

/**
 * Module 1: Authentication Actions
 * Requirement: MMD-AUTH-001 - User login with role-based access
 */

export async function loginAction(credentials: z.infer<typeof LoginSchema>) {
  try {
    const validated = LoginSchema.parse(credentials)
    
    const result = await signIn("credentials", {
      email: validated.email,
      password: validated.password,
      redirect: false,
    })

    return { success: true, data: result }
  } catch (error) {
    if (error instanceof AuthError) {
      return { success: false, error: error.message }
    }
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Login failed" }
  }
}

export async function createUserAction(data: z.infer<typeof CreateUserSchema>) {
  try {
    const validated = CreateUserSchema.parse(data)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    })

    if (existingUser) {
      return { success: false, error: "User already exists" }
    }

    // Hash password
    const hashedPassword = await hash(validated.password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        name: validated.name,
        role: validated.role,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    // Audit log would be created here

    return { success: true, data: user }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: "Failed to create user" }
  }
}
