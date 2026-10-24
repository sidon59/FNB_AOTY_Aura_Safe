import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const sb = await createClient();
  const { data, error } = await sb.from('services').select('id,name,category,description,phone,website,province,verified,address,latitude,longitude').eq('active', true).order('name');
  if (error) return NextResponse.json({ services: [] }, { status: 200 });
  return NextResponse.json({ services: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}
