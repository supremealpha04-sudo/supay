// app/dashboard/wallet/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { FaWallet, FaArrowDown, FaArrowUp, FaClock, FaLock, FaUnlockAlt, FaCopy, FaCheck } from 'react-icons/fa'
import { depositRules, withdrawalRules } from '@/lib/constants/depositRules'
import Link from 'next/link'
import toast from 'react-hot-toast'

const supabase = createClient()

export default function WalletPage() {
  const { profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'history'>('deposit')
  const [depositMethod, setDepositMethod] = useState<'crypto' | 'bank' | 'card'>('crypto')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState<'usdt' | 'bank'>('usdt')
  const [withdrawAddress, setWithdrawAddress] = useState('')
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', accountName: '' })
  const [transactions, setTransactions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [withdrawableSpy, setWithdrawableSpy] = useState(0)
  const [lockedSpy, setLockedSpy] = useState(0)
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([])

  useEffect(() => {
    if (profile) {
      fetchBalanceBreakdown()
      fetchTransactions()
      fetchPendingDeposits()
    }
  }, [profile])

  async function fetchBalanceBreakdown() {
    const { data } = await supabase
      .from('user_spy_breakdown')
      .select('*')
      .eq('user_id', profile?.id)
      .single()
    
    if (data) {
      const withdrawable = (data.earned_spy || 0) + (data.referral_spy || 0) + (data.staking_rewards_spy || 0)
      setWithdrawableSpy(withdrawable)
      setLockedSpy(data.deposited_spy || 0)
    }
  }

  async function fetchTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setTransactions(data || [])
  }

  async function fetchPendingDeposits() {
    const { data } = await supabase
      .from('deposits')
      .select('*')
      .eq('user_id', profile?.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    
    setPendingDeposits(data || [])
  }

  async function handleDeposit() {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount < depositRules.minimum.USD) {
      toast.error(`Minimum deposit is $${depositRules.minimum.USD}`)
      return
    }
    if (amount > depositRules.maximum.USD) {
      toast.error(`Maximum deposit is $${depositRules.maximum.USD}`)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/deposit/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: depositMethod,
          userId: profile?.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (depositMethod === 'crypto') {
          // Show crypto payment details
          toast.success(`Send ${amount} USDT to: ${data.address}`)
          setCopied(false)
        } else if (depositMethod === 'card') {
          // Redirect to Paystack
          window.location.href = data.authorization_url
        } else {
          // Bank transfer instructions
          toast.success('Bank transfer details sent to your email')
        }
        fetchPendingDeposits()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Deposit failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleWithdraw() {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount < withdrawalRules.minimum.SPY) {
      toast.error(`Minimum withdrawal is ${withdrawalRules.minimum.SPY} SPY ($${withdrawalRules.minimum.USD})`)
      return
    }
    if (amount > withdrawalRules.maximum.SPY) {
      toast.error(`Maximum withdrawal is ${withdrawalRules.maximum.SPY} SPY per day`)
      return
    }
    if (amount > withdrawableSpy) {
      toast.error(`Insufficient withdrawable balance. You have ${withdrawableSpy} SPY available.`)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountSpy: amount,
          method: withdrawMethod,
          address: withdrawMethod === 'usdt' ? withdrawAddress : undefined,
          bankDetails: withdrawMethod === 'bank' ? bankDetails : undefined,
          userId: profile?.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Withdrawal request submitted! Admin will process within 24 hours.')
        setWithdrawAmount('')
        setWithdrawAddress('')
        setBankDetails({ bankName: '', accountNumber: '', accountName: '' })
        fetchBalanceBreakdown()
        fetchTransactions()
        refreshProfile()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Withdrawal failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard!')
  }

  const cryptoAddress = "0x1234567890123456789012345678901234567890"

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Withdrawable SPY</p>
              <p className="text-3xl font-bold text-green-400">{withdrawableSpy.toLocaleString()} SPY</p>
              <p className="text-sm text-gray-500">≈ ${(withdrawableSpy / 100).toFixed(2)} USD</p>
            </div>
            <FaUnlockAlt className="w-10 h-10 text-green-400 opacity-70" />
          </div>
          <p className="text-xs text-gray-500 mt-2">From tasks, referrals, and staking rewards</p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Locked SPY (30 days)</p>
              <p className="text-3xl font-bold text-yellow-400">{lockedSpy.toLocaleString()} SPY</p>
              <p className="text-sm text-gray-500">≈ ${(lockedSpy / 100).toFixed(2)} USD</p>
            </div>
            <FaLock className="w-10 h-10 text-yellow-400 opacity-70" />
          </div>
          <p className="text-xs text-gray-500 mt-2">From deposits - available after 30 days</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-primary-500/20">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`px-6 py-3 rounded-t-lg transition ${activeTab === 'deposit' ? 'bg-primary-500/20 text-accent-500 border-b-2 border-accent-500' : 'text-gray-400 hover:text-white'}`}
        >
          <FaArrowDown className="inline mr-2" /> Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`px-6 py-3 rounded-t-lg transition ${activeTab === 'withdraw' ? 'bg-primary-500/20 text-accent-500 border-b-2 border-accent-500' : 'text-gray-400 hover:text-white'}`}
        >
          <FaArrowUp className="inline mr-2" /> Withdraw
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-3 rounded-t-lg transition ${activeTab === 'history' ? 'bg-primary-500/20 text-accent-500 border-b-2 border-accent-500' : 'text-gray-400 hover:text-white'}`}
        >
          <FaClock className="inline mr-2" /> History
        </button>
      </div>

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Method Selection */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Deposit Method</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'crypto', label: 'USDT (BEP-20)', icon: '₿', min: '$7' },
                { id: 'bank', label: 'Bank Transfer (NGN)', icon: '🏦', min: '₦10,500' },
                { id: 'card', label: 'Credit/Debit Card', icon: '💳', min: '$7' }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setDepositMethod(method.id as any)}
                  className={`p-4 rounded-xl text-center transition ${depositMethod === method.id ? 'bg-primary-500/20 border border-accent-500' : 'glass hover:bg-white/5'}`}
                >
                  <div className="text-2xl mb-2">{method.icon}</div>
                  <div className="text-white font-medium text-sm">{method.label}</div>
                  <div className="text-xs text-gray-500 mt-1">Min: {method.min}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="glass rounded-xl p-6">
            <label className="block text-gray-300 mb-2">Amount to Deposit</label>
            <div className="flex gap-4">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="flex-1 px-4 py-3 bg-navy-800 border border-primary-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleDeposit}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : 'Deposit'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              You will receive: {(parseFloat(depositAmount) || 0) * 100} SPY
              <br />
              <span className="text-yellow-500">Note: Deposited SPY is locked for 30 days for security.</span>
            </p>
          </div>

          {/* Crypto Address (if crypto selected) */}
          {depositMethod === 'crypto' && (
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Send USDT to this address</h3>
              <div className="bg-navy-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-accent-500 break-all">{cryptoAddress}</code>
                  <button onClick={() => copyToClipboard(cryptoAddress)} className="p-2 hover:bg-white/10 rounded-lg">
                    {copied ? <FaCheck className="text-green-400" /> : <FaCopy className="text-gray-400" />}
                  </button>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-500/10 rounded-lg">
                <p className="text-yellow-400 text-sm">⚠️ Important:</p>
                <ul className="text-xs text-gray-400 mt-2 space-y-1">
                  <li>• Send only USDT on BEP-20 network</li>
                  <li>• Minimum deposit: $7 USD</li>
                  <li>• Funds will be credited within 1-5 minutes after confirmation</li>
                  <li>• Deposited SPY is locked for 30 days</li>
                </ul>
              </div>
            </div>
          )}

          {/* Pending Deposits */}
          {pendingDeposits.length > 0 && (
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Pending Deposits</h3>
              {pendingDeposits.map((deposit) => (
                <div key={deposit.id} className="flex justify-between items-center p-3 bg-navy-800 rounded-lg mb-2">
                  <div>
                    <p className="text-white">${deposit.amount_usd} USD</p>
                    <p className="text-xs text-gray-500">{new Date(deposit.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-yellow-400 text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    Processing
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="glass rounded-xl p-6">
            <div className="mb-6">
              <p className="text-gray-400 text-sm">Available to Withdraw</p>
              <p className="text-2xl font-bold text-green-400">{withdrawableSpy.toLocaleString()} SPY</p>
              <p className="text-xs text-gray-500">≈ ${(withdrawableSpy / 100).toFixed(2)} USD</p>
            </div>

            {/* Method Selection */}
            <h3 className="text-lg font-semibold text-white mb-4">Withdrawal Method</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'usdt', label: 'USDT (BEP-20)', fee: '2%', time: '1-4 hours' },
                { id: 'bank', label: 'Bank Transfer (NGN)', fee: '2%', time: '12-24 hours' }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setWithdrawMethod(method.id as any)}
                  className={`p-4 rounded-xl text-center transition ${withdrawMethod === method.id ? 'bg-primary-500/20 border border-accent-500' : 'glass hover:bg-white/5'}`}
                >
                  <div className="text-white font-medium">{method.label}</div>
                  <div className="text-xs text-gray-500 mt-1">Fee: {method.fee} | {method.time}</div>
                </button>
              ))}
            </div>

            {/* Amount Input */}
            <label className="block text-gray-300 mb-2">Amount (SPY)</label>
            <div className="flex gap-4 mb-4">
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="500 minimum"
                className="flex-1 px-4 py-3 bg-navy-800 border border-primary-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={() => setWithdrawAmount(withdrawableSpy.toString())}
                className="px-4 py-3 glass rounded-xl text-sm"
              >
                Max
              </button>
            </div>

            {/* Fee Display */}
            {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
              <div className="bg-navy-800 rounded-xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Amount</span>
                  <span className="text-white">{parseFloat(withdrawAmount).toLocaleString()} SPY</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Fee (2%)</span>
                  <span className="text-yellow-400">{Math.max(Math.ceil(parseFloat(withdrawAmount) * 0.02), 10)} SPY</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-primary-500/20">
                  <span className="text-white">You Receive</span>
                  <span className="text-green-400">{parseFloat(withdrawAmount) - Math.max(Math.ceil(parseFloat(withdrawAmount) * 0.02), 10)} SPY</span>
                </div>
              </div>
            )}

            {/* Wallet Address (USDT) */}
            {withdrawMethod === 'usdt' && (
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">BEP-20 Wallet Address</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-navy-800 border border-primary-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />
              </div>
            )}

            {/* Bank Details */}
            {withdrawMethod === 'bank' && (
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-gray-300 mb-2">Bank Name</label>
                  <select
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-800 border border-primary-500/30 rounded-xl text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Select Bank</option>
                    <option value="GTBank">GTBank</option>
                    <option value="Access Bank">Access Bank</option>
                    <option value="First Bank">First Bank</option>
                    <option value="UBA">UBA</option>
                    <option value="Zenith Bank">Zenith Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    placeholder="10-digit account number"
                    className="w-full px-4 py-3 bg-navy-800 border border-primary-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-2">Account Name</label>
                  <input
                    type="text"
                    value={bankDetails.accountName}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                    placeholder="Full name on account"
                    className="w-full px-4 py-3 bg-navy-800 border border-primary-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleWithdraw}
              disabled={isLoading || withdrawableSpy < withdrawalRules.minimum.SPY}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Request Withdrawal'}
            </button>

            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg">
              <p className="text-blue-400 text-sm">ℹ️ Withdrawal Processing:</p>
              <ul className="text-xs text-gray-400 mt-2 space-y-1">
                <li>• Minimum: {withdrawalRules.minimum.SPY} SPY (${withdrawalRules.minimum.USD})</li>
                <li>• Maximum: {withdrawalRules.maximum.SPY} SPY per day</li>
                <li>• Processing time: {withdrawalRules.processing.time}</li>
                <li>• Fee: {withdrawalRules.fees.percentage}% (min {withdrawalRules.fees.minimumSpy} SPY)</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Transaction History</h3>
          {transactions.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
                  <div>
                    <p className="text-white capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.amount_spy > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount_spy > 0 ? '+' : ''}{tx.amount_spy} SPY
                    </p>
                    <p className="text-xs text-gray-500">Balance: {tx.balance_after} SPY</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </motion.div>
      )}
    </div>
  )
}
