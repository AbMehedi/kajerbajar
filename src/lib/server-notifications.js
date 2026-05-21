import { createServiceRoleClient } from './supabase-server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

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
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 8px;">
              <h2 style="color: #333;">${title}</h2>
              <p style="color: #555; font-size: 16px;">Hello ${userData.full_name || 'User'},</p>
              <p style="color: #555; font-size: 16px;">${body}</p>
              ${appLink ? `<div style="margin-top: 24px;"><a href="${appLink}" style="background-color: #000; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a></div>` : ''}
              <p style="color: #999; font-size: 12px; margin-top: 32px;">This is an automated notification from Kaajer Bazar.</p>
            </div>
          `
        })
      }
    }
  } catch (err) {
    console.error('[createNotification] Exception:', err)
  }
}