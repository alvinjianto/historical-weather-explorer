import { NextRequest, NextResponse } from 'next/server';
import { parseCoordinate } from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Missing lat/lng parameters' }, { status: 400 });
  }

  const latitude = parseCoordinate(lat, -90, 90);
  const longitude = parseCoordinate(lng, -180, 180);
  if (latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Invalid lat/lng parameters' }, { status: 400 });
  }

  const params = new URLSearchParams({
    format: 'json',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '10',
    addressdetails: '1',
  });

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
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
