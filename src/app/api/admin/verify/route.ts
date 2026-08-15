import { NextResponse } from 'next/server';

/**
 * Admin PIN verification endpoint.
 *
 * This is demo-only security, not production-grade.
 * In production, replace with a proper auth system (e.g. Supabase Auth, NextAuth).
 */
export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    const adminPin = process.env.ADMIN_PIN;

    if (!adminPin) {
      return NextResponse.json(
        { error: 'ADMIN_PIN not configured on server' },
        { status: 500 }
      );
    }

    if (pin === adminPin) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid PIN' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
