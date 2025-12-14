
import { NextResponse } from 'next/server'
import { getCachedMarketListings } from '@/lib/market-data'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get('sort') || 'newest'

    const listings = await getCachedMarketListings({ sort })

    const prices = listings.map(l => l.price_cents)

    return NextResponse.json({
        sortParam: sort,
        count: listings.length,
        first5Prices: prices.slice(0, 5),
        isSortedAsc: isSorted(prices, 'asc'),
        isSortedDesc: isSorted(prices, 'desc')
    })
}

function isSorted(arr: number[], direction: 'asc' | 'desc') {
    for (let i = 0; i < arr.length - 1; i++) {
        if (direction === 'asc') {
            if (arr[i] > arr[i + 1]) return false
        } else {
            if (arr[i] < arr[i + 1]) return false
        }
    }
    return true
}
