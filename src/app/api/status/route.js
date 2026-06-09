import { NextResponse } from 'next/server';
const db = require('@/lib/db');

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const scenario = searchParams.get('scenario') || '2';
    const statuses = await db.getStatus(scenario);
    return NextResponse.json({ success: true, statuses });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
