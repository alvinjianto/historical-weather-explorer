import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get('name');
  const requestedCount = Number(searchParams.get('count') ?? '5');
  const count = Number.isInteger(requestedCount)
    ? Math.min(10, Math.max(1, requestedCount))
    : 5;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });
  }

  const params = new URLSearchParams({
    name: name.trim(),
    count: String(count),
    language: 'en',
    format: 'json',
  });

  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch geocoding results' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
