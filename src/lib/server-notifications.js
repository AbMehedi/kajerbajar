import { createServiceRoleClient } from './supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderEmailHtml({ title, body, userName, appLink }) {
  const safeTitle = escapeHtml(title)
  const safeBody = escapeHtml(body)
  const safeName = escapeHtml(userName || 'User')
  const safeLink = appLink ? escapeHtml(appLink) : null

  return `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 8px;">
      <h2 style="color: #333;">${safeTitle}</h2>
      <p style="color: #555; font-size: 16px;">Hello ${safeName},</p>
      <p style="color: #555; font-size: 16px;">${safeBody}</p>
      ${safeLink ? `<div style="margin-top: 24px;"><a href="${safeLink}" style="background-color: #000; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a></div>` : ''}
      <p style="color: #999; font-size: 12px; margin-top: 32px;">This is an automated notification from Kaajer Bazar.</p>
    </div>
  `
}

async function getNotificationPreferences(adminSupabase, userId) {
  // Default behavior: in-app always, email only for important notifications.
  const defaults = {
    email_enabled: true,
    email_important_only: true,
    muted_types: [],
  }

  try {
    const { data, error } = await adminSupabase
      .from('notification_preferences')
      .select('email_enabled, email_important_only, muted_types')
      .eq('user_id', userId)
      .maybeSingle()

    // If the table isn't created yet (or any other DB issue), fall back to defaults.
    if (error || !data) return defaults

    return {
      email_enabled: data.email_enabled ?? defaults.email_enabled,
      email_important_only: data.email_important_only ?? defaults.email_important_only,
      muted_types: Array.isArray(data.muted_types) ? data.muted_types : defaults.muted_types,
    }
  } catch {
    return defaults
  }
}

/**
 * Creates an in-app notification for a user and optionally sends an email if RESEND_API_KEY is configured.
 * Must be called from server-edge API routes using the pure service role client
 * to bypass RLS (since users cannot insert into notifications table).
 * 
 * @param {Object} params
 * @param {string} params.userId - the UUID of the user receiving the notification
 * @param {string} params.type - 'system', 'application', 'message', 'payment', etc.
 * @param {string} params.title - short bold title
 * @param {string} [params.body] - optional detailed message
 * @param {Object} [params.data] - optional JSON payload (e.g., { link: '/workspace/123' })
 * @param {boolean} [params.sendEmail] - optional flag to send an email (default false)
 */
export async function createNotification({ userId, type, title, body = '', data = {}, sendEmail = false }) {
  try {
    const adminSupabase = createServiceRoleClient()
    
    // 1. Insert In-App Notification
    const { error } = await adminSupabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        data
      })
      
    if (error) {
      console.error('[createNotification] Failed to create in-app notification:', error)
    }

    // 2. Fetch User Email to send an actual Email Notification
    if (sendEmail && process.env.RESEND_API_KEY) {
      const { data: userData } = await adminSupabase
        .from('users_profiles')
        .select('email, full_name')
        .eq('id', userId)
        .single()
        
      if (userData && userData.email) {
        // Send email via Resend
        const appLink = data.link ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${data.link}` : null
        
        await resend.emails.send({
          from: 'Kaajer Bazar <onboarding@resend.dev>',
          to: userData.email,
          subject: title,
          html: renderEmailHtml({
            title,
            body,
            userName: userData.full_name,
            appLink,
          }),
        })
      }
    }
  } catch (err) {
    console.error('[createNotification] Exception:', err)
  }
}

/**
 * notifyUser
 *
 * Preferred notification entrypoint.
 * Always writes an in-app notification. Sends email for important notifications by default,
 * with user-level preferences in notification_preferences when available.
 *
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} params.type
 * @param {string} params.title
 * @param {string} [params.body]
 * @param {Object} [params.data]
 * @param {'low'|'normal'|'important'} [params.priority]
 * @param {boolean} [params.sendEmail] - explicit override
 */
export async function notifyUser({ userId, type, title, body = '', data = {}, priority = 'normal', sendEmail }) {
  const adminSupabase = createServiceRoleClient()

  let shouldSendEmail = Boolean(sendEmail)
  if (sendEmail === undefined) {
    shouldSendEmail = false
    if (process.env.RESEND_API_KEY) {
      const prefs = await getNotificationPreferences(adminSupabase, userId)
      const muted = new Set(prefs.muted_types ?? [])

      if (prefs.email_enabled && !muted.has(type)) {
        if (prefs.email_important_only) {
          shouldSendEmail = priority === 'important'
        } else {
          shouldSendEmail = priority !== 'low'
        }
      }
    }
  }

  return createNotification({
    userId,
    type,
    title,
    body,
    data,
    sendEmail: shouldSendEmail,
  })
}
