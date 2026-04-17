import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get('name');
  const count = searchParams.get('count') ?? '5';

  if (!name) {
    return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });
  }

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=${count}&language=en&format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch geocoding results' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
