import { NextRequest, NextResponse } from 'next/server';
import { getLocations, addLocation, updateLocation, deleteLocation } from '@/lib/data';

export async function GET() {
  const locations = getLocations();
  return NextResponse.json(locations);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newLocation = addLocation(data);
    return NextResponse.json(newLocation);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    const updated = updateLocation(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { error: 'Location ID required' },
        { status: 400 }
      );
    }
    deleteLocation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
