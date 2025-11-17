import { useEffect, useMemo, useState } from 'react'
import Spline from '@splinetool/react-spline'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Hero() {
  return (
    <section className="relative h-[60vh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Spline scene="https://prod.spline.design/41MGRk-UDPKO-l6W/scene.splinecode" style={{ width: '100%', height: '100%' }} />
      </div>
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-3xl p-6 md:p-10 max-w-xl text-white">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Your Money, Beautifully Organized</h1>
            <p className="mt-3 md:mt-4 text-white/80">A modern, minimalist dashboard to track balances, cards, and transactions in one place.</p>
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
    </section>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-white">
      <div className="text-white/60 text-sm">{label}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  )
}

function CardItem({ card }) {
  const gradient = useMemo(() => {
    const c = card.color || '#7c3aed'
    return {
      background: `linear-gradient(135deg, ${c} 0%, #0ea5e9 100%)`
    }
  }, [card.color])

  return (
    <div className="p-[1px] rounded-3xl bg-gradient-to-br from-white/20 to-white/5">
      <div className="rounded-3xl p-5 min-h-[160px] text-white flex flex-col justify-between" style={gradient}>
        <div className="flex items-center justify-between opacity-90">
          <span className="text-sm">{card.brand}</span>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{card.status}</span>
        </div>
        <div>
          <div className="tracking-widest text-lg">•••• •••• •••• {card.last4}</div>
          <div className="text-xs mt-2 opacity-80">{card.cardholder}</div>
        </div>
      </div>
    </div>
  )
}

function CardsSection({ userId }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await fetch(`${API_BASE}/cards?user_id=${userId}`)
        const data = await res.json()
        setCards(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchCards()
  }, [userId])

  return (
    <section className="container mx-auto px-6 -mt-20 relative z-20">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl md:text-2xl font-semibold">Your Cards</h2>
          <button className="text-sm text-white/80 hover:text-white">Add new</button>
        </div>
        {loading ? (
          <div className="text-white/60 mt-6">Loading cards...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {cards.map((c) => (
              <CardItem key={c._id} card={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function Transactions({ userId }) {
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTxs() {
      try {
        const res = await fetch(`${API_BASE}/transactions?user_id=${userId}&limit=5`)
        const data = await res.json()
        setTxs(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (userId) fetchTxs()
  }, [userId])

  return (
    <section className="container mx-auto px-6 mt-8">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8">
        <h2 className="text-white text-xl md:text-2xl font-semibold">Recent Activity</h2>
        {loading ? (
          <div className="text-white/60 mt-6">Loading transactions...</div>
        ) : (
          <ul className="divide-y divide-white/10 mt-4">
            {txs.map((t) => (
              <li key={t._id} className="py-4 flex items-center justify-between text-white">
                <div>
                  <div className="text-white/90">{t.description}</div>
                  <div className="text-xs text-white/60">{new Date(t.occurred_at).toLocaleString()}</div>
                </div>
                <div className={t.direction === 'debit' ? 'text-rose-300' : 'text-emerald-300'}>
                  {t.direction === 'debit' ? '-' : '+'}${Math.abs(t.amount).toFixed(2)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Dashboard() {
  // Demo: create a default user if none exists and use the first one
  const [userId, setUserId] = useState('')
  const [stats, setStats] = useState({ balance: 0, accounts: 0, cards: 0 })

  useEffect(() => {
    async function ensureUser() {
      try {
        const usersRes = await fetch(`${API_BASE}/users`)
        let users = await usersRes.json()
        if (!Array.isArray(users)) users = []
        let user = users[0]
        if (!user) {
          const createRes = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Demo User', email: `demo${Date.now()}@bank.dev` })
          })
          user = await createRes.json()
        }
        setUserId(user._id)
        // fetch accounts/cards stats
        const [accountsRes, cardsRes] = await Promise.all([
          fetch(`${API_BASE}/accounts?user_id=${user._id}`),
          fetch(`${API_BASE}/cards?user_id=${user._id}`)
        ])
        const [accounts, cards] = await Promise.all([accountsRes.json(), cardsRes.json()])
        const balance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
        setStats({ balance, accounts: accounts.length, cards: cards.length })
      } catch (e) {
        console.error(e)
      }
    }
    ensureUser()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      <Hero />
      <section className="container mx-auto px-6 -mt-10 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Stat label="Total Balance" value={`$${stats.balance.toFixed(2)}`} />
          <Stat label="Accounts" value={stats.accounts} />
          <Stat label="Cards" value={stats.cards} />
        </div>
      </section>
      <CardsSection userId={userId} />
      <Transactions userId={userId} />
      <footer className="container mx-auto px-6 py-12 text-center text-white/50">Fintech Dashboard — demo</footer>
    </div>
  )
}

export default Dashboard
