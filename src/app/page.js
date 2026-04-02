'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="gradient-brand min-h-screen flex flex-col items-center justify-center px-4">
      
      {/* Hero Section */}
      <main className="text-center max-w-3xl">
        <div className="mb-6 inline-flex border border-purple-500/30 bg-purple-500/10 rounded-full px-4 py-1.5 text-purple-300 text-sm tracking-wide">
          ✨ Welcome to Phase 1
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
          কাজের <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">বাজার</span>
        </h1>
        
        <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
          Bangladesh's premier student-startup micro-project marketplace. 
          Complete verified projects, build your portfolio, and earn while you learn.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/register" 
            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
          >
            Create an Account
          </Link>
          <Link 
            href="/login" 
            className="glass hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl transition-all"
          >
            Sign In
          </Link>
        </div>
      </main>

      {/* Feature Cards below the fold */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full mt-24">
        <FeatureCard 
          icon="🎓"
          title="For Students" 
          desc="Build a verified portfolio of real-world work before you even graduate."
        />
        <FeatureCard 
          icon="🏢"
          title="For Startups" 
          desc="Access top university talent for quick, affordable micro-projects."
        />
        <FeatureCard 
          icon="💼"
          title="Secure Escrow" 
          desc="Guaranteed payment upon completion through our secure escrow ledge."
        />
      </div>

    </div>
  )
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass p-6 rounded-2xl border border-white/10 hover:border-purple-500/50 transition-colors">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}
