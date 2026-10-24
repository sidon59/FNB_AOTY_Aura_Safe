import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
const allowed = new Set(['Physical abuse','Sexual violence','Emotional or verbal abuse','Financial or economic abuse','Digital abuse or stalking','Coercive control or isolation','Harassment or threats','Child abuse or neglect','Other / not sure']);
export async function POST(req: Request) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in is required to submit a report.' }, { status: 401 });
  let body: any; try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!allowed.has(body.category) || typeof body.description !== 'string' || body.description.trim().length < 5 || body.description.length > 10000 || body.consent !== true) return NextResponse.json({ error: 'Please check the category, description and consent.' }, { status: 400 });
  const { data, error } = await sb.from('incident_reports').insert({ user_id: user.id,incident_type: body.category,category: body.category,description: body.description.trim(),consent_given: true,status: 'submitted'}).select('id,created_at').single();
  if (error) { console.error('Incident report insert failed:', error);return NextResponse.json({ error: 'Report could not be saved. Please try again later.' }, { status: 500 });}
    return NextResponse.json({ ok: true, reference: data.id, created_at: data.created_at }, { status: 201 });
}
