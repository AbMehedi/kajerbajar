// src/app/api/projects/[id]/certificate/route.js
// GET /api/projects/[id]/certificate
//
// Generates a PDF certificate of completion for the assigned student.
// Guards: project must be 'completed', caller must be the selected student.
// Returns: application/pdf as a file download (no storage — generated on-the-fly).

import { requireAuthAndRole } from '@/lib/api'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { NextResponse } from 'next/server'

// ── Colour palette (pdf-lib rgb() takes 0–1 range, NO 4th alpha arg) ─────────
const C = {
  navy:      rgb(0.055, 0.071, 0.118),   // #0E1230
  panelBg:   rgb(0.09,  0.11,  0.18),   // slightly lighter navy for panels
  gold:      rgb(0.960, 0.773, 0.263),   // #F5C543
  goldDim:   rgb(0.55,  0.44,  0.14),   // dimmed gold for subtle borders
  white:     rgb(1,     1,     1),
  lightGray: rgb(0.75,  0.78,  0.85),
  midGray:   rgb(0.45,  0.48,  0.56),
  green:     rgb(0.22,  0.78,  0.44),   // #38C771
}

// ── Helper: draw a horizontal rule ───────────────────────────────────────────
function hRule(page, y, { x, width, color = C.gold, thickness = 0.8 } = {}) {
  const rx = x ?? 60
  const rw = width ?? page.getWidth() - rx * 2
  page.drawLine({ start: { x: rx, y }, end: { x: rx + rw, y }, color, thickness })
}

// ── Helper: centered text ────────────────────────────────────────────────────
function centeredText(page, text, { font, size, color, y }) {
  const tw = font.widthOfTextAtSize(text, size)
  const cx = (page.getWidth() - tw) / 2
  page.drawText(text, { x: cx, y, size, font, color })
}

export async function GET(request, { params }) {
  try {
    const auth = await requireAuthAndRole({ allowedRoles: ['student'] })
    if (auth.errorResponse) return auth.errorResponse

    const { user } = auth
    const { id: projectId } = await params
    const adminClient = await createAdminSupabaseClient()

    // 1. Verify the student was selected for this project
    const { data: app } = await adminClient
      .from('applications')
      .select('student_id')
      .eq('project_id', projectId)
      .eq('student_id', user.id)
      .eq('status', 'selected')
      .single()

    if (!app) {
      return NextResponse.json({ error: 'Access denied — not assigned to this project' }, { status: 403 })
    }

    // 2. Fetch project data (projects table has created_at, NOT updated_at)
    const { data: project, error: projectError } = await adminClient
      .from('projects')
      .select('id, title, budget_bdt, status, created_at, company_profiles(legal_name)')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('[certificate GET] Project query error:', projectError)
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.status !== 'completed') {
      return NextResponse.json({ error: 'Certificate only available for completed projects' }, { status: 400 })
    }

    // 3. Fetch student full name
    const { data: studentProfile } = await adminClient
      .from('users_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const studentName   = studentProfile?.full_name ?? 'Student'
    const companyName   = project.company_profiles?.legal_name ?? 'Company'
    const projectTitle  = project.title ?? 'Untitled Project'
    const COMMISSION    = 0.10
    const payout        = Math.round((project.budget_bdt ?? 0) * (1 - COMMISSION))
    const completionDate = new Date(project.created_at).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    const certId = `KB-${projectId.slice(0, 8).toUpperCase()}`

    // ── 4. Build the PDF ──────────────────────────────────────────────────────
    const pdfDoc = await PDFDocument.create()

    // A4 landscape: 842 × 595 pt
    const page = pdfDoc.addPage([842, 595])
    const W = page.getWidth()
    const H = page.getHeight()

    const fontBold    = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

    // ── Background ───────────────────────────────────────────────────────────
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.navy })

    // Outer gold border (no fill override needed — bg already drawn)
    const bm = 18
    page.drawLine({ start: { x: bm,     y: bm     }, end: { x: W - bm, y: bm     }, color: C.gold, thickness: 2 })
    page.drawLine({ start: { x: bm,     y: H - bm }, end: { x: W - bm, y: H - bm }, color: C.gold, thickness: 2 })
    page.drawLine({ start: { x: bm,     y: bm     }, end: { x: bm,     y: H - bm }, color: C.gold, thickness: 2 })
    page.drawLine({ start: { x: W - bm, y: bm     }, end: { x: W - bm, y: H - bm }, color: C.gold, thickness: 2 })

    // Inner thin border
    const bm2 = 27
    page.drawLine({ start: { x: bm2,     y: bm2     }, end: { x: W - bm2, y: bm2     }, color: C.goldDim, thickness: 0.5 })
    page.drawLine({ start: { x: bm2,     y: H - bm2 }, end: { x: W - bm2, y: H - bm2 }, color: C.goldDim, thickness: 0.5 })
    page.drawLine({ start: { x: bm2,     y: bm2     }, end: { x: bm2,     y: H - bm2 }, color: C.goldDim, thickness: 0.5 })
    page.drawLine({ start: { x: W - bm2, y: bm2     }, end: { x: W - bm2, y: H - bm2 }, color: C.goldDim, thickness: 0.5 })

    // Corner accent lines
    const accentLen = 30
    const corners = [
      // top-left
      [{ x: bm, y: H - bm }, { x: bm + accentLen, y: H - bm }],
      [{ x: bm, y: H - bm }, { x: bm, y: H - bm - accentLen }],
      // top-right
      [{ x: W - bm, y: H - bm }, { x: W - bm - accentLen, y: H - bm }],
      [{ x: W - bm, y: H - bm }, { x: W - bm, y: H - bm - accentLen }],
      // bottom-left
      [{ x: bm, y: bm }, { x: bm + accentLen, y: bm }],
      [{ x: bm, y: bm }, { x: bm, y: bm + accentLen }],
      // bottom-right
      [{ x: W - bm, y: bm }, { x: W - bm - accentLen, y: bm }],
      [{ x: W - bm, y: bm }, { x: W - bm, y: bm + accentLen }],
    ]
    for (const [start, end] of corners) {
      page.drawLine({ start, end, color: C.gold, thickness: 2.5 })
    }

    // ── Header brand ─────────────────────────────────────────────────────────
    const headerY = H - 68
    centeredText(page, 'KAAJERBAZAR', { font: fontBold, size: 13, color: C.gold, y: headerY })
    centeredText(page, 'kaajerbazar.com  |  Student Freelance Marketplace  |  Bangladesh', {
      font: fontOblique, size: 8, color: C.midGray, y: headerY - 16,
    })

    hRule(page, H - 96, { color: C.gold, thickness: 1 })

    // ── Main title ───────────────────────────────────────────────────────────
    centeredText(page, 'CERTIFICATE OF COMPLETION', { font: fontBold, size: 22, color: C.white, y: H - 135 })
    hRule(page, H - 148, { x: W / 2 - 110, width: 220, color: C.gold, thickness: 0.6 })

    centeredText(page, 'This is to certify that', { font: fontOblique, size: 11, color: C.lightGray, y: H - 175 })

    // ── Student name ─────────────────────────────────────────────────────────
    centeredText(page, studentName, { font: fontBold, size: 30, color: C.gold, y: H - 215 })
    hRule(page, H - 228, { x: W / 2 - 130, width: 260, color: C.gold, thickness: 0.5 })

    // ── Body ─────────────────────────────────────────────────────────────────
    centeredText(page, 'has successfully completed the project', { font: fontOblique, size: 11, color: C.lightGray, y: H - 254 })

    const titleDisplay = projectTitle.length > 55 ? projectTitle.slice(0, 52) + '…' : projectTitle
    centeredText(page, `"${titleDisplay}"`, { font: fontBold, size: 16, color: C.white, y: H - 283 })
    centeredText(page, `commissioned by  ${companyName}`, { font: fontRegular, size: 11, color: C.lightGray, y: H - 308 })

    // ── Stats row (3 boxes) ───────────────────────────────────────────────────
    const statsY    = H - 355
    const boxW      = 160
    const boxGap    = 30
    const totalW    = 3 * boxW + 2 * boxGap
    const startX    = (W - totalW) / 2

    const stats = [
      { label: 'AMOUNT EARNED',  value: `${payout.toLocaleString()} BDT`, color: C.green },
      { label: 'COMPLETED ON',   value: completionDate,                     color: C.white },
      { label: 'CERTIFICATE ID', value: certId,                             color: C.midGray },
    ]

    stats.forEach(({ label, value, color }, i) => {
      const bx = startX + i * (boxW + boxGap)
      // panel background
      page.drawRectangle({ x: bx, y: statsY - 28, width: boxW, height: 52, color: C.panelBg })
      // panel border
      page.drawLine({ start: { x: bx,       y: statsY - 28 }, end: { x: bx + boxW, y: statsY - 28 }, color: C.goldDim, thickness: 0.5 })
      page.drawLine({ start: { x: bx,       y: statsY + 24 }, end: { x: bx + boxW, y: statsY + 24 }, color: C.goldDim, thickness: 0.5 })
      page.drawLine({ start: { x: bx,       y: statsY - 28 }, end: { x: bx,        y: statsY + 24 }, color: C.goldDim, thickness: 0.5 })
      page.drawLine({ start: { x: bx + boxW, y: statsY - 28 }, end: { x: bx + boxW, y: statsY + 24 }, color: C.goldDim, thickness: 0.5 })

      // label (centered)
      const lw = fontBold.widthOfTextAtSize(label, 7)
      page.drawText(label, { x: bx + (boxW - lw) / 2, y: statsY + 12, size: 7, font: fontBold, color: C.midGray })
      // value (centered)
      const displayValue = value.length > 22 ? value.slice(0, 20) + '…' : value
      const vw = fontBold.widthOfTextAtSize(displayValue, 10)
      page.drawText(displayValue, { x: bx + (boxW - vw) / 2, y: statsY - 8, size: 10, font: fontBold, color })
    })

    // ── Footer ───────────────────────────────────────────────────────────────
    hRule(page, 58, { color: C.gold, thickness: 0.8 })
    centeredText(page, `Certificate ID: ${certId}  |  Verify at kaajerbazar.com  |  KaajerBazar — Building Trust in Bangladesh's Student Economy`, {
      font: fontRegular, size: 7.5, color: C.midGray, y: 42,
    })

    // ── Serialize ─────────────────────────────────────────────────────────────
    const pdfBytes = await pdfDoc.save()
    const safeTitle = projectTitle.replace(/[^a-z0-9]/gi, '_').slice(0, 40)

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="KaajerBazar_Certificate_${safeTitle}.pdf"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (err) {
    console.error('[certificate GET] Unexpected error:', err)
    return NextResponse.json({ error: 'Failed to generate certificate' }, { status: 500 })
  }
}
