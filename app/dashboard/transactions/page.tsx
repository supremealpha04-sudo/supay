'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { FaFilter, FaDownload, FaSearch } from 'react-icons/fa'

const supabase = createClient()

export default function TransactionsPage() {
  const { profile } = useAuth()
  const [transactions, setTransactions] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchTransactions()
    }
  }, [profile, filter])

  async function fetchTransactions() {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false })
    
    if (filter !== 'all') {
      query = query.eq('type', filter)
    }
    
    const { data } = await query
    setTransactions(data || [])
    setIsLoading(false)
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Amount (SPY)', 'Balance Before', 'Balance After']
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.type,
      t.amount_spy,
      t.balance_before,
      t.balance_after
    ])
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `supay_transactions_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTypeColor = (type: string) => {
    if (type.includes('reward') || type === 'deposit') return 'text-green-400'
    if (type === 'withdrawal') return 'text-red-400'
    if (type === 'premium_payment') return 'text-yellow-400'
    return 'text-blue-400'
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
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Transaction History</h1>
            <p className="text-gray-400">View all your SPY transactions</p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 glass rounded-lg flex items-center gap-2"
          >
            <FaDownload /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {['all', 'deposit', 'withdrawal', 'ad_reward', 'task_reward', 'referral_bonus', 'staking_reward', 'premium_payment'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg capitalize transition ${
              filter === type ? 'bg-primary-500 text-white' : 'glass text-gray-400 hover:text-white'
            }`}
          >
            {type.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search transactions..."
          className="w-full pl-10 pr-4 py-3 bg-navy-800 border border-primary-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
        />
      </div>

      {/* Transactions Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-800 border-b border-primary-500/20">
              <tr>
                <th className="text-left py-4 px-4 text-gray-400">Date</th>
                <th className="text-left py-4 px-4 text-gray-400">Type</th>
                <th className="text-right py-4 px-4 text-gray-400">Amount</th>
                <th className="text-right py-4 px-4 text-gray-400">Balance</th>
               </tr>
            </thead>
            <tbody>
              {transactions.filter(t => 
                t.type.includes(search) || t.amount_spy.toString().includes(search)
              ).map((tx) => (
                <tr key={tx.id} className="border-b border-primary-500/10 hover:bg-white/5">
                  <td className="py-3 px-4 text-gray-400">{new Date(tx.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`capitalize ${getTypeColor(tx.type)}`}>
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-semibold ${tx.amount_spy > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy} SPY
                  </td>
                  <td className="py-3 px-4 text-right text-white">{tx.balance_after} SPY</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No transactions found</p>
          </div>
        )}
      </div>
    </div>
  )
}
