import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all people with their gift statistics
export async function GET() {
    try {
        const people = await prisma.person.findMany({
            include: {
                gifts: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        // Calculate statistics for each person
        const peopleWithStats = people.map(person => {
            const totalSpent = person.gifts.reduce((sum, gift) => sum + (gift.price || 0), 0)
            const giftCount = person.gifts.length

            return {
                ...person,
                totalSpent,
                giftCount,
            }
        })

        return NextResponse.json(peopleWithStats)
    } catch (error) {
        console.error('Error fetching people:', error)
        return NextResponse.json(
            { error: 'Failed to fetch people' },
            { status: 500 }
        )
    }
}

// POST create a new person
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            )
        }

        const person = await prisma.person.create({
            data: {
                name,
            },
        })

        return NextResponse.json(person, { status: 201 })
    } catch (error) {
        console.error('Error creating person:', error)
        return NextResponse.json(
            { error: 'Failed to create person' },
            { status: 500 }
        )
    }
}
