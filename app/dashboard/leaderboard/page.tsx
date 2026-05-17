
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { FaTrophy, FaCoins, FaUsers, FaMedal } from 'react-icons/fa'

const supabase = createClient()

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [period, setPeriod] = useState<'all' | 'monthly' | 'weekly'>('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard()
  }, [period])

  async function fetchLeaderboard() {
    let query = supabase
      .from('profiles')
      .select('username, total_earned_usd, referral_count, spy_balance')
      .order('total_earned_usd', { ascending: false })
      .limit(100)
    
    const { data } = await query
    setLeaderboard(data || [])
    setIsLoading(false)
  }

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-400'
    if (index === 1) return 'text-gray-400'
    if (index === 2) return 'text-orange-600'
    return 'text-primary-500'
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-3 border-primary-500 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Leaderboard</h1>
        <p className="text-gray-400">Top earners on Supay</p>
      </div>

      {/* Period Selector */}
      <div className="flex gap-3">
        {['all', 'monthly', 'weekly'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p as any)}
            className={`px-6 py-2 rounded-lg capitalize transition ${
              period === p ? 'bg-primary-500 text-white' : 'glass text-gray-400 hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {leaderboard.slice(0, 3).map((user, index) => (
          <motion.div
            key={user.username}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass-card rounded-2xl p-6 text-center ${
              index === 0 ? 'border-yellow-500/50' : index === 1 ? 'border-gray-400/50' : 'border-orange-600/50'
            }`}
          >
            <div className="relative">
              <FaTrophy className={`w-12 h-12 mx-auto mb-3 ${getMedalColor(index)}`} />
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-navy-800 flex items-center justify-center font-bold">
                #{index + 1}
              </div>
            </div>
            <h3 className="text-xl font-bold text-white">{user.username}</h3>
            <p className="text-accent-500 text-2xl font-bold mt-2">${user.total_earned_usd}</p>
            <div className="flex justify-center gap-4 mt-3 text-sm text-gray-400">
              <span className="flex items-center gap-1"><FaUsers /> {user.referral_count}</span>
              <span className="flex items-center gap-1"><FaCoins /> {user.spy_balance} SPY</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Full Leaderboard */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-800 border-b border-primary-500/20">
              <tr>
                <th className="text-left py-4 px-4 text-gray-400">#</th>
                <th className="text-left py-4 px-4 text-gray-400">User</th>
                <th className="text-right py-4 px-4 text-gray-400">Total Earned</th>
                <th className="text-right py-4 px-4 text-gray-400">Referrals</th>
                <th className="text-right py-4 px-4 text-gray-400">SPY Balance</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.slice(3, 100).map((user, index) => (
                <tr key={user.username} className="border-b border-primary-500/10 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FaMedal className={getMedalColor(index + 3)} />
                      #{index + 4}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white">{user.username}</td>
                  <td className="py-3 px-4 text-right text-accent-500">${user.total_earned_usd}</td>
                  <td className="py-3 px-4 text-right text-gray-400">{user.referral_count}</td>
                  <td className="py-3 px-4 text-right text-white">{user.spy_balance} SPY</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
