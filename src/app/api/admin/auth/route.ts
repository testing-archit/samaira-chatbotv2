import { NextRequest } from 'next/server';

const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY ?? '';
const COOKIE_NAME = 'octaraa_admin_token';

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!ADMIN_SECRET) {
    return Response.json({ error: 'ADMIN_SECRET_KEY not configured.' }, { status: 500 });
  }

  if (password !== ADMIN_SECRET) {
    return Response.json({ error: 'Invalid password.' }, { status: 401 });
  }

  const response = Response.json({ ok: true });
  // httpOnly + Secure: JS cannot read it, never leaks via XSS
  // Path=/ so the browser sends it to both /admin/* AND /api/admin/*
  response.headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=${ADMIN_SECRET}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60 * 60 * 24}`
  );
  return response;
}

export async function DELETE() {
  const response = Response.json({ ok: true });
  response.headers.set(
    'Set-Cookie',
    `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  );
  return response;
}
