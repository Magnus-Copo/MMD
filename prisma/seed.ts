import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await hash("Admin123!", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@magnuscopo.com" },
    update: {},
    create: {
      email: "admin@magnuscopo.com",
      password: adminPassword,
      name: "System Administrator",
      role: "ADMIN",
      isActive: true,
    },
  })

  console.log("✅ Created admin user:", admin.email)

  // Create coordinator user
  const coordinatorPassword = await hash("Coordinator123!", 12)
  const coordinator = await prisma.user.upsert({
    where: { email: "coordinator@magnuscopo.com" },
    update: {},
    create: {
      email: "coordinator@magnuscopo.com",
      password: coordinatorPassword,
      name: "Lead Coordinator",
      role: "COORDINATOR",
      isActive: true,
    },
  })

  console.log("✅ Created coordinator user:", coordinator.email)

  // Create recruiter user
  const recruiterPassword = await hash("Recruiter123!", 12)
  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@magnuscopo.com" },
    update: {},
    create: {
      email: "recruiter@magnuscopo.com",
      password: recruiterPassword,
      name: "Senior Recruiter",
      role: "RECRUITER",
      isActive: true,
    },
  })

  console.log("✅ Created recruiter user:", recruiter.email)

  // Create scraper user
  const scraperPassword = await hash("Scraper123!", 12)
  const scraper = await prisma.user.upsert({
    where: { email: "scraper@magnuscopo.com" },
    update: {},
    create: {
      email: "scraper@magnuscopo.com",
      password: scraperPassword,
      name: "Data Scraper",
      role: "SCRAPER",
      isActive: true,
    },
  })

  console.log("✅ Created scraper user:", scraper.email)

  console.log("\n🎉 Database seeded successfully!")
  console.log("\n📋 Default Users:")
  console.log("  Admin:       admin@magnuscopo.com / Admin123!")
  console.log("  Coordinator: coordinator@magnuscopo.com / Coordinator123!")
  console.log("  Recruiter:   recruiter@magnuscopo.com / Recruiter123!")
  console.log("  Scraper:     scraper@magnuscopo.com / Scraper123!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
