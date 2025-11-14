# mycelix.net - Landing Page

**Byzantine-Resistant Federated Learning with Proof of Gradient Quality (PoGQ)**

## Overview

This is the landing page for mycelix.net, focused on showcasing the PoGQ+Rep innovation for Byzantine-resistant federated learning.

## Key Metrics

- **100% Attack Detection Rate** at 45% adversarial ratio
- **45% Byzantine Tolerance** (exceeding traditional 33% BFT limit)
- **+23pp Accuracy Improvement** over Multi-Krum baseline

## Deployment

### Option 1: Quick Deploy Script (Recommended)

The `deploy.sh` script handles initialization, commits, and pushes with automatic retry logic:

```bash
chmod +x deploy.sh
./deploy.sh
```

Features:
- Automatic git initialization
- Smart commit detection (skips if no changes)
- Network retry with exponential backoff (2s, 4s, 8s)
- Clear error messages and next steps

### Option 2: Manual Deployment

```bash
# Initialize git (if needed)
git init

# Stage and commit
git add .
git commit -m "🚀 Launch mycelix.net: Byzantine-Resistant Federated Learning"

# Add remote (create repo first on GitHub)
git remote add origin git@github.com:Luminous-Dynamics/mycelix.net.git

# Push to main branch
git branch -M main
git push -u origin main
```

### Option 3: GitHub Pages via Web UI

1. Create repository: `Luminous-Dynamics/mycelix.net`
2. Push this directory to the repository
3. Enable GitHub Pages in Settings → Pages
4. Source: Deploy from branch `main` / `(root)`

## DNS Configuration

DNS is already configured via Cloudflare:
```
CNAME mycelix.net -> luminous-dynamics.github.io
```

Once GitHub Pages is enabled, the site will be live at https://mycelix.net

## Content Strategy

This landing page is **PoGQ-focused** (not full 5-layer protocol):

✅ **DO Highlight**:
- Proof of Gradient Quality innovation
- 100% detection, 45% tolerance
- Healthcare application (HIPAA-compliant)
- Grand Slam experimental validation
- Open-source implementation

❌ **DON'T Include**:
- Full 8-layer protocol vision
- Mystical/philosophical language
- Unimplemented features
- "Infinite Love" or "Sacred" terminology

## Target Audience

1. **Grant Reviewers** (NSF, NIH)
2. **Academic Researchers** (ML security, FL)
3. **Healthcare IT** (Hospital CIOs, HIPAA compliance)
4. **Open-Source Contributors** (GitHub community)

## Technical Improvements

This landing page includes:

### SEO & Social Sharing
- Open Graph and Twitter Card meta tags
- Structured data (JSON-LD) for search engines
- Comprehensive meta descriptions and keywords
- `robots.txt` for search engine crawling

### Accessibility
- Semantic HTML5 elements (`<main>`, `<section>`, `<header>`, `<footer>`)
- ARIA labels and roles
- Skip-to-content link for keyboard navigation
- Enhanced focus states for better keyboard accessibility
- Responsive design with mobile-first approach

### Performance & UX
- Smooth scrolling for anchor links
- Cross-browser gradient text fallbacks
- Inline SVG favicon (no external requests)
- Optimized CSS with minimal dependencies

## Related Links

- **Main Repository**: https://github.com/Luminous-Dynamics/mycelix
- **Whitepaper** (coming Jan 2026): MLSys/ICML submission
- **Contact**: tristan.stoltz@evolvingresonantcocreationism.com

---

**Last Updated**: November 14, 2025
**Status**: Production ready
