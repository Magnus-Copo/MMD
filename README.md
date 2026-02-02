# MMDSS - Magnus Recruitment Management System

Enterprise staffing operations platform built with Next.js 14+, TypeScript, and PostgreSQL.

## Tech Stack

- **Framework:** Next.js 14+ (App Router, Server Actions)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v5 (Auth.js) with Role-based Access Control (RBAC)
- **Styling:** TailwindCSS with Magnus Copo brand colors
- **UI Components:** shadcn/ui
- **Forms:** React Hook Form + Zod validation
- **State Management:** TanStack Query (React Query)
- **Date Utilities:** date-fns
- **Server Actions:** next-safe-action

## Project Structure

```
├── app/
│   ├── (auth)/           # Authentication routes
│   │   └── login/
│   ├── (dashboard)/      # Protected dashboard routes
│   │   └── dashboard/
│   ├── api/              # API routes (NextAuth)
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/               # shadcn components (to be added)
│   ├── forms/            # Form wrappers (to be added)
│   ├── dashboards/       # Role-specific views (to be added)
│   └── providers.tsx
├── lib/
│   ├── actions/          # Server Actions by module
│   │   └── module1-auth.ts
│   ├── validators/       # Zod schemas
│   │   └── common.ts
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Utility functions
├── prisma/
│   └── schema.prisma     # Database schema
├── types/                # TypeScript types (to be added)
└── hooks/                # Custom React hooks (to be added)
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (NeonDB or Supabase recommended)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL`: Your application URL (http://localhost:3000 for development)

3. Initialize the database:
```bash
npx prisma generate
npx prisma db push
```

4. Create a default admin user (optional):
```bash
npx prisma studio
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Architecture

### Key Principles

1. **UUID Primary Keys:** All tables use UUID for primary keys
2. **Soft Deletes:** All entities have `deletedAt` field - no hard deletes
3. **Audit Logging:** All state changes are logged in `audit_logs` table
4. **Explicit Relations:** All foreign keys use `onDelete: Restrict` to prevent accidental data loss
5. **Timestamps:** Every table has `createdAt` and `updatedAt`

### User Roles (RBAC)

- **ADMIN:** Full system access
- **COORDINATOR:** Manage requirements, candidates, and placements
- **RECRUITER:** Manage candidates and submissions
- **SCRAPER:** View-only access for data collection

## Color System

Magnus Copo brand colors are configured in `tailwind.config.ts`:

- **Primary:** Electric Indigo (#6366F1) - Main brand color
- **Accent:** Cyan (#06B6D4) - Highlights and CTAs
- **Success:** Emerald - Positive actions
- **Warning:** Amber - Cautionary states
- **Destructive:** Red - Destructive actions
- **Background:** Midnight Navy (#0B0F19) - Dark theme background

## Authentication

NextAuth.js v5 is configured with:

- **Credentials Provider:** Email/password authentication with bcrypt
- **JWT Strategy:** Session management
- **RBAC:** Role-based access control
- **Protected Routes:** Middleware authentication
- **Session Management:** 30-day sessions

### Creating Users

Users can be created programmatically using the `createUserAction`:

```typescript
import { createUserAction } from "@/lib/actions/module1-auth"

const result = await createUserAction({
  email: "admin@magnuscopo.com",
  password: "SecurePassword123",
  name: "Admin User",
  role: "ADMIN",
})
```

## Validation Layer

Zod schemas enforce MMDSS business rules:

- **MMD-ID Format:** `MMD-{GROUP}-{YYYYMMDD}-{SEQUENCE}`
- **Password Requirements:** Min 8 chars, uppercase, lowercase, number
- **Email Validation:** Standard email format
- **Role Validation:** Enum-based role checking

## Next Steps

1. Install shadcn/ui components as needed
2. Expand Prisma schema with Company, Requirement, Candidate models
3. Implement Module 3 (Company Management) actions
4. Implement Module 4 (Requirement Management) actions
5. Build role-specific dashboard views
6. Add comprehensive error handling
7. Implement audit logging throughout

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma generate  # Regenerate Prisma Client
npx prisma db push   # Push schema changes to database
```

## License

Proprietary - Magnus Copo Staffing Operations
