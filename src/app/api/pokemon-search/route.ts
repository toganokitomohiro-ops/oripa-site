import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')
  if (!query || query.trim().length < 1) {
    return NextResponse.json({ data: [] })
  }

  const apiKey = process.env.POKEMON_TCG_API_KEY
  const headers: HeadersInit = { 'Content-Type': 'application/json' }
  if (apiKey) headers['X-Api-Key'] = apiKey

  const encoded = encodeURIComponent(`name:"*${query.trim()}*"`)
  const url = `https://api.pokemontcg.io/v2/cards?q=${encoded}&pageSize=20&orderBy=-set.releaseDate`

  try {
    const res = await fetch(url, { headers })
    if (!res.ok) {
      return NextResponse.json({ error: 'API error', data: [] }, { status: res.status })
    }
    const json = await res.json()
    const cards = (json.data ?? []).map((c: {
      id: string
      name: string
      images: { small: string; large: string }
      set: { name: string; series: string }
      number: string
      rarity?: string
    }) => ({
      id: c.id,
      name: c.name,
      imageSmall: c.images.small,
      imageLarge: c.images.large,
      setName: c.set.name,
      series: c.set.series,
      number: c.number,
      rarity: c.rarity ?? '',
    }))
    return NextResponse.json({ data: cards })
  } catch {
    return NextResponse.json({ error: 'Network error', data: [] }, { status: 500 })
  }
}
