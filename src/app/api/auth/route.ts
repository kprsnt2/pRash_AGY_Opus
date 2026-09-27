import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.APP_PASSWORD || 'prash2024';

    if (password === correctPassword) {
      const token = Buffer.from(Date.now().toString() + Math.random().toString()).toString('base64');
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ success: false }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Bad Request' }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  if (token && token.trim() !== '') {
    return NextResponse.json({ valid: true });
  }

  return NextResponse.json({ valid: false }, { status: 401 });
}
