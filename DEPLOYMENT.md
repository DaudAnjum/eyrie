# Eyrie Real Estate - Deployment Guide

## Quick Deployment Options

### 1. Vercel (Recommended)

**Automatic Deployment:**
1. Push your code to GitHub repository
2. Visit [vercel.com](https://vercel.com) and sign up/login
3. Click "New Project" and import your GitHub repository
4. Vercel will automatically detect Next.js and configure the build
5. Deploy with one click!

**Manual Configuration (if needed):**
- Build Command: `npm run build`
- Output Directory: `out`
- Node.js Version: 18.x

### 2. Netlify

**Option A - Git Integration:**
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `out`

**Option B - Manual Upload:**
1. Run `npm run build` locally
2. Go to [netlify.com](https://netlify.com)
3. Drag and drop the `out` folder to Netlify

### 3. GitHub Pages

1. Build the project: `npm run build`
2. Push the `out` folder contents to a `gh-pages` branch
3. Enable GitHub Pages in repository settings
4. Select `gh-pages` branch as source

### 4. Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select 'out' as public directory
# Configure as single-page app: No
# Overwrite index.html: No
firebase deploy
```

### 5. AWS S3 + CloudFront

1. Create S3 bucket with static website hosting
2. Upload contents of `out` folder
3. Configure CloudFront distribution for global CDN
4. Set up custom domain if needed

## Build Requirements

- Node.js 18 or higher
- NPM or Yarn package manager

## Environment Variables

For production, you may want to add these environment variables:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com
```

## Custom Domain Setup

### For Vercel:
1. Add domain in Vercel dashboard
2. Update DNS records as instructed
3. SSL certificate is automatically handled

### For Netlify:
1. Add custom domain in site settings
2. Update DNS to point to Netlify
3. SSL is automatically provisioned

## Performance Optimizations

The website is already optimized with:
- Static export for fast loading
- Image optimization (disabled for static export)
- Code splitting and bundling
- Responsive images and lazy loading
- Minified CSS and JavaScript

## SEO Configuration

The site includes:
- Meta tags for each page
- Semantic HTML structure
- Responsive design
- Fast loading times
- Clean URLs

## Analytics Setup (Optional)

To add Google Analytics:

1. Get your GA4 measurement ID
2. Add to `next.config.js`:

```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    GOOGLE_ANALYTICS_ID: 'G-XXXXXXXXXX'
  }
}
```

3. Add Google Analytics script to `app/layout.tsx`

## Maintenance

- The website is completely static after build
- No server maintenance required
- Admin functionality works client-side only
- To update content, modify data files and redeploy

## Security Notes

- Admin credentials are client-side only (demo purposes)
- For production, implement proper authentication
- All data is static and public
- No sensitive information is exposed

## Support

For deployment issues:
1. Check build logs for errors
2. Ensure all dependencies are installed
3. Verify Node.js version compatibility
4. Check that all image paths are correct