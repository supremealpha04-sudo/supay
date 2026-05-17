'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { FaGem, FaCoins, FaClock, FaArrowUp, FaExchangeAlt, FaShieldAlt } from 'react-icons/fa'
import { nftTiers, upgradeCosts } from '@/lib/constants/nftTiers'
import Link from 'next/link'
import toast from 'react-hot-toast'

const supabase = createClient()

export default function NFTPage() {
  const { profile, refreshProfile } = useAuth()
  const [userNFT, setUserNFT] = useState<any>(null)
  const [availableNFTs, setAvailableNFTs] = useState<any[]>([])
  const [isStaking, setIsStaking] = useState(false)
  const [stakingRewards, setStakingRewards] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchUserNFT()
      fetchAvailableNFTs()
      fetchStakingRewards()
    }
  }, [profile])

  async function fetchUserNFT() {
    const { data } = await supabase
      .from('user_nfts')
      .select('*, nft_badges(*)')
      .eq('user_id', profile?.id)
      .single()
    
    setUserNFT(data)
  }

  async function fetchAvailableNFTs() {
    const { data: allNFTs } = await supabase
      .from('nft_badges')
      .select('*')
      .eq('is_active', true)
      .order('purchase_price_spy', { ascending: true })
    
    const { data: userNFTs } = await supabase
      .from('user_nfts')
      .select('badge_id')
      .eq('user_id', profile?.id)
    
    const ownedBadgeIds = new Set(userNFTs?.map(n => n.badge_id) || [])
    const available = allNFTs?.filter(n => !ownedBadgeIds.has(n.id)) || []
    setAvailableNFTs(available)
    setIsLoading(false)
  }

  async function fetchStakingRewards() {
    if (userNFT?.is_staked) {
      const response = await fetch('/api/nft/staking-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userNftId: userNFT.id })
      })
      const data = await response.json()
      setStakingRewards(data.rewards || 0)
    }
  }

  async function purchaseNFT(badgeId: number, priceSpy: number) {
    if ((profile?.spy_balance || 0) < priceSpy) {
      toast.error(`Insufficient SPY. Need ${priceSpy} SPY. Deposit $${priceSpy / 100} to continue.`)
      return
    }

    try {
      const response = await fetch('/api/nft/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId, userId: profile?.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`🎉 ${data.tier} NFT purchased! Stake it to earn daily rewards.`)
        await fetchUserNFT()
        await fetchAvailableNFTs()
        await refreshProfile()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Purchase failed')
    }
  }

  async function stakeNFT() {
    if (!userNFT) return

    try {
      const response = await fetch('/api/nft/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userNftId: userNFT.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('NFT staked! You will earn daily rewards.')
        await fetchUserNFT()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to stake NFT')
    }
  }

  async function unstakeNFT() {
    if (!userNFT) return

    try {
      const response = await fetch('/api/nft/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userNftId: userNFT.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Unstaked! Claimed ${data.rewardsClaimed} SPY rewards.`)
        await fetchUserNFT()
        await refreshProfile()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to unstake NFT')
    }
  }

  async function claimRewards() {
    try {
      const response = await fetch('/api/nft/claim-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userNftId: userNFT.id })
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(`Claimed ${data.rewards} SPY rewards!`)
        await fetchStakingRewards()
        await refreshProfile()
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      toast.error('Failed to claim rewards')
    }
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
        <h1 className="text-2xl font-bold text-white mb-2">NFT Badges</h1>
        <p className="text-gray-400">Purchase NFT badges to boost your earnings and stake for passive income.</p>
      </div>

      {/* Current NFT Card */}
      {userNFT ? (
        <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-primary-500/20 to-accent-500/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500 to-orange-600 flex items-center justify-center">
                <FaGem className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{userNFT.nft_badges?.tier} NFT</h2>
                <p className="text-gray-400">Purchase Price: {userNFT.purchase_price_spy} SPY</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1 text-sm">
                    <FaCoins className="text-accent-500" />
                    <span>{userNFT.nft_badges?.staking_reward_daily} SPY/day</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <FaArrowUp className="text-green-400" />
                    <span>{nftTiers[userNFT.nft_badges?.tier].benefits.earningMultiplier}x earnings</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {!userNFT.is_staked ? (
                <button
                  onClick={stakeNFT}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl font-semibold"
                >
                  Stake NFT
                </button>
              ) : (
                <>
                  <button
                    onClick={claimRewards}
                    className="px-6 py-3 bg-green-600 rounded-xl font-semibold"
                  >
                    Claim {stakingRewards} SPY
                  </button>
                  <button
                    onClick={unstakeNFT}
                    className="px-6 py-3 glass rounded-xl font-semibold"
                  >
                    Unstake
                  </button>
                </>
              )}
            </div>
          </div>
          {userNFT.is_staked && (
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
              <p className="text-green-400 text-sm flex items-center gap-2">
                <FaShieldAlt /> NFT is staked! Earning {userNFT.nft_badges?.staking_reward_daily} SPY daily.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass rounded-xl p-8 text-center">
          <FaGem className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No NFT Badge Yet</h3>
          <p className="text-gray-400 mb-4">Purchase an NFT badge to boost your earnings by up to 3x!</p>
          <Link href="/dashboard/premium" className="px-6 py-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg">
            Become Premium First
          </Link>
        </div>
      )}

      {/* Available NFTs for Upgrade/Purchase */}
      {availableNFTs.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Available NFTs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableNFTs.map((nft) => (
              <motion.div
                key={nft.id}
                whileHover={{ scale: 1.02 }}
                className="glass rounded-xl p-5"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-bold text-white">{nft.tier}</h3>
                  <div className="px-2 py-1 bg-accent-500/20 rounded-lg text-xs text-accent-500">
                    {nft.max_supply - nft.minted_count} left
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Price</span>
                    <span className="text-white">{nft.purchase_price_spy} SPY</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Daily Staking</span>
                    <span className="text-accent-500">{nft.staking_reward_daily} SPY</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Premium Required</span>
                    <span className="text-white">{nft.premium_months_required} months</span>
                  </div>
                </div>
                <button
                  onClick={() => purchaseNFT(nft.id, nft.purchase_price_spy)}
                  disabled={(profile?.spy_balance || 0) < nft.purchase_price_spy}
                  className={`w-full py-2 rounded-lg transition ${
                    (profile?.spy_balance || 0) >= nft.purchase_price_spy
                      ? 'bg-primary-500 hover:bg-primary-600 text-white'
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Purchase
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Options (if user has NFT) */}
      {userNFT && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Upgrade Your NFT</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(upgradeCosts).map(([key, value]) => {
              const currentTier = userNFT.nft_badges?.tier.toLowerCase()
              const targetTier = key.split('_to_')[1]
              if (currentTier !== key.split('_to_')[0]) return null
              
              return (
                <div key={key} className="bg-navy-800 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-white font-medium">Upgrade to {targetTier}</span>
                    <span className="text-accent-500">{value.cost_spy.toLocaleString()} SPY</span>
                  </div>
                  <div className="text-sm text-gray-400 mb-3">
                    or deposit ${value.cost_usd} (instant)
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-primary-500 rounded-lg text-sm">
                      Use SPY
                    </button>
                    <button className="flex-1 py-2 glass rounded-lg text-sm">
                      Deposit ${value.cost_usd}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
