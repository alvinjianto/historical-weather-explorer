import { NextRequest, NextResponse } from 'next/server';
import { parseCoordinate } from '@/lib/api-utils';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ARCHIVE_LAG_DAYS = 7;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const lat = searchParams.get('latitude');
  const lng = searchParams.get('longitude');
  const startDate = searchParams.get('start_date');
  const endDate = searchParams.get('end_date');

  if (!lat || !lng || !startDate || !endDate) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const latitude = parseCoordinate(lat, -90, 90);
  const longitude = parseCoordinate(lng, -180, 180);
  if (latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Invalid latitude or longitude' }, { status: 400 });
  }

  if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  if (new Date(startDate).getTime() > new Date(endDate).getTime()) {
    return NextResponse.json({ error: 'start_date must be before or equal to end_date' }, { status: 400 });
  }

  const today = new Date().toISOString().split('T')[0];
  const daysAgo = Math.floor(
    (new Date(today).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Archive API has a ~5-7 day lag; use the forecast API for recent dates
  const baseUrl = daysAgo < ARCHIVE_LAG_DAYS
    ? 'https://api.open-meteo.com/v1/forecast'
    : 'https://archive-api.open-meteo.com/v1/archive';

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: startDate,
    end_date: endDate,
    hourly: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
    timezone: 'auto',
  });

  const response = await fetch(`${baseUrl}?${params}`);
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
