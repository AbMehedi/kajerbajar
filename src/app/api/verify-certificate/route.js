// src/app/api/verify-certificate/route.js
import { createServiceRoleClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const certId = searchParams.get('id');
    if (!certId) {
      return NextResponse.json({ error: 'Certificate ID is required' }, { status: 400 });
    }

    const adminClient = createServiceRoleClient();

    const selectFields = `
      id,
      issued_at,
      project_id,
      projects (
        id,
        title,
        budget_bdt,
        company_profiles (
          legal_name
        )
      ),
      student_id,
      student_profiles (
        users_profiles!student_profiles_id_fkey (
          full_name
        )
      )
    `;

    let cert = null;

    if (certId.startsWith('KB-') && certId.length >= 11) {
      const shortId = certId.substring(3).toLowerCase();

      // Strategy 1: Match against certificate.id prefix (new format)
      const minUuid = `${shortId}-0000-0000-0000-000000000000`;
      const maxUuid = `${shortId}-ffff-ffff-ffff-ffffffffffff`;

      const { data: certsByOwnId } = await adminClient
        .from('certificates')
        .select(selectFields)
        .gte('id', minUuid)
        .lte('id', maxUuid);

      if (certsByOwnId && certsByOwnId.length > 0) {
        cert = certsByOwnId[0];
      } else {
        // Strategy 2: Match against certificates.project_id prefix (old/legacy format)
        const minProjectUuid = `${shortId}-0000-0000-0000-000000000000`;
        const maxProjectUuid = `${shortId}-ffff-ffff-ffff-ffffffffffff`;

        const { data: certsByProjectId } = await adminClient
          .from('certificates')
          .select(selectFields)
          .gte('project_id', minProjectUuid)
          .lte('project_id', maxProjectUuid);

        if (certsByProjectId && certsByProjectId.length > 0) {
          cert = certsByProjectId[0];
        }
      }
    } else {
      // Direct full UUID match on certificate ID
      const { data } = await adminClient
        .from('certificates')
        .select(selectFields)
        .eq('id', certId)
        .single();
      cert = data;
    }

    if (!cert) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const responseData = {
      id: cert.id,
      displayId: `KB-${cert.id.slice(0, 8).toUpperCase()}`,
      issuedAt: cert.issued_at,
      projectTitle: cert.projects?.title,
      budget: cert.projects?.budget_bdt,
      companyName: cert.projects?.company_profiles?.legal_name,
      studentName: cert.student_profiles?.users_profiles?.full_name,
      studentId: cert.student_id,
      projectId: cert.projects?.id,
    };

    return NextResponse.json(responseData);
  } catch (err) {
    console.error('[verify-certificate GET] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
