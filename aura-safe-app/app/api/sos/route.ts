import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in is required to send an app SOS.' }, { status: 401 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  const lat = body.latitude, lon = body.longitude;
  if ((lat !== null && lat !== undefined && (typeof lat !== 'number' || lat < -90 || lat > 90)) || (lon !== null && lon !== undefined && (typeof lon !== 'number' || lon < -180 || lon > 180))) return NextResponse.json({ error: 'Invalid coordinates.' }, { status: 400 });
  const { error } = await sb.from('sos_alerts').insert({ user_id: user.id, latitude: lat ?? null, longitude: lon ?? null, status: 'new', source: 'user_button' });
  if (error) return NextResponse.json({ error: 'SOS could not be saved. Call emergency services directly.' }, { status: 500 });
  return NextResponse.json({ ok: true, message: 'Alert recorded for the Aura Safe team. This does not dispatch emergency services.' }, { status: 201 });
}
