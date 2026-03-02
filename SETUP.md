# MMDSS Setup Guide

This guide will help you complete the setup of your MMDSS (Magnus Recruitment Management System) application.

## ✅ Completed Setup

The following components have been successfully configured:

1. ✅ Next.js 14+ project with TypeScript (strict mode)
2. ✅ TailwindCSS with Magnus Copo brand colors
3. ✅ Prisma ORM with PostgreSQL schema
4. ✅ NextAuth.js v5 with RBAC (ADMIN, COORDINATOR, RECRUITER, SCRAPER roles)
5. ✅ User model with soft deletes and audit logging support
6. ✅ Authentication system with login/dashboard pages
7. ✅ Server Actions structure (Module 1: Authentication)
8. ✅ Zod validation schemas
9. ✅ Git repository initialized
10. ✅ Folder structure for components, forms, dashboards, hooks, and types

## 🔧 Database Setup (MongoDB)

This project uses **MongoDB** with **Mongoose** ODM.

**Prerequisites:**
- MongoDB installed and running on your machine
- Default port: 27017

### Starting MongoDB

**Windows:**
```bash
# MongoDB should be running as a service (starts automatically)
# Or start manually:
net start MongoDB
```

**Your `.env` file is already configured:**
```env
DATABASE_URL="mongodb://localhost:27017/mmdss"
```

**If MongoDB requires authentication:**
```env
DATABASE_URL="mongodb://username:password@localhost:27017/mmdss?authSource=admin"
```

✅ **No replica set required!** Mongoose works with standalone MongoDB.

### Generate a Secure NextAuth Secret

Run this command to generate a secure secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use OpenSSL:

```bash
openssl rand -base64 32
```

Update `NEXTAUTH_SECRET` in `.env` with the generated value.

## 🚀 Initialize Database

Simply run the seed command:

```bash
# Seed the database with default users
npm run db:seed
```

### Default User Accounts

After seeding, you'll have these test accounts:

| Role        | Email                          | Password         |
|-------------|--------------------------------|------------------|
| ADMIN       | admin@magnuscopo.com           | Admin123!        |
| COORDINATOR | coordinator@magnuscopo.com     | Coordinator123!  |
| RECRUITER   | recruiter@magnuscopo.com       | Recruiter123!    |
| SCRAPER     | scraper@magnuscopo.com         | Scraper123!      |

## 🏃 Run the Application

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

You'll be redirected to the login page. Use any of the default accounts to sign in.

## 📦 Next Steps: Adding shadcn/ui Components

When ready to add UI components, run:

```bash
# Add button component
npx shadcn-ui@latest add button

# Add form components
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label

# Add table component
npx shadcn-ui@latest add table

# Add card component
npx shadcn-ui@latest add card

# Add dialog component
npx shadcn-ui@latest add dialog
```

## 🗂️ Project Structure

```
mmdss/
├── app/                          # Next.js App Router
│   ├── (auth)/login/            # Login page
│   ├── (dashboard)/dashboard/   # Protected dashboard
│   ├── api/auth/                # NextAuth API routes
│   └── layout.tsx               # Root layout
├── components/
│   ├── ui/                      # shadcn components (to be added)
│   ├── forms/                   # Form components (to be added)
│   ├── dashboards/              # Role-specific dashboards (to be added)
│   └── providers.tsx            # React Query & Session providers
├── lib/
│   ├── actions/                 # Server Actions
│   │   └── module1-auth.ts     # Authentication actions
│   ├── validators/              # Zod schemas
│   │   └── common.ts           # Common validations
│   ├── auth.ts                  # NextAuth configuration
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts                 # Utility functions
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Database seed script
├── types/                       # TypeScript type definitions
└── hooks/                       # Custom React hooks (to be added)
```

## 🔐 Security Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Change default passwords** after first login
3. **Use strong NEXTAUTH_SECRET** in production
4. **Enable SSL** for database connections in production

## 📊 Database Management

```bash
# Seed or re-seed the database
npm run db:seed

# Use MongoDB Compass for GUI database management
# Download from: https://www.mongodb.com/products/tools/compass
```

## 🐛 Troubleshooting

### "Invalid `prisma.user.findUnique()` invocation"

This means the database hasn't been initialized. Run:

```bash
npm run db:push
```

### "Authentication failed"

Make sure you've seeded the database with default users:

```bash
npm run db:seed
```

### "Database connection error"

With SQLite, this is rare. If it happens:
1. Check that `.env` has `DATABASE_URL="file:./mmdss.db"`
2. Ensure you have write permissions in the project directory
3. Try deleting `mmdss.db` and running `npm run db:push` again

## 📚 Documentation Links

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js v5 Documentation](https://authjs.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Zod Documentation](https://zod.dev)
- [TanStack Query Documentation](https://tanstack.com/query)

## 🎯 Development Roadmap

### Phase 1: Foundation (Complete ✅)
- [x] Project setup
- [x] Authentication system
- [x] User management
- [x] Database schema foundation

### Phase 2: Core Modules (Next Steps)
- [ ] Module 3: Company Management
- [ ] Module 4: Requirement Management
- [ ] Module 5: Candidate Management
- [ ] Module 6: Status Workflow Engine
- [ ] Module 7: Submission Management

### Phase 3: Advanced Features
- [ ] Module 8: Placement Management
- [ ] Module 9: Document Management
- [ ] Module 10: Communication Hub
- [ ] Module 11: Analytics Dashboard
- [ ] Module 12: Reporting Engine

### Phase 4: Integrations
- [ ] Module 13: External Integrations (Job boards, ATS)
- [ ] Module 15: Export/Import System

---

**Need Help?** Check the [README.md](README.md) for more information about the project architecture and business rules.
