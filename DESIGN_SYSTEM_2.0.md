# MMDSS Design System 2.0

## Architecture Overview

MMDSS now implements a modern CSS architecture using **Cascade Layers**, **Design Tokens**, **Container Queries**, and advanced CSS features for 2025+ standards.

### Key Improvements

✅ **CSS Cascade Layers** - Predictable style precedence without `!important` wars  
✅ **Motion Design Tokens** - Standardized durations and easing functions  
✅ **Spatial System** - 8px grid-based spacing for visual harmony  
✅ **Depth System** - Layered shadows with glow effects  
✅ **Fluid Typography** - Responsive text using `clamp()`  
✅ **Container Queries** - Component-level responsiveness  
✅ **Reduced Motion Support** - Respects user accessibility preferences  
✅ **Color-Mix() Functions** - Modern elevated surfaces  

---

## Cascade Layers Strategy

Styles are organized in predictable layers (from lowest to highest priority):

```css
@layer reset, base, tokens, layouts, components, utilities, overrides;
```

| Layer | Purpose | Examples |
|-------|---------|----------|
| `reset` | Modern CSS reset | Box-sizing, smooth scroll, motion preferences |
| `base` | Core element styles | Body, typography, original color tokens |
| `tokens` | Design System 2.0 tokens | Motion, depth, spatial, typography tokens |
| `layouts` | Container queries & grid | `.container-query`, `.grid-responsive` |
| `components` | Reusable patterns | `.surface-elevated`, `.glow-primary`, `.glass` |
| `utilities` | Single-purpose classes | `.text-display`, `.animate-slide-up` |
| `overrides` | Specific overrides | Focus-visible states |

---

## Design Tokens

### Color Tokens

```css
/* Original Magnus Copo colors (preserved) */
--primary: 239 84% 67%;        /* Electric Indigo #6366F1 */
--accent: 188 94% 43%;          /* Cyan #06B6D4 */
--background: 222 47% 4%;       /* Midnight Navy #0B0F19 */

/* Extended tokens */
--color-surface-elevated: color-mix(in srgb, hsl(var(--background)) 95%, white 5%);
--color-glow-primary: rgba(99, 102, 241, 0.15);
--color-glow-accent: rgba(6, 182, 212, 0.15);
--color-overlay: rgba(11, 15, 25, 0.8);
--color-divider: color-mix(in srgb, hsl(var(--border)) 50%, transparent 50%);
```

### Motion Tokens

```css
/* Duration scale */
--duration-instant: 0ms;
--duration-fast: 150ms;         /* Quick interactions */
--duration-base: 250ms;         /* Default animations */
--duration-slow: 350ms;         /* Deliberate transitions */
--duration-slower: 500ms;       /* Dramatic effects */

/* Easing functions */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);        /* Smooth deceleration */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);      /* Bouncy interactions */
--ease-in-out-quad: cubic-bezier(0.45, 0, 0.55, 1);    /* Balanced timing */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55); /* Playful bounce */
```

**Usage in Tailwind:**
```jsx
<button className="transition-transform duration-fast ease-out-expo hover:scale-105">
  Click Me
</button>
```

### Spatial System (8px Grid)

```css
--space-1: 0.25rem;   /* 4px  - Micro spacing */
--space-2: 0.5rem;    /* 8px  - Base unit */
--space-3: 0.75rem;   /* 12px - Compact padding */
--space-4: 1rem;      /* 16px - Default spacing */
--space-6: 1.5rem;    /* 24px - Section spacing */
--space-8: 2rem;      /* 32px - Large gaps */
--space-12: 3rem;     /* 48px - Major sections */
--space-16: 4rem;     /* 64px - Hero spacing */
```

**Tailwind Classes:**
```jsx
<div className="p-4 gap-6 mt-8">
  {/* Padding: 16px, Gap: 24px, Margin-top: 32px */}
</div>
```

### Depth System (Shadows)

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.5), 0 4px 6px -4px rgb(0 0 0 / 0.5);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.6);

/* Glow effects for interactive elements */
--shadow-glow-primary: 0 0 20px var(--color-glow-primary);
--shadow-glow-accent: 0 0 20px var(--color-glow-accent);
```

**Tailwind Classes:**
```jsx
<div className="shadow-lg hover:shadow-glow-primary transition-shadow duration-base">
  Card with hover glow
</div>
```

### Typography Tokens

```css
/* Fluid typography for responsive displays */
--font-size-display: clamp(2.5rem, 5vw + 1rem, 4rem);  /* 40px-64px */
--font-size-heading: clamp(1.5rem, 3vw + 0.5rem, 2.5rem); /* 24px-40px */

/* Line heights */
--line-height-tight: 1.2;    /* Headings */
--line-height-normal: 1.6;   /* Body text */
--line-height-relaxed: 1.8;  /* Long-form content */

/* Letter spacing */
--letter-spacing-tight: -0.025em;  /* Modern heading style */
--letter-spacing-normal: 0em;      /* Body text */
--letter-spacing-wide: 0.025em;    /* Uppercase labels */
```

**Tailwind Classes:**
```jsx
<h1 className="text-display font-bold tracking-tight">
  Hero Title
</h1>
<p className="text-body leading-normal">
  Readable body content
</p>
```

---

## Component Patterns

### Surface Elevated (Cards & Modals)

Uses `color-mix()` for modern elevated backgrounds:

```jsx
// Old approach
<div className="bg-card border border-border rounded-lg">

// New Design System 2.0
<div className="surface-elevated p-6">
  {/* Automatically gets elevated background, border, and radius */}
</div>

// With large shadow
<div className="surface-elevated-lg p-8">
  {/* Elevated + box-shadow-lg */}
</div>
```

**CSS Implementation:**
```css
.surface-elevated {
  background-color: var(--color-surface-elevated);
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}
```

### Glow Effects

Add ethereal glow to interactive elements:

```jsx
// Primary glow (Indigo)
<button className="glow-primary hover:glow-primary-lg transition-shadow duration-base">
  Important Action
</button>

// Accent glow (Cyan)
<div className="glow-accent">
  Featured Content
</div>
```

### Glass Morphism

Modern translucent surfaces with backdrop blur:

```jsx
<div className="glass p-6 rounded-lg">
  {/* Semi-transparent background with 12px blur */}
  <h3>Glass Card</h3>
</div>
```

**CSS Implementation:**
```css
.glass {
  background: color-mix(in srgb, hsl(var(--background)) 80%, transparent 20%);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, hsl(var(--border)) 40%, transparent 60%);
}
```

### Interactive States

Smooth hover/active transitions:

```jsx
<div className="interactive surface-elevated p-4">
  {/* Lifts on hover, presses on active */}
</div>
```

**CSS Behavior:**
- Hover: `translateY(-2px)` + `shadow-lg`
- Active: `translateY(0)` + instant transition
- Uses `--ease-out-expo` for smooth feel

### Skeleton Loading

Animated loading placeholders:

```jsx
<div className="skeleton h-4 w-full rounded"></div>
<div className="skeleton h-8 w-3/4 rounded mt-2"></div>
```

Automatically animates with a shimmer effect (1.5s loop).

---

## Container Queries

Modern component-level responsiveness (no media queries needed):

### Dashboard Cards

```jsx
<div className="dashboard-card container-query">
  <div className="dashboard-card-content">
    {/* Padding: 16px at <320px, 24px at >480px */}
  </div>
</div>
```

### Kanban Columns

```jsx
<div className="kanban-column container-query">
  <div className="kanban-card">
    {/* Adaptive padding based on column width */}
  </div>
</div>
```

### Responsive Grid

```jsx
<div className="grid-responsive container-query gap-4">
  {/* 2 cols at 400px, 3 cols at 600px, 4 cols at 800px */}
  {items.map(item => <Card key={item.id} />)}
</div>
```

**To enable full container query support:**
```bash
npm install @tailwindcss/container-queries
```

---

## Animation Utilities

Pre-built animation patterns:

```jsx
// Fade in on mount
<div className="animate-in">Content</div>

// Slide up (10px → 0)
<div className="animate-slide-up">Panel</div>

// Slide down (-10px → 0)
<div className="animate-slide-down">Dropdown</div>

// Scale in with spring easing
<div className="animate-scale-in">Modal</div>
```

All animations respect `prefers-reduced-motion` (fallback to 0.01ms duration).

---

## Accessibility Features

### Motion Preferences

Automatically respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Focus States

Enhanced focus-visible indicators:

```jsx
<button className="focus-ring">
  {/* 2px outline with 4px offset on focus-visible */}
</button>
```

Removes outline for mouse users (`:focus:not(:focus-visible)`).

### Smooth Scrolling

Enabled globally with sticky header offset:

```css
html {
  scroll-behavior: smooth;
  scroll-padding-top: 4rem; /* Accounts for fixed headers */
}
```

---

## Migration Guide

### Gradual Adoption

All existing Tailwind classes still work. Migrate incrementally:

#### Phase 1: Replace Arbitrary Values
```jsx
// Before
<div className="m-[13px] p-[18px]">

// After (use design tokens)
<div className="m-3 p-4">  /* 12px, 16px - aligned to 8px grid */
```

#### Phase 2: Use New Component Classes
```jsx
// Before
<div className="bg-card border border-border rounded-lg shadow-md">

// After
<div className="surface-elevated shadow-md">
```

#### Phase 3: Apply Glow Effects
```jsx
// Before
<button className="bg-primary text-white hover:opacity-80">

// After
<button className="bg-primary text-white glow-primary hover:glow-primary-lg">
```

#### Phase 4: Container Queries
```jsx
// Before (media queries in CSS)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// After (container-based)
<div className="grid-responsive container-query">
```

---

## Z-Index Scale

Predictable layering system:

```css
--z-index-dropdown: 1000;
--z-index-sticky: 1020;
--z-index-fixed: 1030;
--z-index-modal-backdrop: 1040;
--z-index-modal: 1050;
--z-index-popover: 1060;
--z-index-tooltip: 1070;
```

**Tailwind Usage:**
```jsx
<div className="z-modal">Modal Dialog</div>
<div className="z-tooltip">Tooltip</div>
```

---

## Browser Support

- **Cascade Layers:** Chrome 99+, Safari 15.4+, Firefox 97+
- **Container Queries:** Chrome 105+, Safari 16+, Firefox 110+
- **color-mix():** Chrome 111+, Safari 16.2+, Firefox 113+
- **Backdrop Filter:** Chrome 76+, Safari 9+, Firefox 103+

All features gracefully degrade in older browsers.

---

## Performance Considerations

✅ **Variable Fonts Recommended:** Use Inter/Geist for optimal performance  
✅ **CSS Variables:** Faster than Sass/preprocessor compilation  
✅ **Cascade Layers:** Reduces specificity conflicts (fewer overrides)  
✅ **Motion Tokens:** Consistent 60fps animations  
✅ **Container Queries:** Eliminates global media query recalculations  

---

## Developer Tools

### VS Code Extensions
- **Tailwind CSS IntelliSense** - Auto-complete for design tokens
- **CSS Var Complete** - Auto-complete for `var(--*)` tokens

### Testing
```bash
# Build and check for CSS errors
npm run build

# Check accessibility with motion preferences
# DevTools → Rendering → Emulate CSS media prefers-reduced-motion
```

---

## Examples

### Dashboard Card with Full Features

```jsx
<div className="surface-elevated-lg container-query interactive animate-slide-up">
  <div className="dashboard-card-content space-y-4">
    <h2 className="text-heading">Requirements Overview</h2>
    <div className="grid-responsive gap-4">
      {/* Cards auto-layout based on container width */}
    </div>
  </div>
</div>
```

### Modal with Glass Effect

```jsx
<div className="fixed inset-0 z-modal">
  <div className="glass surface-elevated-lg animate-scale-in max-w-2xl mx-auto p-8">
    <h1 className="text-display mb-6">Create Requirement</h1>
    {/* Modal content */}
  </div>
</div>
```

### Button with Glow Hover

```jsx
<button className="
  bg-primary text-white
  px-6 py-3 rounded-lg
  glow-primary hover:glow-primary-lg
  transition-shadow duration-base ease-out-expo
  focus-ring
">
  Submit Application
</button>
```

---

## Changelog

### Version 2.0.0 (February 2026)

**Added:**
- CSS Cascade Layers architecture
- Motion design tokens (duration, easing)
- Spatial system (8px grid)
- Depth system (layered shadows + glows)
- Fluid typography with clamp()
- Container queries support
- Reduced motion preferences
- Modern CSS reset
- Component classes (surface-elevated, glass, interactive)
- Animation utilities (slide-up, scale-in, fade-in)
- Z-index scale

**Preserved:**
- All original Magnus Copo color tokens
- Existing Tailwind class compatibility
- Component logic unchanged

---

## Support

For questions or issues with Design System 2.0:
1. Check this documentation first
2. Review [globals.css](app/globals.css) for implementation details
3. Inspect [tailwind.config.ts](tailwind.config.ts) for extended tokens
4. Test in DevTools with container query panel

**Pro Tip:** Use browser DevTools → Rendering → "Show container queries" to visualize container breakpoints.
