'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Send, MessageSquare, Loader2, User } from 'lucide-react'

export default function WorkspaceChat({ projectId, currentUserProfile }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)
  
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ), [])

  // 1. Fetch initial messages
  useEffect(() => {
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/projects/${projectId}/chat`)
        const data = await res.json()
        if (res.ok) {
          setMessages(data.messages)
        } else {
          setError('Failed to load messages.')
        }
      } catch (err) {
        setError('Network error loading messages.')
      } finally {
        setLoading(false)
        scrollToBottom()
      }
    }
    fetchMessages()
  }, [projectId])

  // 2. Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`chat_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `project_id=eq.${projectId}`,
        },
        async (payload) => {
          // If we are the sender, we already added it optimistically
          if (payload.new.sender_id === currentUserProfile.id) return
          
          // Need to fetch sender profile info since the raw payload only has sender_id
          const { data: profile } = await supabase
            .from('users_profiles')
            .select('full_name, role')
            .eq('id', payload.new.sender_id)
            .single()

          const newMsg = {
            ...payload.new,
            sender: profile || { full_name: 'Unknown', role: 'unknown' }
          }
          
          setMessages((prev) => [...prev, newMsg])
          scrollToBottom()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId, supabase, currentUserProfile.id])

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // 3. Send message
  async function sendMessage(e) {
    e.preventDefault()
    if (!input.trim() || sending) return

    const tempId = `temp-${Date.now()}`
    const newMessage = {
      id: tempId,
      content: input.trim(),
      created_at: new Date().toISOString(),
      sender_id: currentUserProfile.id,
      sender: {
        full_name: currentUserProfile.full_name,
        role: currentUserProfile.role
      }
    }

    // Optimistic UI update
    setMessages((prev) => [...prev, newMessage])
    setInput('')
    setSending(true)
    scrollToBottom()

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.content }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error)
      }
      
      // Swap temp ID with real ID
      setMessages((prev) => 
        prev.map((msg) => msg.id === tempId ? data.message : msg)
      )
    } catch (err) {
      // Revert optimistic update on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
      setError('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="glass flex flex-col rounded-2xl border border-white/10 overflow-hidden h-[500px]">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-4 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
          <MessageSquare className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-white font-semibold">Workspace Chat</h2>
          <p className="text-slate-400 text-xs">Real-time collaboration</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUserProfile.id
            const showAvatar = index === 0 || messages[index - 1].sender_id !== msg.sender_id
            
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${
                  !showAvatar ? 'invisible' :
                  isMe ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-300'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && (
                    <span className="text-[10px] text-slate-500 mb-1 px-1">
                      {isMe ? 'You' : msg.sender?.full_name}
                    </span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white/10 text-slate-200 border border-white/5 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-red-500/10 border-t border-red-500/20 px-4 py-2">
          <p className="text-red-400 text-xs">⚠️ {error}</p>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-black/20 border-t border-white/10 shrink-0">
        <form onSubmit={sendMessage} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-white/5 border border-white/15 rounded-full pl-4 pr-12 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors text-white"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  )
}
