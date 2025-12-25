# FiveM Script Marketplace

## Project Overview
A comprehensive FiveM script marketplace with Google/Email authentication, AI-powered validation, coins-based economy, creator verification system, and trust score calculation based on ratings, reports, and strikes.

## Recent Changes (December 25, 2025)

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
- `GET /api/profiles/:userId` - Get creator profile (includes isVerified, trustScore)
- `GET /api/earnings` - Get user's earnings data
- `POST /api/verification/request` - Submit verification request
- `GET /api/users/:userId/scripts` - Get creator's scripts
- `POST /api/scripts/:id/rate` - Rate a script (1-5 stars with optional review)
- `POST /api/scripts/:id/report` - Report a script (with reason and description)

### 📋 Business Logic
- **Coins Economy**: Creators earn 5 coins per script download
- **Verification Requirements** (all must be met):
  - 500+ followers (any time)
  - 5000+ downloads (last 3 months)
  - 10000+ views (last 3 months)
- **Trust Score System** (NEW):
  - Formula: (avgRating × 1.5) - (validReports × 1) - (strikes × 2)
  - Based on: ratings (1-5 stars), valid reports, and strikes/violations
  - Auto-calculated and updated on creator profiles
  - Displayed as decimal score on profile page
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

### 📝 Database Tables (NEW)
- `ratings` - Script ratings with user reviews (1-5 stars)
- `reports` - Problem reports on scripts (malware, spam, stolen, broken, etc)
- `strikes` - User violations/strikes for policy violations
- All linked to profiles for trust score calculation

### 🎯 Trust Score Components
1. **Ratings**: Average rating of all scripts (weighted 1.5x)
2. **Valid Reports**: Each valid report reduces score by 1 point
3. **Strikes**: Each active strike reduces score by 2 points
4. **Result**: Score is updated automatically when ratings/reports are submitted

### 📝 Notes & Future Features
- File uploads currently use simulated blob URLs (actual backend storage not implemented)
- **NOT YET IMPLEMENTED**: AI Recommendation Feed
  - Would show personalized recommendations based on:
    - Search history
    - Viewing patterns
    - Follow list
    - Download patterns
  - This requires: user preference tracking, ML model, and content-based filtering
- Admin panel needed to review reports and issue strikes
- Verification requests table ready for admin panel review
