// app/page.tsx (Landing Page)
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { FaArrowRight, FaCoins, FaTasks, FaUsers, FaShieldAlt, FaTelegramPlane, FaRocket, FaAward, FaWallet, FaChartLine } from 'react-icons/fa'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-primary-900 to-navy-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-white to-primary-200 bg-clip-text text-transparent">
            Supay
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <Link href="#features" className="text-gray-300 hover:text-white transition">Features</Link>
          <Link href="#how-it-works" className="text-gray-300 hover:text-white transition">How It Works</Link>
          <Link href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</Link>
        </div>
        <div className="flex gap-4">
          <Link href="/login" className="px-5 py-2 rounded-xl text-white hover:bg-white/10 transition">
            Login
          </Link>
          <Link href="/register" className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold hover:shadow-lg transition transform hover:scale-105">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center px-3 py-1 rounded-full glass text-sm mb-6 animate-glow">
            <span className="w-2 h-2 bg-accent-500 rounded-full mr-2 animate-pulse" />
            The Future of Reward Platforms
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-primary-200 to-accent-300 bg-clip-text text-transparent">
              Earn Smarter
            </span>
            <br />
            with Supay
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Watch ads, complete tasks, refer friends — get paid in USDT or NGN instantly.
            Join over 10,000 users earning daily with Supay.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-accent-500 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-xl transition group">
              Start Earning Now 
              <FaArrowRight className="group-hover:translate-x-1 transition" />
            </Link>
            <button className="px-8 py-3 rounded-xl glass border border-primary-500/30 text-white font-semibold hover:bg-white/5 transition flex items-center gap-2">
              <FaRocket className="w-4 h-4" />
              Watch Demo
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
        >
          {[
            { label: 'Active Users', value: '10K+', icon: FaUsers, color: 'from-blue-500 to-cyan-500' },
            { label: 'Total Paid', value: '$250K+', icon: FaCoins, color: 'from-accent-500 to-orange-600' },
            { label: 'Daily Tasks', value: '5K+', icon: FaTasks, color: 'from-green-500 to-emerald-600' },
            { label: 'Secure Platform', value: '100%', icon: FaShieldAlt, color: 'from-purple-500 to-pink-500' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center mx-auto mb-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          id="features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-24 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Why Choose Supay?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto mb-12">
            We've built the most rewarding platform with instant payments,
            multiple earning methods, and a community you can trust.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Instant Withdrawals', desc: 'Get paid in USDT or NGN within 24 hours', icon: FaWallet },
              { title: 'Multiple Earnings', desc: 'Watch ads, complete tasks, refer friends, daily bonuses', icon: FaCoins },
              { title: 'NFT Rewards', desc: 'Earn exclusive NFTs that generate passive income', icon: FaAward },
            ].map((feature, i) => (
              <div key={i} className="glass rounded-xl p-6">
                <feature.icon className="w-10 h-10 text-accent-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
