import { PrismaClient } from '../../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  // Create sample users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@upt.kearsipan.id' },
    update: {},
    create: {
      id: 'user-1',
      username: 'admin',
      name: 'Administrator',
      email: 'admin@upt.kearsipan.id',
      password: 'hashed_password_here', // In real app, use bcrypt
      role: 'ADMINISTRATOR',
      status: 'ACTIVE'
    }
  })

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@upt.kearsipan.id' },
    update: {},
    create: {
      id: 'user-2',
      username: 'staff',
      name: 'Staff UPT',
      email: 'staff@upt.kearsipan.id',
      password: 'hashed_password_here', // In real app, use bcrypt
      role: 'STAFF',
      status: 'ACTIVE'
    }
  })

  // Create sample inventory items
  const items = [
    {
      name: 'Kertas HVS A4',
      category: 'Alat Tulis',
      unit: 'Rim',
      stock: 25,
      minStock: 10
    },
    {
      name: 'Tinta Printer Canon',
      category: 'Elektronik', 
      unit: 'Unit',
      stock: 2,
      minStock: 5
    },
    {
      name: 'Stapler Besar',
      category: 'Alat Tulis',
      unit: 'Unit', 
      stock: 8,
      minStock: 3
    },
    {
      name: 'Kertas HVS A3',
      category: 'Alat Tulis',
      unit: 'Rim',
      stock: 15,
      minStock: 5
    },
    {
      name: 'Folder Plastik',
      category: 'Alat Tulis',
      unit: 'Pack',
      stock: 30,
      minStock: 10
    }
  ]

  for (const item of items) {
    await prisma.inventoryItem.create({
      data: item
    })
  }

  console.log('Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
