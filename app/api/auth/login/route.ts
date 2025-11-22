import { NextRequest, NextResponse } from 'next/server';
import { getUserByUsername } from '@/lib/data';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const user = getUserByUsername(username);

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
