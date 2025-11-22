import { NextRequest, NextResponse } from 'next/server';
import { getPatrolRecords, addPatrolRecord, calculateDistance, getLocation, getUser } from '@/lib/data';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const guardId = searchParams.get('guardId');
  const date = searchParams.get('date');

  let records = getPatrolRecords();

  if (guardId) {
    records = records.filter(r => r.guardId === guardId);
  }

  if (date) {
    records = records.filter(r => r.timestamp.startsWith(date));
  }

  return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { guardId, locationId, latitude, longitude, checklistResults, photoUrl } = data;

    const location = getLocation(locationId);
    const guard = getUser(guardId);

    if (!location || !guard) {
      return NextResponse.json(
        { error: 'Invalid location or guard' },
        { status: 400 }
      );
    }

    // Calculate distance from checkpoint
    const distance = calculateDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude
    );

    // Verify guard is within 50 meters
    if (distance > 50) {
      return NextResponse.json(
        { error: `You must be within 50 meters of the checkpoint. Current distance: ${Math.round(distance)}m` },
        { status: 400 }
      );
    }

    const record = addPatrolRecord({
      guardId,
      guardName: guard.name,
      locationId,
      locationName: location.name,
      timestamp: new Date().toISOString(),
      latitude,
      longitude,
      checklistResults,
      photoUrl,
      distanceFromCheckpoint: distance,
    });

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create patrol record' },
      { status: 500 }
    );
  }
}
