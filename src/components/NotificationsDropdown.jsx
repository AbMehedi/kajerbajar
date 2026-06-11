'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export default function NotificationsDropdown({ unreadCount, setUnreadCount }) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef(null)
  const supabase = useMemo(() => createClient(), [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Real-time listener for new notifications
  useEffect(() => {
    let channel;
    async function setupRealtime() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      channel = supabase.channel(`notifications:user_id=eq.${session.user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`,
          },
          (payload) => {
            setUnreadCount((prev) => prev + 1)
            setNotifications((prev) => [payload.new, ...prev])
          }
        )
        .subscribe()
    }
    setupRealtime()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications?limit=20')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(ids) {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - ids.length))
      }
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length === 0) return

    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  const toggleDropdown = () => {
    const nextState = !isOpen
    setIsOpen(nextState)
    if (nextState) {
      loadNotifications()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={toggleDropdown}
        className="relative h-9 w-9 rounded-full border border-white/10 bg-white/5 text-slate-300 flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-[hsl(var(--kb-brand-500))] text-[10px] font-semibold text-black flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-md border border-white/10 bg-[hsl(var(--kb-surface-800))] shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/20 rounded-t-md">
            <h3 className="text-sm font-semibold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  markAllAsRead()
                }}
                className="text-xs text-[hsl(var(--kb-brand-400))] hover:text-[hsl(var(--kb-brand-300))] hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="text-sm text-slate-400">No notifications yet.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-white/5">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.is_read) markAsRead([notif.id])
                    }}
                    className={`p-4 transition-colors cursor-pointer hover:bg-white/5 ${
                      notif.is_read ? 'opacity-70' : 'bg-[hsl(var(--kb-brand-500))/0.03]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-white">{notif.title}</p>
                        {notif.body && <p className="text-xs text-slate-300 mt-1">{notif.body}</p>}
                        
                        {notif.data?.link && (
                          <Link 
                            href={notif.data.link}
                            className="inline-flex items-center gap-1 mt-2 text-xs text-[hsl(var(--kb-brand-400))] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View details
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        
                        <p className="text-[10px] text-slate-500 mt-2">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="h-2 w-2 rounded-full bg-[hsl(var(--kb-brand-500))] shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}