# Changelog

All notable changes to the Mycelix Protocol landing page will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-11-14

### Added
- **Dark Mode Support**
  - User-toggleable dark theme with floating button (🌙/☀️)
  - localStorage persistence for theme preference
  - System preference detection (prefers-color-scheme)
  - Dynamic theme-color meta tag updates
  - CSS custom properties for theming throughout

- **FAQ Section**
  - Interactive accordion with 5 comprehensive Q&A items
  - Smooth expand/collapse animations
  - Keyboard accessible (Enter/Space to toggle)
  - Topics: PoGQ mechanics, comparison to Multi-Krum, production readiness, roadmap, contribution

- **Animations & Transitions**
  - CSS keyframe animations for stats (countUp effect)
  - Fade-in animations for sections (fadeInUp)
  - Intersection Observer for scroll-triggered reveals
  - Hover effects on cards and buttons
  - Smooth page transitions throughout

- **Accessibility Enhancements**
  - `prefers-reduced-motion` support (disables animations)
  - Print stylesheet for professional printing
  - Enhanced keyboard navigation for FAQs
  - ARIA attributes on interactive elements
  - Improved focus management

- **Community Files**
  - CODE_OF_CONDUCT.md (Contributor Covenant 2.1)
  - GitHub Issue Templates (bug_report, feature_request)
  - Pull Request Template with testing checklist
  - FUNDING.yml for sponsorship options
  - CODEOWNERS file for code review automation

- **Performance Optimizations**
  - Intersection Observer for lazy section loading
  - Efficient CSS custom properties
  - Performance timing logging
  - Optimized JavaScript (4 IIFE modules)

### Changed
- **Complete CSS Refactor**
  - All colors now use CSS custom properties
  - Consistent transition timing (--transition variable)
  - Dark mode-aware color scheme
  - Improved mobile responsiveness
  - Enhanced hover states

- **File Size**
  - index.html: 356 → 785 lines (+429 lines, +120%)
  - File size: 15KB → 32KB (doubled)
  - Added ~160 lines of JavaScript
  - Added comprehensive FAQ content

### Fixed
- Mobile dark mode toggle positioning
- Print layout optimization
- Cross-browser gradient text compatibility
- Focus visibility in both themes

## [1.1.0] - 2025-11-14

### Added
- **SEO & Discoverability**
  - Open Graph meta tags for social media sharing (Facebook, LinkedIn)
  - Twitter Card meta tags for enhanced Twitter previews
  - JSON-LD structured data for search engines
  - Canonical URL to prevent duplicate content issues
  - sitemap.xml for search engine discovery
  - Enhanced robots.txt with sitemap reference
  - Additional meta tags (language, robots directives)

- **Accessibility**
  - Semantic HTML5 elements (main, section, header, footer)
  - ARIA labels and roles throughout the page
  - Skip-to-content link for keyboard navigation
  - Enhanced focus states for better keyboard accessibility
  - Proper heading hierarchy with IDs for screen readers

- **Performance**
  - DNS prefetch hints for github.com
  - Preconnect hints for external resources
  - Smooth scrolling behavior
  - Cross-browser fallbacks for gradient text

- **Open Source Best Practices**
  - LICENSE file (MIT)
  - CONTRIBUTING.md with comprehensive contribution guidelines
  - .well-known/security.txt for responsible disclosure (RFC 9116)
  - .gitignore for standard web project patterns
  - Custom 404.html error page for GitHub Pages
  - CHANGELOG.md for version tracking

- **Design & UX**
  - Inline SVG emoji favicon (no external requests)
  - Professional footer with copyright and license links
  - Better button focus visibility
  - Improved responsive design

- **Developer Experience**
  - Enhanced deploy.sh with retry logic and exponential backoff
  - Smart commit detection in deployment script
  - Better error handling and user feedback
  - Updated README with technical improvements section

### Changed
- Reorganized deployment options in README (deploy script now recommended)
- Updated "Last Updated" date to November 14, 2025
- Changed project status to "Production ready"
- Improved mobile responsiveness on stat cards
- Enhanced color contrast for better readability

### Fixed
- Cross-browser compatibility issues with gradient text
- Keyboard navigation accessibility issues
- Missing semantic HTML structure
- Deployment script handling of already-committed changes

## [1.0.0] - 2025-10-14

### Added
- Initial landing page launch
- Hero section with key metrics (100% detection, 45% tolerance, +23pp accuracy)
- Problem & Solution section explaining Byzantine attacks and PoGQ+Rep
- Healthcare Application section highlighting HIPAA compliance
- Technical Innovation section detailing the PoGQ approach
- Experimental Validation section with Grand Slam results
- Project Status roadmap
- Get Involved section with CTAs
- Responsive design with purple gradient theme
- Mobile-first approach
- Basic SEO meta tags

---

## Version Guidelines

- **Major version (X.0.0)**: Significant redesigns or architectural changes
- **Minor version (0.X.0)**: New features, sections, or enhancements
- **Patch version (0.0.X)**: Bug fixes, copy updates, minor improvements

[1.1.0]: https://github.com/Luminous-Dynamics/mycelix.net/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Luminous-Dynamics/mycelix.net/releases/tag/v1.0.0
