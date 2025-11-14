# Changelog

All notable changes to the Mycelix Protocol landing page will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2025-11-14

### Added
- **Comparison Table**
  - Side-by-side feature comparison (PoGQ+Rep vs Multi-Krum, FedAvg, FedProx)
  - 6 key metrics (Byzantine Tolerance, Detection Rate, Convergence Speed, Computational Cost, Healthcare Use, Production Ready)
  - Color-coded badges (success/warning/danger)
  - Highlighted column for PoGQ+Rep
  - Responsive table design with horizontal scroll on mobile
  - Technical details tooltip integration

- **Contributors Gallery**
  - GitHub API integration for contributor avatars
  - Dynamic fetching of up to 24 contributors
  - Loading skeleton animation during fetch
  - Hover effects (scale + rotate transform)
  - Direct links to contributor GitHub profiles
  - Contribution count in tooltips
  - Graceful error handling with fallback message
  - Lazy loading for performance

- **Testimonials/Endorsements Section**
  - 3 academic endorsement cards
  - Professional quote styling with large quotation marks
  - Author names, titles, and affiliations
  - Hover lift effects (translateY transform)
  - Responsive 3-column grid (stacks on mobile)
  - Credibility and social proof elements

- **Keyboard Shortcuts for Power Users**
  - `?` - Show keyboard shortcuts modal
  - `t` - Toggle dark/light theme
  - `j` - Scroll down 300px
  - `k` - Scroll up 300px
  - `gg` - Go to top of page (press 'g' twice)
  - `Esc` - Close keyboard shortcuts modal
  - Modal overlay with backdrop blur
  - Keyboard shortcut table with descriptions
  - Does not interfere with input/textarea fields

- **Tooltips System**
  - Dashed underline styling for technical terms
  - Hover-triggered popup with definitions
  - Smooth fade-in/fade-out animations
  - Positioned above text with arrow indicator
  - Mobile-friendly tap support
  - Covers key terms: Byzantine, PoGQ, Federated Learning, Multi-Krum

- **Micro-interactions**
  - Enhanced button hover states with scale transforms
  - Card hover elevations (increased shadow depth)
  - Smooth transitions throughout (0.3s ease)
  - Loading skeleton pulse animation
  - Badge color transitions
  - Contributor avatar rotations on hover

### Changed
- **File Size & Performance**
  - index.html: 1,206 → 1,654 lines (+448 lines, +37%)
  - File size: 46KB → 64KB (+18KB, +39%)
  - Added ~180 lines of CSS
  - Added 2 new JavaScript modules
  - 9 total IIFE modules now

- **Visual Hierarchy**
  - Comparison table added to Technical Innovation section
  - Contributors gallery added to Get Involved section
  - Testimonials section added after Experimental Validation
  - Better content flow and engagement

- **User Experience**
  - More interactive elements throughout page
  - Power user features for keyboard navigation
  - Enhanced credibility with testimonials
  - Clear competitive positioning with comparison table

### Technical
- **New JavaScript Modules:**
  1. Contributors gallery fetcher (GitHub API)
  2. Keyboard shortcuts handler (event listeners)

- **API Integration:**
  - GitHub Contributors API endpoint
  - Async/await pattern with error handling
  - Avatar lazy loading for performance
  - Rate limiting considerations

- **CSS Enhancements:**
  - Comparison table styles with sticky headers
  - Badge component system (3 variants)
  - Testimonial card layouts
  - Tooltip positioning system
  - Loading skeleton keyframe animation
  - Modal overlay with backdrop filter

- **Accessibility:**
  - Keyboard shortcuts don't interfere with form inputs
  - Modal accessible with Esc key
  - All interactive elements keyboard accessible
  - Tooltips with hover and focus states
  - Table headers properly labeled

## [1.3.0] - 2025-11-14

### Added
- **Interactive Navigation**
  - Reading progress bar at top of page (purple gradient)
  - Back to top button (floating, appears after 300px scroll)
  - Smooth scroll with accessibility support
  - Visual scroll progress tracking

- **Code Examples & Developer Tools**
  - Quick Start section with Python code example
  - Copy-to-clipboard button for code blocks
  - Syntax highlighting with monospace font
  - Installation and usage examples
  - PoGQAggregator initialization snippet

- **Social Proof & Engagement**
  - GitHub stars counter (live API integration)
  - GitHub forks counter
  - Social share buttons (Twitter, LinkedIn, Email)
  - Real-time repository statistics
  - Graceful API error handling

- **Visual Timeline**
  - Replaced bullet list with interactive timeline
  - 4 phases with visual progress indicators (✅🚧🔮🌟)
  - Dates and detailed descriptions for each phase
  - Hover effects and smooth transitions
  - Vertical line with gradient

- **Enhanced Styling**
  - 200+ lines of new CSS for components
  - Code block theming (dark mode compatible)
  - Timeline visualization styles
  - Social button theming (brand colors)
  - GitHub stats badge styling

### Changed
- **Project Status → Project Roadmap**
  - Visual timeline replaces simple bullet list
  - More engaging presentation
  - Better mobile responsiveness
  - Phase-specific icons and colors

- **File Size & Performance**
  - index.html: 785 → 1,206 lines (+421 lines, +54%)
  - File size: 32KB → 46KB (+14KB, +44%)
  - Added 4 new JavaScript modules (~90 lines)
  - 7 total IIFE modules now

- **Get Involved Section**
  - Added GitHub statistics display
  - Integrated social sharing
  - More interactive call-to-actions

### Technical
- **New JavaScript Modules:**
  1. Reading progress bar (scroll tracking)
  2. Back to top button (appears/disappears)
  3. Copy code to clipboard (async/await)
  4. GitHub API integration (fetch)

- **API Integration:**
  - GitHub REST API v3
  - Graceful fallback on errors
  - Real-time data fetching

- **Accessibility:**
  - Copy buttons with status feedback
  - Keyboard accessible scroll buttons
  - prefers-reduced-motion aware
  - ARIA labels on all interactive elements

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
