import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth-service';

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json();

    if (!userData.email || !userData.name || !userData.password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    const result = await authService.register(userData);

    if (!result) {
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    console.error('Register API error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
