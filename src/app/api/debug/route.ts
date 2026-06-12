import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    return NextResponse.json({ success: true, message: 'Debug endpoint active' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
