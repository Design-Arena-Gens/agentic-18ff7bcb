import { NextRequest, NextResponse } from 'next/server';
import { getUsers, addUser, updateUser, deleteUser } from '@/lib/data';

export async function GET() {
  const users = getUsers().filter(u => u.role === 'guard');
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const newUser = addUser({ ...data, role: 'guard' });
    return NextResponse.json(newUser);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create guard' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json();
    const updated = updateUser(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: 'Guard not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update guard' },
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
        { error: 'Guard ID required' },
        { status: 400 }
      );
    }
    deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete guard' },
      { status: 500 }
    );
  }
}
