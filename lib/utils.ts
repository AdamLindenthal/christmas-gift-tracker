import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs)
}

export function formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return '0 Kč'
    return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
    }).format(amount)
}

export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(d)
}
