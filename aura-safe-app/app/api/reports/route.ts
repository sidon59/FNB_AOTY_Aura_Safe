import { NextResponse } from 'next/server';
import { createHash, randomBytes } from 'node:crypto';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const allowedCategories = new Set([
  'Physical abuse',
  'Sexual violence',
  'Emotional or verbal abuse',
  'Financial or economic abuse',
  'Digital abuse or stalking',
  'Coercive control or isolation',
  'Harassment or threats',
  'Child abuse or neglect',
  'Other / not sure',
]);

const clean = (value: unknown, max = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

function mapReporterType(value: unknown): 'self' | 'third_party' | 'witness' | null {
  if (value === 'self' || value === 'myself') return 'self';
  if (value === 'third_party' || value === 'someone_else') return 'third_party';
  if (value === 'witness') return 'witness';
  return null;
}

function mapAgeGroup(value: unknown): 'child_under_13' | 'teen_13_17' | 'adult_18_plus' | 'unknown' {
  if (value === 'child_under_13' || value === 'under_13') return 'child_under_13';
  if (value === 'teen_13_17') return 'teen_13_17';
  if (value === 'adult_18_plus' || value === '18_older' || value === 'adult') return 'adult_18_plus';
  return 'unknown';
}

// Map the form's category to the older database column's permitted values.
function mapLegacyIncidentType(category: string): string {
  switch (category) {
    case 'Physical abuse': return 'physical';
    case 'Sexual violence': return 'sexual';
    case 'Emotional or verbal abuse': return 'emotional';
    case 'Financial or economic abuse': return 'financial';
    case 'Digital abuse or stalking': return 'digital';
    case 'Coercive control or isolation': return 'coercive_control';
    case 'Harassment or threats': return 'harassment';
    case 'Child abuse or neglect': return 'neglect';
    default: return 'other';
  }
}

function mapImmediateDanger(value: unknown): boolean {
  return value === true || value === 'yes';
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid request body.', 400);
  }

  const category = clean(body.category, 100);
  const description = clean(body.description, 10000);
  const reporterName = clean(body.reporterName, 160);
  const reporterContact = clean(body.reporterContact, 200);
  const reporterType = mapReporterType(body.reportingFor ?? body.reporterType);
  const safeContactMethod = clean(body.safeContactMethod, 30);

  if (!allowedCategories.has(category) || description.length < 5 || body.consent !== true) {
    return jsonError(
      'Choose a valid category, provide at least five characters of notes, and confirm the consent statement.',
      400,
    );
  }

  if (!reporterName || !reporterType) {
    return jsonError(
      'Enter your name and choose whether you are reporting for yourself, someone else, or as a witness.',
      400,
    );
  }

  if (!['email', 'phone', 'sms', 'no_contact'].includes(safeContactMethod)) {
    return jsonError('Choose a valid safe-contact preference.', 400);
  }

  if (body.evidencePaths !== undefined && !Array.isArray(body.evidencePaths)) {
    return jsonError('Evidence attachments are invalid. Please select the files again.', 400);
  }
  const rawEvidencePaths: unknown[] = Array.isArray(body.evidencePaths) ? body.evidencePaths : [];
  if (rawEvidencePaths.length > 5) {
    return jsonError('Attach no more than five evidence files.', 400);
  }

  const safeContactDetail = clean(body.safeContactDetail, 200);
  if (safeContactMethod !== 'no_contact' && !safeContactDetail) {
    return jsonError(
      'Enter the safe contact detail you selected, or choose “Do not contact me”.',
      400,
    );
  }

  const effectiveReporterContact = reporterContact ||
    (safeContactMethod !== 'no_contact' ? safeContactDetail : '');

  if (safeContactMethod !== 'no_contact' && !effectiveReporterContact) {
    return jsonError(
      'Provide a safe way to contact you, or choose “Do not contact me”.',
      400,
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonError(
      'Secure report intake is not configured. The administrator must configure the server-only Supabase service-role key.',
      503,
    );
  }

  let userId: string | null = null;
  try {
    const userClient = await createClient();
    const { data } = await userClient.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    userId = null;
  }

  const evidencePaths: string[] = [];
  for (const item of rawEvidencePaths) {
    if (typeof item !== 'string') {
      return jsonError('One of the evidence attachments is invalid. Please select the files again.', 400);
    }
    const path = item.trim();
    const segments = path.split('/');
    // Uploads use a user-specific folder: <auth-user-id>/<random-file-name>.
    // This prevents a report from claiming evidence stored under another account.
    if (
      !userId ||
      path.length > 1024 ||
      segments.length !== 2 ||
      segments[0] !== userId ||
      !segments[1] ||
      path.includes('..') ||
      path.includes('\\')
    ) {
      return jsonError('Evidence attachments must be uploaded by your signed-in account. Sign in again and select the files again.', 403);
    }
    evidencePaths.push(path);
  }

  const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const accessCode = randomBytes(6).toString('hex').toUpperCase();
  const accessCodeHash = createHash('sha256').update(accessCode).digest('hex');
  const ageGroup = mapAgeGroup(body.victimAgeGroup);

  const insertPayload = {
    // Current fields used by Aura Safe.
    user_id: userId,
    reporter_type: reporterType,
    reporter_name: reporterName,
    reporter_contact: effectiveReporterContact || null,
    relationship_to_victim: clean(body.relationshipToVictim, 120) || null,
    victim_name: clean(body.victimName, 160) || null,
    victim_age_group: ageGroup,
    incident_location: clean(body.incidentLocation, 500) || null,
    immediate_danger: mapImmediateDanger(body.immediateDanger),
    safe_contact_method: safeContactMethod,
    safe_contact_detail: safeContactMethod === 'no_contact' ? null : safeContactDetail,
    category,
    description,
    consent_recorded: true,
    // Legacy consent flag required by the original database check constraint.
    // This is set only after the request body has explicitly confirmed body.consent === true.
    consent_given: true,
    status: 'received',
    access_code_hash: accessCodeHash,
    // Store private Storage object paths, not public URLs or file contents.
    evidence_paths: evidencePaths,

    // Legacy fields still required by the original database schema.
    incident_type: mapLegacyIncidentType(category),
    consent_to_submit: true,
  };

  const { data: report, error } = await admin
    .from('incident_reports')
    .insert(insertPayload)
    .select('id, created_at, status')
    .single();

  if (error || !report) {
    // Log database diagnostics on the server only; never return them to the browser.
    console.error('Incident report insert failed:', {
      code: error?.code ?? 'unknown',
      message: error?.message ?? 'No database row returned',
    });
    return jsonError(
      'The report could not be saved. Please try again later or contact an official support service.',
      500,
    );
  }

  const { error: historyError } = await admin
    .from('report_status_events')
    .insert({
      report_id: report.id,
      status: 'received',
      note: 'Report received by the Aura Safe application team.',
    });

  if (historyError) {
    console.error('Initial report status event could not be saved:', historyError.code);
  }

  return NextResponse.json(
    {
      ok: true,
      reference: report.id,
      accessCode,
      status: report.status,
      created_at: report.created_at,
      message:
        'Report received by the Aura Safe application team only. This does not confirm administrator review or contact with police, ambulance, or another emergency service.',
    },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  );
}