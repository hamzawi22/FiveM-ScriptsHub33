# FiveM Script Marketplace

## Project Overview
A comprehensive FiveM script marketplace with Google/Email authentication, AI-powered validation, coins-based economy, and creator verification system.

## Recent Changes (December 24-25, 2025)

### ✅ Completed Features
1. **Creator Profile Pages** - Full profile display with:
   - Creator name, bio, and avatar
   - Follow/Unfollow functionality
   - Verification badge (for verified creators)
   - Trust score display (yellow star rating)
   - Stats: Followers, Following, Scripts Published, Total Earnings, Available Coins

2. **Profile Search System** - Search page allowing users to:
   - Search creators by name in real-time
   - View search results with creator stats (followers, script count, trust score, verification status)
   - Click to view full creator profile

3. **Earnings & Verification System** - Dashboard for creators showing:
   - Current coins balance and total earnings
   - Follower count
   - 3-month analytics (downloads, views)
   - Scripts published count
   - Verification eligibility check
   - Submit verification requests with automatic eligibility validation

4. **Navigation Updates**
   - Added "Search Creators" link to main navigation (desktop and mobile)
   - Routes: /, /search, /dashboard, /creator/:userId, /earnings

5. **Database Schema Enhancements**
   - `verification_requests` table for tracking verification applications
   - `profiles.isVerified` field (boolean)
   - `profiles.trustScore` field (numeric)

### 🔄 API Endpoints
- `GET /api/profiles/search` - Search creators by name
- `GET /api/profiles/:userId` - Get creator profile (now includes isVerified, trustScore)
- `GET /api/earnings` - Get user's earnings data
- `POST /api/verification/request` - Submit verification request
- `GET /api/users/:userId/scripts` - Get creator's scripts

### 📋 Business Logic
- **Coins Economy**: Creators earn 5 coins per script download
- **Verification Requirements** (all must be met):
  - 500+ followers (any time)
  - 5000+ downloads (last 3 months)
  - 10000+ views (last 3 months)
- **Trust Score**: Calculated and displayed on creator profiles
- **AI Script Validation**: Scripts require fxmanifest.lua or are auto-rejected

### 🎯 Key Design Decisions
1. Verification badge only shows on profiles of verified creators
2. Trust score shown as yellow star rating on profiles
3. 3-month calculation uses database analytics records filtered by date
4. Profile search returns top 20 results
5. Window.location.href used for navigation (Replit Vite setup limitation)

### 📁 Important Files
- `shared/schema.ts` - Data models and Zod schemas
- `server/storage.ts` - Database operations and verification logic
- `server/routes.ts` - API endpoints for profiles and verification
- `client/src/pages/Creator.tsx` - Creator profile page
- `client/src/pages/SearchProfiles.tsx` - Profile search page
- `client/src/pages/Earnings.tsx` - Earnings and verification page
- `client/src/components/Layout.tsx` - Navigation with search link

### ⚙️ Tech Stack
- Frontend: React, TanStack Query, Wouter routing, Tailwind CSS, Shadcn UI
- Backend: Express, TypeScript, Drizzle ORM, PostgreSQL
- Auth: Replit Auth integration
- AI: OpenAI for script validation

### 📝 Notes
- File uploads currently use simulated blob URLs (actual backend storage not implemented)
- Trust score calculation logic ready but can be enhanced
- Verification requests table has status field for future admin panel
