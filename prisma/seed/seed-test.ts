import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed-test data for 1-year operational system...')

  // Clear existing data
  await prisma.stockTransaction.deleteMany()
  await prisma.distributionItem.deleteMany()
  await prisma.distribution.deleteMany()
  await prisma.reception.deleteMany()
  await prisma.purchaseRequest.deleteMany()
  await prisma.letter.deleteMany()
  await prisma.archive.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.user.deleteMany()

  // Hash password for users
  const hashedPassword = await bcrypt.hash('password123', 10)

  // 1. Create Users (realistic for UPT office)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'admin.upt',
        name: 'Budi Santoso',
        email: 'admin@upt-kearsipan.go.id',
        password: hashedPassword,
        role: 'ADMINISTRATOR',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-15'),
        lastLogin: new Date('2025-08-01'),
      }
    }),
    prisma.user.create({
      data: {
        username: 'siti.arsip',
        name: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@upt-kearsipan.go.id',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
        createdAt: new Date('2024-02-01'),
        lastLogin: new Date('2025-08-02'),
      }
    }),
    prisma.user.create({
      data: {
        username: 'ahmad.inv',
        name: 'Ahmad Fauzi',
        email: 'ahmad.fauzi@upt-kearsipan.go.id',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
        createdAt: new Date('2024-02-15'),
        lastLogin: new Date('2025-07-30'),
      }
    }),
    prisma.user.create({
      data: {
        username: 'rina.dist',
        name: 'Rina Marlina',
        email: 'rina.marlina@upt-kearsipan.go.id',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
        createdAt: new Date('2024-03-01'),
        lastLogin: new Date('2025-08-01'),
      }
    }),
    prisma.user.create({
      data: {
        username: 'dedi.old',
        name: 'Dedi Kurniawan',
        email: 'dedi.kurniawan@upt-kearsipan.go.id',
        password: hashedPassword,
        role: 'STAFF',
        status: 'INACTIVE',
        createdAt: new Date('2024-01-20'),
        lastLogin: new Date('2024-12-15'),
      }
    }),
    prisma.user.create({
      data: {
        username: 'admin',
        name: 'Administrator',
        email: 'administrator@upt-kearsipan.go.id',
        password: hashedPassword,
        role: 'ADMINISTRATOR',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-10'),
        lastLogin: new Date('2025-08-02'),
      }
    }),
    prisma.user.create({
      data: {
        username: 'staff',
        name: 'Staff User',
        email: 'staff.user@upt-kearsipan.go.id',
        password: hashedPassword,
        role: 'STAFF',
        status: 'ACTIVE',
        createdAt: new Date('2024-01-12'),
        lastLogin: new Date('2025-08-01'),
      }
    })
  ])

  console.log('👥 Users created')

  // 2. Create Inventory Items (varied stock levels showing 1-year usage)
  const inventoryItems = await Promise.all([
    // Alat Tulis
    prisma.inventoryItem.create({
      data: {
        name: 'Kertas HVS A4 80gsm',
        category: 'Alat Tulis',
        unit: 'Rim',
        stock: 45,
        minStock: 20,
        createdAt: new Date('2024-02-01'),
      }
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Kertas HVS A3 80gsm',
        category: 'Alat Tulis',
        unit: 'Rim',
        stock: 8,
        minStock: 5,
        createdAt: new Date('2024-02-01'),
      }
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Ballpoint Pilot G2',
        category: 'Alat Tulis',
        unit: 'Pcs',
        stock: 156,
        minStock: 50,
        createdAt: new Date('2024-02-05'),
      }
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Folder Plastic A4',
        category: 'Alat Tulis',
        unit: 'Pack',
        stock: 12,
        minStock: 10,
        createdAt: new Date('2024-02-10'),
      }
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Staples No.10',
        category: 'Alat Tulis',
        unit: 'Box',
        stock: 28,
        minStock: 15,
        createdAt: new Date('2024-02-15'),
      }
    }),
    // Elektronik
    prisma.inventoryItem.create({
      data: {
        name: 'Toner HP LaserJet 85A',
        category: 'Elektronik',
        unit: 'Pcs',
        stock: 3,
        minStock: 2,
        createdAt: new Date('2024-03-01'),
      }
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Tinta Printer Canon 740/741',
        category: 'Elektronik',
        unit: 'Set',
        stock: 6,
        minStock: 3,
        createdAt: new Date('2024-03-05'),
      }
    }),
    // Furniture & Equipment
    prisma.inventoryItem.create({
      data: {
        name: 'Filing Cabinet 4 Laci',
        category: 'Furniture',
        unit: 'Unit',
        stock: 2,
        minStock: 1,
        createdAt: new Date('2024-04-01'),
      }
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Rak Arsip Besi 5 Tingkat',
        category: 'Furniture',
        unit: 'Unit',
        stock: 4,
        minStock: 2,
        createdAt: new Date('2024-04-15'),
      }
    }),
    // Konsumsi
    prisma.inventoryItem.create({
      data: {
        name: 'Air Mineral Galon',
        category: 'Konsumsi',
        unit: 'Galon',
        stock: 8,
        minStock: 5,
        createdAt: new Date('2024-02-20'),
      }
    }),
    prisma.inventoryItem.create({
      data: {
        name: 'Kopi Instant Sachet',
        category: 'Konsumsi',
        unit: 'Box',
        stock: 15,
        minStock: 10,
        createdAt: new Date('2024-03-10'),
      }
    }),
    // Stok Kritis
    prisma.inventoryItem.create({
      data: {
        name: 'Amplop Coklat A4',
        category: 'Alat Tulis',
        unit: 'Pack',
        stock: 0,
        minStock: 5,
        createdAt: new Date('2024-05-01'),
      }
    })
  ])

  console.log('📦 Inventory items created')

  // 3. Create Stock Transactions (showing 1-year activity)
  const stockTransactions = []
  
  // Initial stock IN transactions (awal tahun)
  for (let i = 0; i < inventoryItems.length; i++) {
    const item = inventoryItems[i]
    const initialStock = Math.floor(Math.random() * 100) + 50
    
    stockTransactions.push(
      prisma.stockTransaction.create({
        data: {
          type: 'IN',
          quantity: initialStock,
          description: `Stok awal tahun 2024 - ${item.name}`,
          itemId: item.id,
          userId: users[2].id, // Ahmad (inventory staff)
          createdAt: new Date('2024-02-01'),
        }
      })
    )
  }

  // Random stock transactions throughout the year
  const dates = [
    '2024-03-15', '2024-04-20', '2024-05-10', '2024-06-05', '2024-07-12',
    '2024-08-18', '2024-09-22', '2024-10-08', '2024-11-15', '2024-12-10',
    '2025-01-20', '2025-02-25', '2025-03-30', '2025-04-15', '2025-05-20',
    '2025-06-10', '2025-07-05'
  ]

  for (const date of dates) {
    const randomItem = inventoryItems[Math.floor(Math.random() * inventoryItems.length)]
    const isIN = Math.random() > 0.3 // 70% IN, 30% OUT
    const quantity = Math.floor(Math.random() * 20) + 5
    
    stockTransactions.push(
      prisma.stockTransaction.create({
        data: {
          type: isIN ? 'IN' : 'OUT',
          quantity,
          description: isIN 
            ? `Pembelian rutin - ${randomItem.name}`
            : `Distribusi ke departemen - ${randomItem.name}`,
          itemId: randomItem.id,
          userId: users[Math.floor(Math.random() * 4)].id,
          createdAt: new Date(date),
        }
      })
    )
  }

  await Promise.all(stockTransactions)
  console.log('📊 Stock transactions created')

  // 4. Create Purchase Requests (showing realistic workflow)
  const purchaseRequests = await Promise.all([
    // Purchase requests that will have receptions (status RECEIVED)
    prisma.purchaseRequest.create({
      data: {
        itemName: 'Kertas HVS A4 80gsm',
        quantity: 50,
        unit: 'Rim',
        reason: 'Stok hampir habis untuk operasional harian',
        status: 'RECEIVED',
        notes: 'Disetujui untuk pembelian bulan ini',
        requestDate: new Date('2025-07-15'),
        reviewDate: new Date('2025-07-20'),
        requestedById: users[1].id, // Siti
        reviewedById: users[0].id, // Admin
        itemId: inventoryItems[0].id,
      }
    }),
    prisma.purchaseRequest.create({
      data: {
        itemName: 'Toner HP LaserJet 85A',
        quantity: 5,
        unit: 'Pcs',
        reason: 'Printer utama memerlukan toner baru',
        status: 'RECEIVED',
        notes: 'Urgent - printer hampir habis toner',
        requestDate: new Date('2025-07-20'),
        reviewDate: new Date('2025-07-22'),
        requestedById: users[2].id, // Ahmad
        reviewedById: users[0].id, // Admin
        itemId: inventoryItems[5].id,
      }
    }),
    // Pending requests
    prisma.purchaseRequest.create({
      data: {
        itemName: 'Filing Cabinet 4 Laci',
        quantity: 2,
        unit: 'Unit',
        reason: 'Perlu tambahan storage untuk arsip yang bertambah',
        status: 'PENDING',
        requestDate: new Date('2025-07-28'),
        requestedById: users[1].id, // Siti
        itemId: inventoryItems[7].id,
      }
    }),
    // Rejected request
    prisma.purchaseRequest.create({
      data: {
        itemName: 'Komputer Desktop Dell',
        quantity: 3,
        unit: 'Unit',
        reason: 'Komputer lama sudah lambat untuk pekerjaan',
        status: 'REJECTED',
        notes: 'Budget belum tersedia untuk periode ini',
        requestDate: new Date('2025-06-10'),
        reviewDate: new Date('2025-06-15'),
        requestedById: users[3].id, // Rina
        reviewedById: users[0].id, // Admin
      }
    }),
    // More pending requests
    prisma.purchaseRequest.create({
      data: {
        itemName: 'Amplop Coklat A4',
        quantity: 20,
        unit: 'Pack',
        reason: 'Stok habis, diperlukan untuk surat menyurat',
        status: 'PENDING',
        requestDate: new Date('2025-08-01'),
        requestedById: users[2].id, // Ahmad
        itemId: inventoryItems[11].id,
      }
    }),
    // Additional APPROVED requests (available for reception)
    prisma.purchaseRequest.create({
      data: {
        itemName: 'Folder Plastic A4',
        quantity: 15,
        unit: 'Pack',
        reason: 'Diperlukan untuk sistem filing baru',
        status: 'APPROVED',
        notes: 'Disetujui untuk pembelian segera',
        requestDate: new Date('2025-07-30'),
        reviewDate: new Date('2025-08-01'),
        requestedById: users[1].id, // Siti
        reviewedById: users[0].id, // Admin
        itemId: inventoryItems[3].id,
      }
    }),
    prisma.purchaseRequest.create({
      data: {
        itemName: 'Air Mineral Galon',
        quantity: 10,
        unit: 'Galon',
        reason: 'Stok air minum habis untuk keperluan kantor',
        status: 'APPROVED',
        notes: 'Disetujui untuk pembelian rutin',
        requestDate: new Date('2025-08-01'),
        reviewDate: new Date('2025-08-02'),
        requestedById: users[3].id, // Rina
        reviewedById: users[0].id, // Admin
        itemId: inventoryItems[9].id,
      }
    })
  ])

  console.log('📝 Purchase requests created')

  // 5. Create Receptions (based on approved purchase requests)
  const receptions = await Promise.all([
    prisma.reception.create({
      data: {
        requestId: purchaseRequests[0].id,
        itemName: 'Kertas HVS A4 80gsm',
        requestedQuantity: 50,
        receivedQuantity: 50,
        unit: 'Rim',
        receiptDate: new Date('2025-07-25'),
        status: 'COMPLETE',
        notes: 'Barang diterima sesuai dengan permintaan',
        receivedById: users[2].id, // Ahmad
        itemId: inventoryItems[0].id,
      }
    }),
    prisma.reception.create({
      data: {
        requestId: purchaseRequests[1].id,
        itemName: 'Toner HP LaserJet 85A',
        requestedQuantity: 5,
        receivedQuantity: 4,
        unit: 'Pcs',
        receiptDate: new Date('2025-07-28'),
        status: 'PARTIAL',
        notes: 'Hanya diterima 4 pcs, supplier kehabisan stok',
        receivedById: users[2].id, // Ahmad
        itemId: inventoryItems[5].id,
      }
    }),
    // Reception without request (direct purchase)
    prisma.reception.create({
      data: {
        itemName: 'Ballpoint Pilot G2',
        requestedQuantity: 100,
        receivedQuantity: 120,
        unit: 'Pcs',
        receiptDate: new Date('2025-06-15'),
        status: 'DIFFERENT',
        notes: 'Diterima lebih banyak dari yang diminta, bonus dari supplier',
        receivedById: users[2].id, // Ahmad
        itemId: inventoryItems[2].id,
      }
    })
  ])

  console.log('📥 Receptions created')

  // 6. Create Distributions (realistic distribution patterns)
  const distributions = []
  const distributionData = [
    {
      noteNumber: 'DIST/2024/001',
      staffName: 'Dr. Bambang Sutrisno',
      department: 'Bagian Umum',
      date: new Date('2024-03-10'),
      purpose: 'Kebutuhan operasional kantor',
      items: [
        { itemName: 'Kertas HVS A4 80gsm', quantity: 5, unit: 'Rim', itemId: inventoryItems[0].id },
        { itemName: 'Ballpoint Pilot G2', quantity: 20, unit: 'Pcs', itemId: inventoryItems[2].id },
      ]
    },
    {
      noteNumber: 'DIST/2024/015',
      staffName: 'Dra. Sari Wulandari',
      department: 'Bagian Kepegawaian',
      date: new Date('2024-05-22'),
      purpose: 'Penyusunan laporan kepegawaian',
      items: [
        { itemName: 'Kertas HVS A4 80gsm', quantity: 3, unit: 'Rim', itemId: inventoryItems[0].id },
        { itemName: 'Folder Plastic A4', quantity: 2, unit: 'Pack', itemId: inventoryItems[3].id },
      ]
    },
    {
      noteNumber: 'DIST/2024/028',
      staffName: 'Ir. Agus Prasetyo',
      department: 'Bagian Keuangan',
      date: new Date('2024-08-15'),
      purpose: 'Persiapan audit internal',
      items: [
        { itemName: 'Kertas HVS A3 80gsm', quantity: 2, unit: 'Rim', itemId: inventoryItems[1].id },
        { itemName: 'Staples No.10', quantity: 3, unit: 'Box', itemId: inventoryItems[4].id },
      ]
    },
    {
      noteNumber: 'DIST/2025/003',
      staffName: 'M. Rizki Habibi, S.Kom',
      department: 'Bagian IT',
      date: new Date('2025-02-18'),
      purpose: 'Setup workstation baru',
      items: [
        { itemName: 'Tinta Printer Canon 740/741', quantity: 2, unit: 'Set', itemId: inventoryItems[6].id },
        { itemName: 'Kertas HVS A4 80gsm', quantity: 2, unit: 'Rim', itemId: inventoryItems[0].id },
      ]
    },
    {
      noteNumber: 'DIST/2025/012',
      staffName: 'Drs. Hadi Sutomo',
      department: 'Bagian Arsip',
      date: new Date('2025-06-20'),
      purpose: 'Reorganisasi sistem arsip',
      items: [
        { itemName: 'Rak Arsip Besi 5 Tingkat', quantity: 1, unit: 'Unit', itemId: inventoryItems[8].id },
        { itemName: 'Folder Plastic A4', quantity: 5, unit: 'Pack', itemId: inventoryItems[3].id },
      ]
    }
  ]

  for (const distData of distributionData) {
    const distribution = await prisma.distribution.create({
      data: {
        noteNumber: distData.noteNumber,
        staffName: distData.staffName,
        department: distData.department,
        distributionDate: distData.date,
        purpose: distData.purpose,
        distributedById: users[3].id, // Rina (distribution staff)
        createdAt: distData.date,
      }
    })

    // Create distribution items
    for (const item of distData.items) {
      await prisma.distributionItem.create({
        data: {
          distributionId: distribution.id,
          itemName: item.itemName,
          quantity: item.quantity,
          unit: item.unit,
          itemId: item.itemId,
          createdAt: distData.date,
        }
      })
    }

    distributions.push(distribution)
  }

  console.log('📤 Distributions created')

  // 7. Create Letters (5 letters without files as requested)
  const letters = await Promise.all([
    prisma.letter.create({
      data: {
        number: 'SK/001/UPT-ARSIP/2024',
        date: new Date('2024-01-15'),
        subject: 'Surat Keputusan Pembentukan Tim Pengelola Arsip',
        type: 'OUTGOING',
        from: 'Kepala UPT Kearsipan',
        to: 'Seluruh Staff UPT',
        description: 'Surat keputusan pembentukan tim pengelola arsip untuk tahun 2024',
        hasDocument: false,
        createdById: users[0].id, // Admin
        createdAt: new Date('2024-01-15'),
      }
    }),
    prisma.letter.create({
      data: {
        number: 'SPD/045/DIKBUD/2024',
        date: new Date('2024-06-20'),
        subject: 'Surat Perintah Dinas Pelatihan Pengelolaan Arsip Digital',
        type: 'INCOMING',
        from: 'Dinas Pendidikan dan Kebudayaan Provinsi',
        to: 'Kepala UPT Kearsipan',
        description: 'Perintah dinas untuk mengikuti pelatihan pengelolaan arsip digital di Jakarta',
        hasDocument: false,
        createdById: users[1].id, // Siti
        createdAt: new Date('2024-06-20'),
      }
    }),
    prisma.letter.create({
      data: {
        number: 'UND/078/UPT-ARSIP/2024',
        date: new Date('2024-09-10'),
        subject: 'Undangan Rapat Koordinasi Pengelolaan Arsip Daerah',
        type: 'OUTGOING',
        from: 'Kepala UPT Kearsipan',
        to: 'Kepala SKPD Se-Kabupaten',
        description: 'Undangan rapat koordinasi untuk membahas standardisasi pengelolaan arsip di lingkungan pemerintah daerah',
        hasDocument: false,
        createdById: users[0].id, // Admin
        createdAt: new Date('2024-09-10'),
      }
    }),
    prisma.letter.create({
      data: {
        number: 'LAP/156/BPK/2024',
        date: new Date('2024-11-25'),
        subject: 'Laporan Hasil Pemeriksaan Pengelolaan Arsip',
        type: 'INCOMING',
        from: 'Badan Pemeriksa Keuangan RI',
        to: 'Kepala UPT Kearsipan',
        description: 'Laporan hasil pemeriksaan BPK terkait pengelolaan arsip dan dokumentasi keuangan',
        hasDocument: false,
        createdById: users[1].id, // Siti
        createdAt: new Date('2024-11-25'),
      }
    }),
    prisma.letter.create({
      data: {
        number: 'NOT/012/UPT-ARSIP/2025',
        date: new Date('2025-03-15'),
        subject: 'Nota Dinas Perubahan Jadwal Pemusnahan Arsip',
        type: 'OUTGOING',
        from: 'Kepala UPT Kearsipan',
        to: 'Sekretaris Daerah',
        description: 'Nota dinas mengenai perubahan jadwal kegiatan pemusnahan arsip yang telah melewati masa retensi',
        hasDocument: false,
        createdById: users[0].id, // Admin
        createdAt: new Date('2025-03-15'),
      }
    })
  ])

  console.log('📮 Letters created')

  // 8. Create Archives (realistic archive data)
  const archives = await Promise.all([
    prisma.archive.create({
      data: {
        code: 'ARS-001-2023',
        title: 'Surat Keputusan Pengangkatan Pegawai 2023',
        category: 'Kepegawaian',
        creationDate: new Date('2023-12-31'),
        retentionPeriod: 30,
        location: 'Rak A1 - Box 001',
        description: 'Kumpulan SK pengangkatan pegawai tahun 2023',
        notes: 'Arsip dalam kondisi baik, sudah dikatalogisasi',
        archivedById: users[1].id, // Siti
        createdAt: new Date('2024-01-15'),
      }
    }),
    prisma.archive.create({
      data: {
        code: 'ARS-002-2022',
        title: 'Laporan Keuangan Tahunan 2022',
        category: 'Keuangan',
        creationDate: new Date('2022-12-31'),
        retentionPeriod: 10,
        location: 'Rak B2 - Box 015',
        description: 'Laporan keuangan lengkap tahun anggaran 2022',
        notes: 'Sudah diaudit BPK, arsip permanen',
        archivedById: users[1].id, // Siti
        createdAt: new Date('2024-02-20'),
      }
    }),
    prisma.archive.create({
      data: {
        code: 'ARS-003-2021',
        title: 'Notulen Rapat Koordinasi 2021',
        category: 'Administrasi',
        creationDate: new Date('2021-12-30'),
        retentionPeriod: 5,
        location: 'Rak C1 - Box 008',
        description: 'Kumpulan notulen rapat koordinasi selama tahun 2021',
        notes: 'Arsip sudah memasuki masa retensi akhir',
        archivedById: users[1].id, // Siti
        createdAt: new Date('2024-03-10'),
      }
    }),
    prisma.archive.create({
      data: {
        code: 'ARS-004-2020',
        title: 'Dokumen Perencanaan Strategis 2020-2025',
        category: 'Perencanaan',
        creationDate: new Date('2020-01-15'),
        retentionPeriod: 25,
        location: 'Rak A3 - Box 005',
        description: 'Dokumen renstra dan rencana kerja 5 tahun',
        notes: 'Arsip vital, dilindungi khusus',
        archivedById: users[1].id, // Siti
        createdAt: new Date('2024-04-05'),
      }
    }),
    prisma.archive.create({
      data: {
        code: 'ARS-005-2019',
        title: 'Surat Masuk dan Keluar 2019',
        category: 'Surat Menyurat',
        creationDate: new Date('2019-12-31'),
        retentionPeriod: 5,
        location: 'Rak D1 - Box 022',
        description: 'Arsip surat masuk dan keluar tahun 2019',
        notes: 'Sebagian dokumen sudah rusak karena usia',
        destructionDate: new Date('2024-12-31'),
        archivedById: users[1].id, // Siti
        createdAt: new Date('2024-05-15'),
      }
    }),
    prisma.archive.create({
      data: {
        code: 'ARS-006-2024',
        title: 'Inventarisasi Aset 2024',
        category: 'Inventaris',
        creationDate: new Date('2024-06-30'),
        retentionPeriod: 10,
        location: 'Rak E1 - Box 001',
        description: 'Dokumentasi inventarisasi aset UPT tahun 2024',
        notes: 'Arsip terbaru, kondisi sangat baik',
        archivedById: users[1].id, // Siti
        createdAt: new Date('2024-07-15'),
      }
    })
  ])

  console.log('🗄️ Archives created')

  console.log('✅ Seed-test data completed successfully!')
  console.log(`
📊 Summary:
- 👥 Users: ${users.length} (6 active, 1 inactive)
- 📦 Inventory Items: ${inventoryItems.length}
- 📊 Stock Transactions: ~${dates.length + inventoryItems.length}
- 📝 Purchase Requests: ${purchaseRequests.length}
- 📥 Receptions: ${receptions.length}
- 📤 Distributions: ${distributions.length}
- 📮 Letters: ${letters.length} (all without files)
- 🗄️ Archives: ${archives.length}

🎯 This represents a realistic 1-year operational UPT Kearsipan system with:
- Active workflow processes
- Varied stock levels (some critical, some normal)
- Mix of approved/pending/rejected requests
- Distribution history across departments
- Complete correspondence without file attachments
- Archive management with retention periods

👤 Login Credentials:
- Admin: username: admin, password: password123
- Staff: username: staff, password: password123
- Other users also use password: password123
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
