import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng parameters' }, { status: 400 });
  }

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'historical-weather-explorer/1.0',
    },
  });

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to reverse geocode' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
