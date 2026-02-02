import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await hash("Admin123!", 12)
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@magnuscopo.com" } })
  if (!existingAdmin) {
    const admin = await prisma.user.create({
      data: {
        email: "admin@magnuscopo.com",
        password: adminPassword,
        name: "System Administrator",
        role: "ADMIN",
        isActive: true,
      },
    })
    console.log("✅ Created admin user:", admin.email)
  } else {
    console.log("⏭️  Admin user already exists")
  }

  // Create coordinator user
  const coordinatorPassword = await hash("Coordinator123!", 12)
  const existingCoordinator = await prisma.user.findUnique({ where: { email: "coordinator@magnuscopo.com" } })
  if (!existingCoordinator) {
    const coordinator = await prisma.user.create({
      data: {
        email: "coordinator@magnuscopo.com",
        password: coordinatorPassword,
        name: "Lead Coordinator",
        role: "COORDINATOR",
        isActive: true,
      },
    })
    console.log("✅ Created coordinator user:", coordinator.email)
  } else {
    console.log("⏭️  Coordinator user already exists")
  }

  // Create recruiter user
  const recruiterPassword = await hash("Recruiter123!", 12)
  const existingRecruiter = await prisma.user.findUnique({ where: { email: "recruiter@magnuscopo.com" } })
  if (!existingRecruiter) {
    const recruiter = await prisma.user.create({
      data: {
        email: "recruiter@magnuscopo.com",
        password: recruiterPassword,
        name: "Senior Recruiter",
        role: "RECRUITER",
        isActive: true,
      },
    })
    console.log("✅ Created recruiter user:", recruiter.email)
  } else {
    console.log("⏭️  Recruiter user already exists")
  }

  // Create scraper user
  const scraperPassword = await hash("Scraper123!", 12)
  const existingScraper = await prisma.user.findUnique({ where: { email: "scraper@magnuscopo.com" } })
  if (!existingScraper) {
    const scraper = await prisma.user.create({
      data: {
        email: "scraper@magnuscopo.com",
        password: scraperPassword,
        name: "Data Scraper",
        role: "SCRAPER",
        isActive: true,
      },
    })
    console.log("✅ Created scraper user:", scraper.email)
  } else {
    console.log("⏭️  Scraper user already exists")
  }

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
