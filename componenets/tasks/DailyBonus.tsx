// components/tasks/DailyBonus.tsx
'use client'

import { Gift, Fire, Coins } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface DailyBonusProps {
  streak: number
  bonusAmount: number
  isCompleted: boolean
  isPremium: boolean
  onClaim: () => void
}

export function DailyBonus({ streak, bonusAmount, isCompleted, isPremium, onClaim }: DailyBonusProps) {
  const maxStreak = 7
  const progress = (streak / maxStreak) * 100

  return (
    <div className={`glass rounded-xl p-5 transition-all ${!isCompleted && streak > 0 ? 'border-accent-500/50' : ''}`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-500 to-orange-600 flex items-center justify-center">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Daily Bonus</h3>
            <p className="text-sm text-gray-400">
              Complete all tasks to earn {bonusAmount} SPY
              {isPremium && <span className="text-accent-500 ml-1">(2x Premium)</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Fire className="w-5 h-5 text-accent-500" />
            <span className="text-white font-medium">{streak} day streak</span>
          </div>
          <Button
            onClick={onClaim}
            disabled={isCompleted}
            variant={isCompleted ? 'outline' : 'primary'}
          >
            {isCompleted ? 'Claimed ✓' : 'Claim Bonus'}
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Day {streak} of {maxStreak}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-500 to-orange-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {maxStreak - streak} more days for bonus multiplier!
        </p>
      </div>
    </div>
  )
}
