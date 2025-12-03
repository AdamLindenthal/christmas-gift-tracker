import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET a single person with their gifts
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await Promise.resolve(params)

        const person = await prisma.person.findUnique({
            where: { id },
            include: {
                gifts: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        })

        if (!person) {
            return NextResponse.json(
                { error: 'Person not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(person)
    } catch (error) {
        console.error('Error fetching person:', error)
        return NextResponse.json(
            { error: 'Failed to fetch person' },
            { status: 500 }
        )
    }
}

// PUT update a person
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await Promise.resolve(params)
        const body = await request.json()
        const { name } = body

        const person = await prisma.person.update({
            where: { id },
            data: {
                name: name || undefined,
            },
        })

        return NextResponse.json(person)
    } catch (error) {
        console.error('Error updating person:', error)
        return NextResponse.json(
            { error: 'Failed to update person' },
            { status: 500 }
        )
    }
}

// DELETE a person
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await Promise.resolve(params)
        console.log('API: DELETE person called with id:', id)

        await prisma.person.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting person:', error)
        return NextResponse.json(
            { error: 'Failed to delete person' },
            { status: 500 }
        )
    }
}
