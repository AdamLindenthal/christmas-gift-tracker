import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GiftStatus } from '@prisma/client'

// GET all gifts with optional filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const personId = searchParams.get('personId')
        const status = searchParams.get('status')

        const gifts = await prisma.gift.findMany({
            where: {
                ...(personId && { personId }),
                ...(status && { status: status as GiftStatus }),
            },
            include: {
                person: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(gifts)
    } catch (error) {
        console.error('Error fetching gifts:', error)
        return NextResponse.json(
            { error: 'Failed to fetch gifts' },
            { status: 500 }
        )
    }
}

// POST create a new gift
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, description, price, status, url, notes, personId } = body

        if (!name || !personId) {
            return NextResponse.json(
                { error: 'Name and person are required' },
                { status: 400 }
            )
        }

        const gift = await prisma.gift.create({
            data: {
                name,
                description: description || null,
                price: price ? parseFloat(price) : null,
                status: status || 'IDEA',
                url: url || null,
                notes: notes || null,
                personId,
            },
            include: {
                person: true,
            },
        })

        return NextResponse.json(gift, { status: 201 })
    } catch (error) {
        console.error('Error creating gift:', error)
        return NextResponse.json(
            { error: 'Failed to create gift' },
            { status: 500 }
        )
    }
}
