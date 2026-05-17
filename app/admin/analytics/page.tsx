'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, TrendingUp, DollarSign, Users, Calendar, Download } from 'lucide-react'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const supabase = createClient()

export default function AdminAnalyticsPage() {
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [userGrowthData, setUserGrowthData] = useState<any[]>([])
  const [taskData, setTaskData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  async function fetchAnalytics() {
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Revenue by day
    const { data: deposits } = await supabase
      .from('deposits')
      .select('amount_usd, created_at')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())

    const revenueByDay = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayRevenue = deposits?.filter(d => d.created_at.startsWith(dateStr)).reduce((sum, d) => sum + d.amount_usd, 0) || 0
      return { date: dateStr, revenue: dayRevenue }
    }).reverse()

    setRevenueData(revenueByDay)

    // User growth
    const { data: users } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())

    const usersByDay = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayUsers = users?.filter(u => u.created_at.startsWith(dateStr)).length || 0
      return { date: dateStr, users: dayUsers }
    }).reverse()

    // Cumulative users
    let cumulative = 0
    const cumulativeUsers = usersByDay.map(day => {
      cumulative += day.users
      return { date: day.date, users: cumulative }
    })
    setUserGrowthData(cumulativeUsers)

    // Task completions by type
    const { data: tasks } = await supabase
      .from('tasks')
      .select('task_type, total_completions')

    const taskTypeData = tasks?.reduce((acc: any, task) => {
      acc[task.task_type] = (acc[task.task_type] || 0) + (task.total_completions || 0)
      return acc
    }, {}) || {}

    setTaskData(Object.entries(taskTypeData).map(([name, value]) => ({ name, value })))

    setIsLoading(false)
  }

  const COLORS = ['#2342B5', '#FF7A1A', '#10B981', '#EF4444', '#8B5CF6']

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-accent-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1">Platform performance metrics</p>
        </div>
        <div className="flex gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-navy-800 border border-primary-500/30 rounded-xl text-white"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="px-4 py-2 glass rounded-xl text-white flex items-center gap-2">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-accent-500" /> Daily Revenue
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2D66" />
            <XAxis dataKey="date" stroke="#A7B0C5" />
            <YAxis stroke="#A7B0C5" />
            <Tooltip contentStyle={{ backgroundColor: '#0A1229', borderColor: '#2342B5' }} />
            <Area type="monotone" dataKey="revenue" stroke="#FF7A1A" fill="#FF7A1A" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* User Growth Chart */}
      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-accent-500" /> User Growth
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={userGrowthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A2D66" />
            <XAxis dataKey="date" stroke="#A7B0C5" />
            <YAxis stroke="#A7B0C5" />
            <Tooltip contentStyle={{ backgroundColor: '#0A1229', borderColor: '#2342B5' }} />
            <Line type="monotone" dataKey="users" stroke="#2342B5" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Task Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent-500" /> Task Completion Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={taskData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {taskData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#0A1229', borderColor: '#2342B5' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics Summary */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent-500" /> Key Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
              <span className="text-gray-400">Total Revenue</span>
              <span className="text-white font-bold">${revenueData.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
              <span className="text-gray-400">New Users</span>
              <span className="text-white font-bold">{userGrowthData[userGrowthData.length - 1]?.users || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-navy-800 rounded-lg">
              <span className="text-gray-400">Average Revenue Per User</span>
              <span className="text-white font-bold">${(revenueData.reduce((sum, d) => sum + d.revenue, 0) / (userGrowthData[userGrowthData.length - 1]?.users || 1)).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
