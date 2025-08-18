import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating reception (single legacy or multi items)
const receptionItemSchema = z.object({
  id: z.string().optional(), // for updates
  purchaseRequestItemId: z.string().optional(),
  itemName: z.string().min(1),
  requestedQuantity: z.coerce.number().min(0),
  receivedQuantity: z.coerce.number().min(0),
  unit: z.string().min(1),
  itemId: z.string().optional(),
})
const createReceptionSchema = z.object({
  purchaseRequestId: z.string().optional(),
  // Legacy single item fields (required if no items array)
  itemName: z.string().min(1).optional(),
  requestedQuantity: z.coerce.number().min(0).optional(),
  receivedQuantity: z.coerce.number().min(0).optional(),
  unit: z.string().min(1).optional(),
  // receiptDate optional: default now() if not provided
  receiptDate: z.string().datetime('Invalid date format').optional(),
  status: z.enum(['COMPLETE', 'PARTIAL', 'DIFFERENT']),
  notes: z.string().optional(),
  itemId: z.string().optional(),
  items: z.array(receptionItemSchema).optional(),
});

function determineStatusForMulti(items: { requestedQuantity: number; receivedQuantity: number }[]): 'COMPLETE'|'PARTIAL'|'DIFFERENT' {
  let diffLess = false; let diffGreater = false;
  for (const it of items) {
    if (it.receivedQuantity < it.requestedQuantity) diffLess = true;
    else if (it.receivedQuantity > it.requestedQuantity) diffGreater = true;
  }
  if (!diffLess && !diffGreater) return 'COMPLETE';
  if (diffGreater) return 'DIFFERENT'; // any over => DIFFERENT
  return 'PARTIAL'; // only less cases
}

// Update-specific light schema for multi-item edits (only id + receivedQuantity allowed)
const updateReceptionItemSchema = z.object({
  id: z.string(),
  receivedQuantity: z.coerce.number().min(0),
})
const updateReceptionSchema = z.object({
  purchaseRequestId: z.string().optional(),
  itemName: z.string().min(1).optional(),
  requestedQuantity: z.coerce.number().min(0).optional(),
  receivedQuantity: z.coerce.number().min(0).optional(),
  unit: z.string().min(1).optional(),
  receiptDate: z.string().datetime('Invalid date format').optional(),
  status: z.enum(['COMPLETE', 'PARTIAL', 'DIFFERENT']).optional(),
  notes: z.string().optional(),
  itemId: z.string().optional(),
  items: z.array(updateReceptionItemSchema).optional(),
});

// GET /api/reception - Get all receptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Rumus pagination: skip = (halaman - 1) * limit
    // Formula untuk menentukan berapa data yang dilewati dalam pagination
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { itemName: { contains: search, mode: 'insensitive' } },
        { receivedBy: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [rawReceptions, total] = await Promise.all([
      prisma.reception.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          receivedBy: { select: { id: true, name: true, username: true } },
          item: { select: { id: true, name: true, category: true, stock: true, unit: true } },
          purchaseRequest: { select: { id: true, requestNumber: true, requestedBy: { select: { id: true, name: true, username: true } } } },
          items: true,
        },
      }),
      prisma.reception.count({ where }),
    ]);

    // Transform: jika multi-item (items.length > 0) tampilkan agregat
    const receptions = rawReceptions.map(r => {
      if (!r.items || r.items.length === 0) return r;
      const totalRequested = r.items.reduce((sum, it) => sum + it.requestedQuantity, 0);
      const totalReceived = r.items.reduce((sum, it) => sum + it.receivedQuantity, 0);
      return {
        ...r,
        itemName: r.items.map(it => it.itemName).join(', '),
        requestedQuantity: totalRequested,
        receivedQuantity: totalReceived,
        unit: '', // multi-unit; bisa dikosongkan atau "multi"
      };
    });

    return NextResponse.json({
      receptions,
      pagination: {
        page,
        limit,
        total,
        // Rumus menghitung total halaman: Math.ceil(total / limit)
        // Formula ceiling untuk membulatkan ke atas agar semua data tertampung
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching receptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/reception - Create new reception
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReceptionSchema.parse(body);

    const isMulti = validatedData.items && validatedData.items.length
    if (!isMulti) {
      // legacy single item path
      if (!validatedData.itemId) {
        return NextResponse.json({ error: 'Barang harus sudah terdaftar di inventory sebelum penerimaan.' }, { status: 400 })
      }
      const existingItem = await prisma.inventoryItem.findUnique({ where: { id: validatedData.itemId } });
      if (!existingItem) return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    } else {
      // validate each item inventory existence if itemId present
      const itemIds = validatedData.items!.map(i=>i.itemId).filter((v): v is string => !!v)
      if (itemIds.length) {
        const found = await prisma.inventoryItem.findMany({ where: { id: { in: itemIds } } })
        const set = new Set(found.map(f=>f.id))
        const missing = itemIds.filter(id=>!set.has(id))
        if (missing.length) return NextResponse.json({ error: 'Some inventory items not found', missing }, { status: 404 })
      }
    }

    const result = await prisma.$transaction(async tx => {
      const rec = await tx.reception.create({
        data: {
          purchaseRequestId: validatedData.purchaseRequestId,
          itemName: isMulti ? '' : (validatedData.itemName || ''),
          requestedQuantity: isMulti ? 0 : (validatedData.requestedQuantity || 0),
          receivedQuantity: isMulti ? 0 : (validatedData.receivedQuantity || 0),
          unit: isMulti ? '' : (validatedData.unit || ''),
          receiptDate: validatedData.receiptDate ? new Date(validatedData.receiptDate) : new Date(),
          status: validatedData.status, // tentatively; may override for multi after items loop
          notes: validatedData.notes,
          receivedById: session.user.id,
          itemId: isMulti ? undefined : validatedData.itemId,
          ...(isMulti && {
            items: {
              create: validatedData.items!.map(it => ({
                purchaseRequestItemId: it.purchaseRequestItemId,
                itemName: it.itemName,
                requestedQuantity: it.requestedQuantity,
                receivedQuantity: it.receivedQuantity,
                unit: it.unit,
                itemId: it.itemId,
              }))
            }
          })
        }
      })
      if (isMulti) {
        for (const it of validatedData.items!) {
          if (it.itemId && validatedData.status === 'COMPLETE') {
            await tx.inventoryItem.update({ where: { id: it.itemId }, data: { stock: { increment: it.receivedQuantity } } })
            await tx.stockTransaction.create({ data: { type: 'IN', quantity: it.receivedQuantity, description: 'Reception (multi-item)', itemId: it.itemId, userId: session.user.id } })
          }
        }
        // Auto status override if not explicitly DIFFERENT/PARTIAL with custom calculation
        const autoStatus = determineStatusForMulti(validatedData.items!.map(i=>({requestedQuantity: i.requestedQuantity, receivedQuantity: i.receivedQuantity})))
        if (autoStatus !== rec.status) {
          await tx.reception.update({ where: { id: rec.id }, data: { status: autoStatus } })
          rec.status = autoStatus as any
        }
      } else if (validatedData.itemId && validatedData.status === 'COMPLETE') {
        await tx.inventoryItem.update({ where: { id: validatedData.itemId }, data: { stock: { increment: validatedData.receivedQuantity! } } })
        await tx.stockTransaction.create({ data: { type: 'IN', quantity: validatedData.receivedQuantity!, description: 'Reception (single-item)', itemId: validatedData.itemId, userId: session.user.id } })
      }
      if (validatedData.purchaseRequestId) {
        await tx.purchaseRequest.update({ where: { id: validatedData.purchaseRequestId }, data: { status: 'RECEIVED' } })
      }
      return rec.id
    })

    const full = await prisma.reception.findUnique({
      where: { id: result },
      include: {
        items: true,
        receivedBy: { select: { id: true, name: true, username: true } },
      }
    })

    return NextResponse.json(full, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating reception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/reception - Update reception
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
  const { id, ...updateDataRaw } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Reception ID is required' },
        { status: 400 }
      );
    }

    // Validate update data
  const validatedData = updateReceptionSchema.parse(updateDataRaw);

    // Check if reception exists
    const existingReception = await prisma.reception.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!existingReception) {
      return NextResponse.json(
        { error: 'Reception not found' },
        { status: 404 }
      );
    }

    // If itemId is being updated, check if the new item exists
    if (validatedData.itemId && validatedData.itemId !== existingReception.itemId) {
      const newItem = await prisma.inventoryItem.findUnique({
        where: { id: validatedData.itemId },
      });
      if (!newItem) {
        return NextResponse.json(
          { error: 'New inventory item not found' },
          { status: 404 }
        );
      }
    }

    // Build update data explicitly to avoid unintended undefined field assignments
    const updateData: any = {}
    if (validatedData.itemName !== undefined) updateData.itemName = validatedData.itemName
    if (validatedData.requestedQuantity !== undefined) updateData.requestedQuantity = validatedData.requestedQuantity
    if (validatedData.receivedQuantity !== undefined) updateData.receivedQuantity = validatedData.receivedQuantity
    if (validatedData.unit !== undefined) updateData.unit = validatedData.unit
    if (validatedData.status !== undefined) updateData.status = validatedData.status
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes
    if (validatedData.itemId !== undefined) updateData.itemId = validatedData.itemId
    if (validatedData.purchaseRequestId !== undefined) updateData.purchaseRequestId = validatedData.purchaseRequestId
    if (validatedData.receiptDate !== undefined) updateData.receiptDate = new Date(validatedData.receiptDate)

  const updatedReception = await prisma.$transaction(async tx => {
      // Update reception base fields first
      const rec = await tx.reception.update({ where: { id }, data: updateData });

      // Handle multi-item updates if items provided
      if (validatedData.items && validatedData.items.length) {
        const existingItems = await tx.receptionItem.findMany({ where: { receptionId: id } });
        const mapExisting = new Map(existingItems.map(it => [it.id, it]));
        const overallOldStatus = existingReception.status;
        const overallNewStatus = validatedData.status ?? existingReception.status;
        let anyChange = false;

        for (const payloadItem of validatedData.items) {
          if (!payloadItem.id) continue; // skip if id missing
          const old = mapExisting.get(payloadItem.id);
            if (!old) continue;
          // Update item receivedQuantity if changed
          if (payloadItem.receivedQuantity !== undefined && payloadItem.receivedQuantity !== old.receivedQuantity) {
            await tx.receptionItem.update({ where: { id: payloadItem.id }, data: { receivedQuantity: payloadItem.receivedQuantity } });
            await tx.receptionItemChange.create({ data: { receptionId: id, receptionItemId: payloadItem.id, field: 'receivedQuantity', oldValue: old.receivedQuantity, newValue: payloadItem.receivedQuantity, userId: session.user.id } });
            anyChange = true;
          }
          // Stock adjustment logic per item
          if (old.itemId) {
            const oldApplied = overallOldStatus === 'COMPLETE' ? old.receivedQuantity : 0;
            const newReceivedQty = payloadItem.receivedQuantity ?? old.receivedQuantity;
            const newApplied = overallNewStatus === 'COMPLETE' ? newReceivedQty : 0;
            const diff = newApplied - oldApplied;
            if (diff !== 0) {
              await tx.inventoryItem.update({ where: { id: old.itemId }, data: { stock: { increment: diff } } });
              await tx.stockTransaction.create({ data: { type: diff > 0 ? 'IN' : 'OUT', quantity: Math.abs(diff), description: 'Reception multi-item edit', itemId: old.itemId, userId: session.user.id } });
            }
          }
        }
        // Recalculate status automatically if status not explicitly sent
        if (validatedData.status === undefined && anyChange) {
          const itemsAfter = await tx.receptionItem.findMany({ where: { receptionId: id }, select: { requestedQuantity: true, receivedQuantity: true } })
          const autoStatus = determineStatusForMulti(itemsAfter)
          if (autoStatus !== rec.status) {
            await tx.reception.update({ where: { id }, data: { status: autoStatus } });
            rec.status = autoStatus as any
          }
        }
      } else {
        // Single-item stock adjustment (existing logic) if status/quantity changed
        if (existingReception.itemId && (
          validatedData.receivedQuantity !== undefined && validatedData.receivedQuantity !== existingReception.receivedQuantity ||
          validatedData.status && validatedData.status !== existingReception.status
        )) {
          const oldQuantity = existingReception.status === 'COMPLETE' ? existingReception.receivedQuantity : 0;
          const newQuantity = (validatedData.status ?? existingReception.status) === 'COMPLETE' ? (validatedData.receivedQuantity || existingReception.receivedQuantity) : 0;
          const stockDifference = newQuantity - oldQuantity;
          if (stockDifference !== 0) {
            await tx.inventoryItem.update({ where: { id: existingReception.itemId }, data: { stock: { increment: stockDifference } } });
            await tx.stockTransaction.create({ data: { type: stockDifference > 0 ? 'IN' : 'OUT', quantity: Math.abs(stockDifference), description: 'Reception update - stock adjustment', itemId: existingReception.itemId, userId: session.user.id } });
          }
        }
      }

  return tx.reception.findUnique({
        where: { id },
        include: {
          receivedBy: { select: { id: true, name: true, username: true } },
          item: { select: { id: true, name: true, category: true, stock: true, unit: true } },
          purchaseRequest: { select: { id: true, requestNumber: true, requestedBy: { select: { id: true, name: true, username: true } } } },
          items: true,
        }
      }) as any;
    });

  // (Single-item stock adjustments handled inside transaction now.)

    return NextResponse.json(updatedReception);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating reception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/reception - Delete reception
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Reception ID is required' },
        { status: 400 }
      );
    }

    // Check if reception exists
    const existingReception = await prisma.reception.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingReception) {
      return NextResponse.json(
        { error: 'Reception not found' },
        { status: 404 }
      );
    }

    // Revert stock changes if reception was COMPLETE
    if (existingReception.status === 'COMPLETE') {
      if (existingReception.items && existingReception.items.length) {
        for (const it of existingReception.items) {
          if (!it.itemId) continue;
          if (it.receivedQuantity > 0) {
            await prisma.inventoryItem.update({
              where: { id: it.itemId },
              data: { stock: { decrement: it.receivedQuantity } },
            });
            await prisma.stockTransaction.create({
              data: {
                type: 'OUT',
                quantity: it.receivedQuantity,
                description: 'Reception (multi-item) deleted - stock reverted',
                itemId: it.itemId,
                userId: session.user.id,
              },
            });
          }
        }
      } else if (existingReception.itemId) {
        await prisma.inventoryItem.update({
          where: { id: existingReception.itemId },
          data: { stock: { decrement: existingReception.receivedQuantity } },
        });
        await prisma.stockTransaction.create({
          data: {
            type: 'OUT',
            quantity: existingReception.receivedQuantity,
            description: 'Reception deleted - stock reverted',
            itemId: existingReception.itemId,
            userId: session.user.id,
          },
        });
      }
    }

    // Update purchase request status back to APPROVED if linked
    if (existingReception.purchaseRequestId) {
      await prisma.purchaseRequest.update({
        where: { id: existingReception.purchaseRequestId },
        data: {
          status: 'APPROVED',
        },
      });
    }

    // Delete reception
    await prisma.reception.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Reception deleted successfully' });
  } catch (error) {
    console.error('Error deleting reception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
