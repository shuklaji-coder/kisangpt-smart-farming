# 🚀 KisanGPT - Free Deployment Guide

## 📋 Deployment Checklist

### ✅ Prerequisites
- [ ] GitHub account created
- [ ] Code pushed to GitHub
- [ ] Vercel account (for frontend)
- [ ] Railway account (for backend)

## 🌐 Frontend Deployment (Vercel)

### Option 1: Direct Deploy Button
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/kisangpt-smart-farming&root-directory=frontend)

### Option 2: Manual Steps
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `frontend`
5. Deploy!

**Environment Variables:**
```
REACT_APP_API_URL=https://your-backend-url.railway.app
REACT_APP_WEATHER_API_KEY=your-api-key
```

## 🚂 Backend Deployment (Railway)

### Option 1: Direct Deploy Button
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/kisangpt-smart-farming&referralCode=bonus)

### Option 2: Manual Steps
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Set root directory to `backend`
6. Deploy!

**Environment Variables:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=sqlite:./database.db
OPENWEATHER_API_KEY=your-weather-api-key
```

## 🔗 Alternative Free Hosting Options

### Frontend Options:
1. **Netlify** - [netlify.com](https://netlify.com)
   - Drag & drop deployment
   - Auto builds from Git
   - Free custom domain

2. **GitHub Pages** - Free with GitHub
   - Settings > Pages > Source: GitHub Actions
   - Use React build action

3. **Surge.sh** - Command line deployment
   ```bash
   npm install -g surge
   cd frontend/build
   surge
   ```

### Backend Options:
1. **Render** - [render.com](https://render.com)
   - 750 hours free per month
   - Auto-deploy from Git

2. **Heroku Alternative: Cyclic** - [cyclic.sh](https://cyclic.sh)
   - Serverless deployment
   - Easy Node.js hosting

3. **Firebase Functions** - Google's serverless
   - 125,000 invocations free
   - Global CDN

## 📱 Quick Deploy Commands

### Deploy Frontend to Vercel
```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Deploy Backend to Railway
```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

## 🌍 Custom Domain Setup

### Free Domain Options:
1. **Freenom** - `.tk`, `.ml`, `.ga` domains
2. **GitHub Student Pack** - Free `.me` domain
3. **Use subdomain** - `yourname.vercel.app`

### DNS Setup:
1. Point domain to Vercel IP
2. Add CNAME record
3. Enable HTTPS (automatic)

## 🔧 Environment Configuration

### Frontend (.env.production)
```
REACT_APP_API_URL=https://kisangpt-backend.railway.app
REACT_APP_WEATHER_API_KEY=your_key_here
REACT_APP_ENVIRONMENT=production
```

### Backend (.env)
```
NODE_ENV=production
PORT=3000
DATABASE_URL=sqlite:./database.db
CORS_ORIGIN=https://kisangpt.vercel.app
OPENWEATHER_API_KEY=your_key_here
```

## 📊 Monitoring & Analytics

### Free Monitoring Tools:
1. **Vercel Analytics** - Built-in
2. **Railway Metrics** - CPU, Memory usage
3. **Google Analytics** - User tracking
4. **Sentry** - Error monitoring (free tier)

## 🛠️ Database Options

### Free Database Services:
1. **Railway PostgreSQL** - 500MB free
2. **Supabase** - 500MB PostgreSQL + Auth
3. **MongoDB Atlas** - 512MB free
4. **PlanetScale** - MySQL serverless

## 📞 Support Resources

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **GitHub Issues**: For project-specific help
- **Discord Communities**: Real-time help

## 🎯 Performance Tips

1. **Enable Compression** - Gzip/Brotli
2. **Image Optimization** - WebP format
3. **Lazy Loading** - Components and images
4. **CDN Usage** - Static assets
5. **Caching Strategy** - API responses

---

## 🚀 One-Click Deploy Links

### Frontend (Vercel):
**[Deploy Frontend Now →](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/kisangpt-smart-farming&root-directory=frontend)**

### Backend (Railway):
**[Deploy Backend Now →](https://railway.app/new/template?template=https://github.com/yourusername/kisangpt-smart-farming)**

### Full Stack (Netlify + Functions):
**[Deploy Full App →](https://app.netlify.com/start/deploy?repository=https://github.com/yourusername/kisangpt-smart-farming)**

---

**🎉 Congratulations! Your KisanGPT app is now live and accessible worldwide!**

**Frontend URL**: https://kisangpt.vercel.app  
**Backend URL**: https://kisangpt-backend.railway.app  
**GitHub Repo**: https://github.com/yourusername/kisangpt-smart-farming