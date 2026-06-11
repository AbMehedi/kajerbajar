'use client'

import { CheckCircle2, Circle, Clock, Check } from 'lucide-react'

export default function StatusTimeline({ projectStatus, escrowStatus }) {
  // Determine states based on project data
  const isMatched = true // If they are in the workspace, they are matched
  const isFunded = ['held', 'released', 'refunded'].includes(escrowStatus)
  const isCompleted = projectStatus === 'completed'
  const isInProgress = projectStatus === 'in_progress' || isCompleted

  const steps = [
    {
      id: 1,
      title: 'Matched',
      description: 'Student selected',
      isCompleted: isMatched,
      isCurrent: !isFunded,
    },
    {
      id: 2,
      title: 'Funded',
      description: 'Escrow deposited',
      isCompleted: isFunded,
      isCurrent: isFunded && !isInProgress,
    },
    {
      id: 3,
      title: 'In Progress',
      description: 'Working & Submitting',
      isCompleted: isCompleted,
      isCurrent: isFunded && isInProgress && !isCompleted,
    },
    {
      id: 4,
      title: 'Completed',
      description: 'Approved & Released',
      isCompleted: isCompleted,
      isCurrent: isCompleted,
    },
  ]

  return (
    <div className="glass rounded-xl p-6 border border-white/10 w-full overflow-hidden mb-6">
      <h3 className="text-white font-semibold mb-6">Project Timeline</h3>
      
      <div className="relative">
        {/* Background track */}
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-white/10 hidden sm:block" />
        
        {/* Progress track */}
        <div 
          className="absolute top-4 left-4 h-0.5 bg-[hsl(var(--kb-brand-500))] hidden sm:block transition-all duration-500 ease-out" 
          style={{ 
            width: isCompleted ? 'calc(100% - 2rem)' : 
                   isInProgress ? 'calc(66% - 1rem)' : 
                   isFunded ? 'calc(33%)' : '0%' 
          }} 
        />

        <div className="flex flex-col sm:flex-row justify-between gap-6 relative">
          {steps.map((step) => (
            <div key={step.id} className="flex sm:flex-col items-center sm:items-center gap-4 sm:gap-2 flex-1 relative z-10">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors duration-300 ${
                step.isCompleted 
                  ? 'bg-[hsl(var(--kb-brand-500))] border-[hsl(var(--kb-brand-500))] text-black' 
                  : step.isCurrent
                    ? 'bg-[hsl(var(--kb-surface-800))] border-[hsl(var(--kb-brand-500))] text-[hsl(var(--kb-brand-400))]'
                    : 'bg-[hsl(var(--kb-surface-800))] border-white/20 text-slate-500'
              }`}>
                {step.isCompleted ? (
                  <Check className="w-4 h-4 font-bold" />
                ) : step.isCurrent ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-medium">{step.id}</span>
                )}
              </div>
              <div className="sm:text-center mt-1 sm:mt-2">
                <p className={`text-sm font-medium ${step.isCompleted || step.isCurrent ? 'text-white' : 'text-slate-400'}`}>
                  {step.title}
                </p>
                <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
