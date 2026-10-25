import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'node:crypto';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
}

function hashCode(value: string) {
  return createHash('sha256').update(value.trim().toUpperCase()).digest();
}

function equalHash(inputCode: string, savedHex: string | null) {
  if (!savedHex || !/^[a-f0-9]{64}$/i.test(savedHex)) return false;
  const submitted = hashCode(inputCode);
  const saved = Buffer.from(savedHex, 'hex');
  return saved.length === submitted.length && timingSafeEqual(saved, submitted);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonError('Enter your report reference and access code.', 400);
  }

  const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
  const accessCode = typeof body.accessCode === 'string' ? body.accessCode.trim() : '';

  if (
    !reference ||
    reference.length > 80 ||
    !/^[0-9a-f-]{32,36}$/i.test(reference) ||
    !/^[a-f0-9]{12}$/i.test(accessCode)
  ) {
    return jsonError('The reference or access code is invalid.', 400);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonError('Report status lookup is not configured. Please contact the Aura Safe team.', 503);
  }

  const admin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: report, error } = await admin
    .from('incident_reports')
    .select('id, status, created_at, updated_at, access_code_hash')
    .eq('id', reference)
    .maybeSingle();

  // Use the same generic error for unknown references and incorrect codes.
  if (error || !report || !equalHash(accessCode, report.access_code_hash)) {
    return jsonError('We could not verify those details. Check your reference and access code and try again.', 401);
  }

  const [{ data: events, error: eventsError }, { data: messages, error: messagesError }] = await Promise.all([
    admin
      .from('report_status_events')
      .select('status, note, created_at')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true })
      .limit(50),
    admin
      .from('report_messages')
      .select('sender_role, message, created_at')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true })
      .limit(50),
  ]);

  if (eventsError || messagesError) {
    console.error('Report status history lookup failed.');
    return jsonError('The report was verified, but its history could not be loaded. Please try again later.', 500);
  }

  return NextResponse.json(
    {
      ok: true,
      report: {
        reference: report.id,
        status: report.status,
        createdAt: report.created_at,
        updatedAt: report.updated_at ?? report.created_at,
      },
      history: events ?? [],
      messages: messages ?? [],
      notice:
        'This page shows the status recorded by Aura Safe. It does not confirm that police, ambulance or other emergency services have been dispatched.',
    },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}