# Pablo Card Game 🃏

A real-time multiplayer card game built with Next.js 14, Supabase, and Tailwind CSS.

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (for deployment, optional)

## Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** (under Project Settings → API)

### 2. Run the Database Schema

1. In your Supabase dashboard, open the **SQL Editor**
2. Copy and paste the contents of `supabase/schema.sql`
3. Click **Run**

### 3. Enable Anonymous Auth

1. In your Supabase dashboard, go to **Authentication → Providers**
2. Find **Anonymous** and enable it
3. Save changes

### 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Install & Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Play

1. **Create a Room**: Enter your name and click "Create Room". Share the 6-letter code.
2. **Join a Room**: Enter your name and the room code, then click "Join Room".
3. **Peek Phase**: At game start, peek at your bottom 2 cards and memorize them. Click "I've Seen My Cards".
4. **Your Turn**:
   - Draw a card from the deck
   - Either discard it or swap it with one of your 4 grid cards
   - Special cards: 7 = peek one of your own cards, 8 = peek an opponent's card, 9 = swap any two cards on the table
5. **Stacking**: When the discard pile top card changes, any player can instantly stack a matching card from their grid onto it
6. **Call Pablo**: After completing your turn action, call "Pablo" to trigger the final round. Everyone else gets 1 more turn, then hands are revealed. Lowest sum wins!

## Card Values

| Card | Value |
|------|-------|
| Ace  | 1     |
| 2-10 | Face  |
| J, Q, K | 10 |

**Goal: Lowest sum wins!**

## Deploy to Vercel

1. Push this repo to GitHub
2. Connect your GitHub repo to [Vercel](https://vercel.com)
3. Add the same environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel's project settings
4. Deploy!

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** (PostgreSQL + Realtime + Anonymous Auth)
- **Tailwind CSS** (styling)
