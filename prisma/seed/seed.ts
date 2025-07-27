import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning existing data...')
  
  // Clean existing data first
  await prisma.archive.deleteMany({})
  await prisma.letter.deleteMany({})
  await prisma.distribution.deleteMany({})
  await prisma.reception.deleteMany({})
  await prisma.purchaseRequest.deleteMany({})
  await prisma.stockTransaction.deleteMany({})
  await prisma.inventoryItem.deleteMany({})
  await prisma.user.deleteMany({})

  console.log('✅ Existing data cleaned')

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('password123', 10)
  console.log('🔐 Password hashed')

  // Create sample users
  const adminUser = await prisma.user.create({
    data: {
      id: 'user-1',
      username: 'admin',
      name: 'Administrator',
      email: 'admin@upt.kearsipan.id',
      password: hashedPassword,
      role: 'ADMINISTRATOR',
      status: 'ACTIVE'
    }
  })

  const staffUser = await prisma.user.create({
    data: {
      id: 'user-2',
      username: 'staff',
      name: 'Staff UPT',
      email: 'staff@upt.kearsipan.id',
      password: hashedPassword,
      role: 'STAFF',
      status: 'ACTIVE'
    }
  })

  console.log('👥 Users created with hashed passwords')

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

  console.log('📦 Inventory items created')
  console.log('✅ Seed data created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
