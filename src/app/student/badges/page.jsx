// src/app/student/badges/page.jsx
import DashboardShell from '@/components/layout/DashboardShell'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { Award, Star, Zap, Crown, CheckCircle2, TrendingUp, Shield } from 'lucide-react'

export const metadata = {
  title: 'Reputation & Badges | KaajerBazar',
}

const TIERS = [
  {
    id: 'rising-star',
    name: 'Rising Star',
    icon: TrendingUp,
    color: 'from-emerald-400 to-teal-500',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    description: 'You are on your way up! You have proven your foundational skills and are delivering consistent results.',
    criteria: [
      '4.5+ Average Client Rating',
      'Total earnings of at least ৳20,000',
      'Account in good standing (no disputes)'
    ],
    benefits: [
      'Rising Star Profile Highlight',
      'Priority ranking in search for beginner jobs',
      'Access to exclusive community events'
    ]
  },
  {
    id: 'top-rated',
    name: 'Top Rated',
    icon: Star,
    color: 'from-blue-400 to-indigo-500',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    description: 'You are among the best! Clients trust you, and your verified skills speak for themselves.',
    criteria: [
      '4.8+ Average Client Rating',
      'Total earnings of at least ৳100,000',
      '90%+ on-time delivery rate'
    ],
    benefits: [
      'Top Rated Profile Badge',
      'Premium 24/7 Support',
      'Exclusive invites to high-paying jobs',
      '5% lower platform fee on all projects'
    ]
  },
  {
    id: 'top-rated-plus',
    name: 'Top Rated Plus',
    icon: Crown,
    color: 'from-amber-400 to-orange-500',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    description: 'The pinnacle of success on KaajerBazar. You are an industry expert and a highly sought-after professional.',
    criteria: [
      '4.9+ Average Client Rating',
      'Total earnings of at least ৳500,000',
      '95%+ on-time delivery rate'
    ],
    benefits: [
      'Top Rated Plus VIP Profile Badge',
      'Dedicated Account Manager',
      '0% platform fee on repeat clients',
      'Early access to enterprise features & beta programs'
    ]
  }
]

export default async function BadgesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users_profiles')
    .select("full_name, role, avatar_url")
    .eq('id', user.id)
    .single()

  // Fetch their current badge
  const { data: userBadge } = await supabase
    .from('student_badges')
    .select('badge_type')
    .eq('student_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  // Map DB ENUM ('rising_talent', 'top_rated', 'top_rated_plus') to UI IDs
  const badgeMap = {
    'rising_talent': 'rising-star',
    'top_rated': 'top-rated',
    'top_rated_plus': 'top-rated-plus'
  }
  const currentTier = userBadge?.badge_type ? badgeMap[userBadge.badge_type] : 'none'

  return (
    <DashboardShell avatarUrl={profile?.avatar_url} role={profile?.role} fullName={profile?.full_name}
      activePath="/student/badges">
      <div className="max-w-5xl mx-auto px-6 py-10">
        
        {/* Header */}
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center justify-center p-3 bg-[hsl(var(--kb-brand-500))/0.1] rounded-2xl mb-4">
            <Award className="w-8 h-8 text-[hsl(var(--kb-brand-400))]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Reputation & Badges</h1>
          <p className="text-slate-400">
            Unlock exclusive perks, lower fees, and priority matching by completing modules and delivering great work to clients.
          </p>
        </div>

        {/* Current Status */}
        <div className="glass border border-white/10 rounded-2xl p-6 mb-12 flex items-center justify-between">
          <div>
            <h3 className="text-slate-400 text-sm font-medium mb-1">Your Current Status</h3>
            {currentTier === 'none' ? (
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-500" />
                <span className="text-lg font-semibold text-white">Unranked</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {currentTier === 'rising-star' && <TrendingUp className="w-5 h-5 text-emerald-400" />}
                {currentTier === 'top-rated' && <Star className="w-5 h-5 text-blue-400" />}
                {currentTier === 'elite' && <Crown className="w-5 h-5 text-amber-400" />}
                <span className="text-lg font-semibold text-white capitalize">
                  {currentTier.replace('-', ' ')}
                </span>
              </div>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm text-slate-400 mb-1">Next Goal</p>
            <p className="text-sm font-medium text-white">
              {currentTier === 'none' ? 'Rising Star' : currentTier === 'rising-star' ? 'Top Rated' : currentTier === 'top-rated' ? 'Top Rated Plus' : 'Max Rank Reached!'}
            </p>
          </div>
        </div>

        {/* Tiers Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {TIERS.map((tier) => {
            const Icon = tier.icon
            const isCurrent = currentTier === tier.id

            return (
              <div 
                key={tier.id}
                className={`relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                  isCurrent ? `${tier.border} ${tier.bg}` : 'border-white/10 glass hover:border-white/20'
                }`}
              >
                {isCurrent && (
                  <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${tier.color}`} />
                )}
                
                <div className="p-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isCurrent ? tier.bg : 'bg-white/5'}`}>
                    <Icon className={`w-6 h-6 ${isCurrent ? tier.text : 'text-slate-400'}`} />
                  </div>
                  
                  <h3 className={`text-xl font-bold mb-2 ${isCurrent ? 'text-white' : 'text-slate-200'}`}>
                    {tier.name}
                  </h3>
                  
                  <p className="text-sm text-slate-400 mb-6 min-h-[60px]">
                    {tier.description}
                  </p>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        Requirements
                      </h4>
                      <ul className="space-y-2">
                        {tier.criteria.map((c, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-slate-600" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Zap className="w-3 h-3 text-amber-400" /> Benefits
                      </h4>
                      <ul className="space-y-2">
                        {tier.benefits.map((b, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                            <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${tier.text}`} />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {isCurrent && (
                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${tier.text}`}>
                        <CheckCircle2 className="w-4 h-4" /> Current Rank
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </DashboardShell>
  )
}
