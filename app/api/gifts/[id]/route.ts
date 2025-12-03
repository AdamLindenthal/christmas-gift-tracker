import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET a single gift
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await Promise.resolve(params)

        const gift = await prisma.gift.findUnique({
            where: { id },
            include: {
                person: true,
            },
        })

        if (!gift) {
            return NextResponse.json(
                { error: 'Gift not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(gift)
    } catch (error) {
        console.error('Error fetching gift:', error)
        return NextResponse.json(
            { error: 'Failed to fetch gift' },
            { status: 500 }
        )
    }
}

// PUT update a gift
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await Promise.resolve(params)
        const body = await request.json()
        const { name, description, price, status, url, notes, personId } = body

        const gift = await prisma.gift.update({
            where: { id },
            data: {
                name: name || undefined,
                description: description !== undefined ? description : undefined,
                price: price !== undefined ? (price ? parseFloat(price) : null) : undefined,
                status: status || undefined,
                url: url !== undefined ? url : undefined,
                notes: notes !== undefined ? notes : undefined,
                personId: personId || undefined,
            },
            include: {
                person: true,
            },
        })

        return NextResponse.json(gift)
    } catch (error) {
        console.error('Error updating gift:', error)
        return NextResponse.json(
            { error: 'Failed to update gift' },
            { status: 500 }
        )
    }
}

// DELETE a gift
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await Promise.resolve(params)

        await prisma.gift.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting gift:', error)
        return NextResponse.json(
            { error: 'Failed to delete gift' },
            { status: 500 }
        )
    }
}
