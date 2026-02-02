import { z } from 'zod'

// ============================================
// USER VALIDATION
// ============================================

export const UserRoleSchema = z.enum(['ADMIN', 'COORDINATOR', 'RECRUITER', 'SCRAPER'])

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: UserRoleSchema,
})

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: z.string().uuid(),
})

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ============================================
// MMD-ID VALIDATION
// ============================================

export const MmdIdSchema = z.string().regex(
  /^MMD-[A-Z]+-\d{8}-\d{3}$/,
  'Invalid MMD-ID format. Expected: MMD-{GROUP}-{YYYYMMDD}-{SEQUENCE}'
)

// ============================================
// COMMON SCHEMAS
// ============================================

export const UuidSchema = z.string().uuid('Invalid UUID format')

export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
})

export const DateRangeSchema = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
})
