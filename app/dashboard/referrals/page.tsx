'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { FaUsers, FaLink, FaCopy, FaCheck, FaTrophy, FaChartLine, FaCoins } from 'react-icons/fa'
import toast from 'react-hot-toast'

const supabase = createClient()

export default function ReferralsPage() {
  const { profile } = useAuth()
  const [referralLink, setReferralLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarned: 0,
    pendingEarnings: 0,
    level1Count: 0,
    level2Count: 0,
    level3Count: 0
  })
  const [referralHistory, setReferralHistory] = useState<any[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    if (profile) {
      setReferralLink(`${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${profile.referral_code}`)
      fetchReferralStats()
      fetchReferralHistory()
      fetchLeaderboard()
    }
  }, [profile])

  async function fetchReferralStats() {
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', profile?.id)
    
    const level1 = referrals?.filter(r => r.level === 1) || []
    const level2 = referrals?.filter(r => r.level === 2) || []
    const level3 = referrals?.filter(r => r.level === 3) || []
    
    const totalEarned = referrals?.reduce((sum, r) => sum + (r.bonus_spy || 0), 0) || 0
    
    setReferralStats({
      totalReferrals: referrals?.length || 0,
      totalEarned,
      pendingEarnings: 0,
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length
    })
  }

  async function fetchReferralHistory() {
    const { data } = await supabase
      .from('referrals')
      .select('*, referred:referred_id(username, created_at)')
      .eq('referrer_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setReferralHistory(data || [])
  }

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('profiles')
      .select('username, referral_count, referral_earnings')
      .order('referral_count', { ascending: false })
      .limit(10)
    
    setLeaderboard(data || [])
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Referral link copied!')
  }

  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2">Refer & Earn</h1>
        <p className="text-gray-400">Invite friends to join Supay and earn 10% of their earnings forever!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FaUsers className="w-8 h-8 text-accent-500" />
            <div>
              <p className="text-gray-400 text-sm">Total Referrals</p>
              <p className="text-2xl font-bold text-white">{referralStats.totalReferrals}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FaCoins className="w-8 h-8 text-accent-500" />
            <div>
              <p className="text-gray-400 text-sm">Total Earned</p>
              <p className="text-2xl font-bold text-white">{referralStats.totalEarned} SPY</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FaChartLine className="w-8 h-8 text-accent-500" />
            <div>
              <p className="text-gray-400 text-sm">Level 1</p>
              <p className="text-2xl font-bold text-white">{referralStats.level1Count}</p>
            </div>
          </div>
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-3">
            <FaTrophy className="w-8 h-8 text-accent-500" />
            <div>
              <p className="text-gray-400 text-sm">Level 2+3</p>
              <p className="text-2xl font-bold text-white">{referralStats.level2Count + referralStats.level3Count}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link Card */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Your Referral Link</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-4 py-3 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
          />
          <button
            onClick={copyToClipboard}
            className="px-6 py-3 bg-primary-500 rounded-xl hover:bg-primary-600 transition"
          >
            {copied ? <FaCheck className="w-5 h-5" /> : <FaCopy className="w-5 h-5" />}
          </button>
        </div>
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
          <p className="text-blue-400 text-sm">💡 How it works:</p>
          <ul className="text-xs text-gray-400 mt-2 space-y-1">
            <li>• Share your unique link with friends</li>
            <li>• You earn 10% of everything they earn (lifetime)</li>
            <li>• Level 2: 5% of their referrals' earnings</li>
            <li>• Level 3: 2.5% of third-level referrals</li>
          </ul>
        </div>
      </div>

      {/* Referral History */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Referral History</h3>
        {referralHistory.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {referralHistory.map((ref) => (
              <div key={ref.id} className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
                <div>
                  <p className="text-white">{ref.referred?.username || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500">Level {ref.level} • {new Date(ref.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-accent-500 font-semibold">+{ref.bonus_spy} SPY</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No referrals yet. Share your link to start earning!</p>
        )}
      </div>

      {/* Leaderboard */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FaTrophy className="text-accent-500" /> Top Referrers
        </h3>
        <div className="space-y-2">
          {leaderboard.map((user, index) => (
            <div key={user.username} className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-primary-500'
                }`}>
                  {index + 1}
                </div>
                <span className="text-white">{user.username}</span>
              </div>
              <div className="text-right">
                <p className="text-accent-500">{user.referral_count} referrals</p>
                <p className="text-xs text-gray-500">{user.referral_earnings} SPY earned</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
