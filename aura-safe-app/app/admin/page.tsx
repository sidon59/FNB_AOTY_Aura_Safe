import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import AdminDashboard from '@/components/AdminDashboard';
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const sb = await createClient();
  const {
    data: { user },
    error: authError,
  } = await sb.auth.getUser();
  if (authError || !user) {
    redirect('/?adminLogin=1');
  }
  const { data: profile, error: profileError } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Admin profile lookup failed:', profileError.message);
  }
  if (profile?.role !== 'admin') {
    return (
      <main className="admin-denied">
        <h1>Aura Safe · Admin</h1>
        <p>This account does not have administrator access.</p>
        <a href="/">Return to Aura Safe</a>
      </main>
    );
  }
  const [
    { data: alerts, error: alertsError },
    { data: reports, error: reportsError },
    { data: services, error: servicesError },
  ] = await Promise.all([
    sb
      .from('sos_alerts')
      .select(
        'id,user_id,latitude,longitude,status,created_at,source'
      )
      .order('created_at', { ascending: false })
      .limit(100),
    sb
      .from('incident_reports')
      .select(
        'id,user_id,category,description,status,created_at'
      )
      .order('created_at', { ascending: false })
      .limit(100),
    sb
      .from('support_services')
      .select('*')
      .order('name')
      .limit(200),
  ]);
  if (alertsError) {
    console.error('Failed to load SOS alerts:', alertsError.message);
  }
  if (reportsError) {
    console.error(
      'Failed to load incident reports:',
      reportsError.message
    );
  }
  if (servicesError) {
    console.error(
      'Failed to load support services:',
      servicesError.message
    );
  }
  return (
    <AdminDashboard
      email={user.email ?? ''}
      alerts={alerts ?? []}
      reports={reports ?? []}
      services={services ?? []}
    />
  );
}