# Deployment Guide

This guide covers deploying the Gym Scroller app to production.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- (Optional) YouTube Data API v3 key
- Domain/hosting for frontend and backend

## 🎯 Quick Start (Development)

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Access at `http://localhost:3000`

### Backend (Express + Socket.IO)
```bash
cd backend
npm install

# Optional: Create .env
echo "YOUTUBE_API_KEY=your_key" > .env
echo "FRONTEND_URL=http://localhost:3000" >> .env
echo "PORT=3001" >> .env

npm run dev
```
Access at `http://localhost:3001`

## 🚀 Production Deployment

### Frontend Deployment (Vercel - Recommended)

1. **Push to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Deploy Gym Scroller"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Framework Preset: **Next.js**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables**
   ```
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-url.com
   ```

4. **PWA Configuration**
   - Vercel automatically serves static files from `public/`
   - Service worker (`sw.js`) and manifest are ready
   - No additional configuration needed

### Backend Deployment (Railway/Render/Fly.io)

#### Option 1: Railway

1. **Create Railway Project**
   ```bash
   npm install -g railway
   railway login
   railway init
   ```

2. **Deploy**
   ```bash
   cd backend
   railway up
   ```

3. **Environment Variables**
   Set in Railway dashboard:
   ```
   YOUTUBE_API_KEY=your_key_here
   FRONTEND_URL=https://your-vercel-app.vercel.app
   PORT=3001
   ```

4. **Custom Domain** (optional)
   - Add custom domain in Railway settings
   - Update CORS in `backend/src/index.ts`

#### Option 2: Render

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect repository
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Environment Variables**
   ```
   YOUTUBE_API_KEY=your_key
   FRONTEND_URL=https://your-app.vercel.app
   NODE_ENV=production
   ```

#### Option 3: Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Launch App**
   ```bash
   cd backend
   fly launch
   ```

3. **Set Secrets**
   ```bash
   fly secrets set YOUTUBE_API_KEY=your_key
   fly secrets set FRONTEND_URL=https://your-app.vercel.app
   ```

4. **Deploy**
   ```bash
   fly deploy
   ```

### Alternative: Docker Deployment

#### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

#### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SOCKET_URL=http://backend:3001
    depends_on:
      - backend

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
      - FRONTEND_URL=http://localhost:3000
      - PORT=3001
```

Run with:
```bash
docker-compose up -d
```

## 🔐 Environment Variables

### Frontend (.env.local)
```bash
NEXT_PUBLIC_SOCKET_URL=https://api.gymscroller.com
```

### Backend (.env)
```bash
# Required
PORT=3001
FRONTEND_URL=https://gymscroller.com

# Optional
YOUTUBE_API_KEY=your_youtube_api_key_v3

# Optional (for future features)
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

## 🔒 Security Checklist

- [ ] Set CORS origin to production frontend URL
- [ ] Use HTTPS for all production endpoints
- [ ] Store YouTube API key server-side only
- [ ] Enable rate limiting on API endpoints
- [ ] Set secure Socket.IO CORS policies
- [ ] Use environment variables for secrets
- [ ] Enable CSP headers for XSS protection
- [ ] Implement authentication (future)

## 📱 PWA Installation

### iOS (Safari)
1. Open app in Safari
2. Tap Share button
3. Tap "Add to Home Screen"
4. Confirm

### Android (Chrome)
1. Open app in Chrome
2. Tap three-dot menu
3. Tap "Install app" or "Add to Home Screen"
4. Confirm

### Desktop (Chrome/Edge)
1. Click install icon in address bar
2. Or: Menu → Install Gym Scroller
3. Confirm

## 🧪 Testing Production Build Locally

### Frontend
```bash
cd frontend
npm run build
npm start
```
Access at `http://localhost:3000`

### Backend
```bash
cd backend
npm run build
npm start
```
Access at `http://localhost:3001`

## 📊 Monitoring & Analytics

### Recommended Tools
- **Frontend**: Vercel Analytics (built-in)
- **Backend**: Railway metrics, Sentry for errors
- **Real-time**: Socket.IO admin UI
- **Performance**: Lighthouse CI, Web Vitals

### Health Check Endpoints
- Frontend: `/_next/health` (Next.js default)
- Backend: `/health` (custom endpoint)

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm ci && npm run build
      # Deploy to Vercel via CLI or automatic deployment

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm ci && npm run build
      # Deploy to Railway/Render/Fly.io
```

## 🐛 Troubleshooting

### Issue: Socket.IO connection fails
- Check CORS settings in `backend/src/index.ts`
- Verify `NEXT_PUBLIC_SOCKET_URL` points to backend
- Ensure WebSocket is not blocked by firewall

### Issue: YouTube videos won't load
- Verify `origin` and `widget_referrer` in PlayerCard
- Check browser console for embed errors
- Ensure HTTPS in production (required for IFrame API)

### Issue: Service Worker not updating
- Clear cache and hard reload (Cmd/Ctrl + Shift + R)
- Check SW registration in DevTools → Application
- Verify `sw.js` is served from root domain

### Issue: PWA won't install
- Ensure manifest.json is accessible at `/manifest.json`
- Verify HTTPS (required for PWA)
- Check manifest validity: [Web Manifest Validator](https://manifest-validator.appspot.com/)

## 📈 Performance Optimization

### Frontend
- Enable Next.js Image Optimization
- Implement route-based code splitting
- Use dynamic imports for heavy components
- Optimize YouTube player loading (lazy load)

### Backend
- Implement Redis caching for Shorts queue
- Rate limit Socket.IO events (10-20 Hz)
- Use connection pooling for database
- Enable gzip/brotli compression

## 🔮 Future Enhancements

### Database Integration
```bash
# Add PostgreSQL for persistent storage
npm install prisma @prisma/client

# Initialize Prisma
npx prisma init
```

### Authentication
```bash
# Add NextAuth.js
cd frontend
npm install next-auth
```

### Advanced Analytics
```bash
# Add Posthog or Mixpanel
npm install posthog-js
```

## 📞 Support

For issues or questions:
- GitHub Issues: [github.com/yourrepo/issues](https://github.com)
- Documentation: This README and inline code comments
- Community: Discord/Slack (TBD)

---

**Happy Lifting! 💪**
