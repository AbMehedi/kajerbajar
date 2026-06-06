'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Star, Building2, User, GraduationCap, MapPin } from 'lucide-react'

export default function SearchClient({ initialStudents, initialCompanies }) {
  const [activeTab, setActiveTab] = useState('students')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStudents = initialStudents.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredCompanies = initialCompanies.filter(c => 
    c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors placeholder:text-slate-500 shadow-inner"
        />
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/5 rounded-xl max-w-sm border border-white/10">
        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'students' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <User className="w-4 h-4" /> Students
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === 'companies' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4" /> Companies
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'students' && filteredStudents.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No students found matching your search.
          </div>
        )}
        
        {activeTab === 'companies' && filteredCompanies.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            No companies found matching your search.
          </div>
        )}

        {activeTab === 'students' && filteredStudents.map(student => (
          <Link href={`/profile/student/${student.id}`} key={student.id} className="group">
            <div className="h-full glass border border-white/10 rounded-2xl p-5 hover:border-purple-500/40 transition-all hover:bg-white/5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xl overflow-hidden">
                  {student.avatar_url ? (
                    <img src={student.avatar_url} alt={student.full_name} className="w-full h-full object-cover" />
                  ) : (
                    student.full_name?.charAt(0) || 'S'
                  )}
                </div>
                {student.kaajerscore ? (
                  <div className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs font-bold">
                    ★ {student.kaajerscore.toFixed(1)}
                  </div>
                ) : (
                  <div className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 rounded-lg text-slate-400 text-xs">
                    New
                  </div>
                )}
              </div>
              <h3 className="text-white font-bold text-lg mb-1 truncate">{student.full_name}</h3>
              <p className="text-purple-400 text-sm mb-3">@{student.username}</p>
              {student.university && (
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="truncate">{student.university}</span>
                </div>
              )}
              {student.bio && (
                <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed opacity-80">
                  {student.bio}
                </p>
              )}
            </div>
          </Link>
        ))}

        {activeTab === 'companies' && filteredCompanies.map(company => (
          <Link href={`/profile/company/${company.id}`} key={company.id} className="group">
            <div className="h-full glass border border-white/10 rounded-2xl p-5 hover:border-purple-500/40 transition-all hover:bg-white/5 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-xl overflow-hidden">
                  {company.avatar_url ? (
                    <img src={company.avatar_url} alt={company.company_name} className="w-full h-full object-cover" />
                  ) : (
                    company.company_name?.charAt(0) || 'C'
                  )}
                </div>
                {company.rating ? (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-400 text-xs font-bold">
                    <Star className="w-3 h-3 fill-yellow-400" /> {company.rating.toFixed(1)}
                  </div>
                ) : (
                  <div className="px-2.5 py-1 bg-slate-500/10 border border-slate-500/20 rounded-lg text-slate-400 text-xs">
                    No rating
                  </div>
                )}
              </div>
              <h3 className="text-white font-bold text-lg mb-1 truncate">{company.company_name}</h3>
              {company.industry && (
                <div className="flex items-center gap-1.5 text-blue-400 text-xs mb-3">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="truncate">{company.industry}</span>
                </div>
              )}
              {company.description && (
                <p className="text-slate-300 text-xs line-clamp-2 leading-relaxed opacity-80 mb-4">
                  {company.description}
                </p>
              )}
              <div className="mt-auto pt-4 border-t border-white/10 text-slate-500 text-xs">
                {company.reviewCount} {company.reviewCount === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
