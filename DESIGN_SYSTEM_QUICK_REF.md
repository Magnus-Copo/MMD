# Design System 2.0 - Quick Reference

## 🎨 Common Patterns

### Cards & Surfaces
```jsx
// Standard elevated card
<div className="surface-elevated p-6">

// Card with large shadow
<div className="surface-elevated-lg p-8">

// Glass morphism card
<div className="glass p-6 rounded-lg">

// Interactive card (hover lift)
<div className="interactive surface-elevated p-4">
```

### Buttons & Actions
```jsx
// Primary with glow
<button className="
  bg-primary text-white px-6 py-3 rounded-lg
  glow-primary hover:glow-primary-lg
  transition-shadow duration-base ease-out-expo
">

// Secondary with focus ring
<button className="
  bg-secondary text-foreground px-4 py-2 rounded-md
  focus-ring transition-colors duration-fast
">

// Danger with scale animation
<button className="
  bg-destructive text-white px-4 py-2 rounded-md
  hover:scale-105 transition-transform duration-fast ease-spring
">
```

### Typography
```jsx
// Hero display text
<h1 className="text-display font-bold tracking-tight">

// Section heading
<h2 className="text-heading font-semibold tracking-tight">

// Body paragraph
<p className="text-body leading-normal text-muted-foreground">

// Small label
<span className="text-sm tracking-wide uppercase text-muted-foreground">
```

### Animations
```jsx
// Fade in on mount
<div className="animate-in">

// Slide up from below
<div className="animate-slide-up">

// Slide down from above  
<div className="animate-slide-down">

// Scale in with spring
<div className="animate-scale-in">
```

### Spacing (8px Grid)
```jsx
// Common spacing patterns
<div className="p-4">     {/* 16px padding */}
<div className="gap-6">   {/* 24px gap */}
<div className="mt-8">    {/* 32px margin-top */}
<div className="space-y-3"> {/* 12px vertical spacing */}
```

### Shadows & Depth
```jsx
<div className="shadow-sm">    {/* Subtle shadow */}
<div className="shadow-md">    {/* Default shadow */}
<div className="shadow-lg">    {/* Large shadow */}
<div className="shadow-glow-primary"> {/* Indigo glow */}
<div className="shadow-glow-accent">  {/* Cyan glow */}
```

### Container Queries
```jsx
// Responsive grid (no media queries!)
<div className="container-query grid-responsive gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Dashboard card with adaptive padding
<div className="dashboard-card container-query">
  <div className="dashboard-card-content">
    {/* Content */}
  </div>
</div>

// Kanban column with adaptive layout
<div className="kanban-column container-query">
  <div className="kanban-card">
    {/* Card content */}
  </div>
</div>
```

---

## 🎯 Token Reference

### Motion
| Token | Value | Use Case |
|-------|-------|----------|
| `duration-instant` | 0ms | Disable animations |
| `duration-fast` | 150ms | Quick interactions (hover, focus) |
| `duration-base` | 250ms | Default transitions |
| `duration-slow` | 350ms | Deliberate state changes |
| `ease-out-expo` | Smooth deceleration | Most animations |
| `ease-spring` | Bouncy feel | Scale, transform |

**Tailwind:**
```jsx
className="transition-all duration-fast ease-out-expo"
className="transition-transform duration-base ease-spring"
```

### Spacing (8px Base)
| Class | Pixels | Use Case |
|-------|--------|----------|
| `space-1` / `p-1` | 4px | Micro spacing |
| `space-2` / `p-2` | 8px | Tight spacing |
| `space-3` / `p-3` | 12px | Compact padding |
| `space-4` / `p-4` | 16px | Default spacing |
| `space-6` / `p-6` | 24px | Section padding |
| `space-8` / `p-8` | 32px | Large gaps |
| `space-12` / `p-12` | 48px | Major sections |

### Shadows
| Class | Use Case |
|-------|----------|
| `shadow-sm` | Subtle elevation |
| `shadow-md` | Cards, dropdowns |
| `shadow-lg` | Modals, popovers |
| `shadow-xl` | Hero sections |
| `shadow-glow-primary` | Interactive primary |
| `shadow-glow-accent` | Featured accent |

### Z-Index
| Class | Value | Use Case |
|-------|-------|----------|
| `z-dropdown` | 1000 | Dropdown menus |
| `z-sticky` | 1020 | Sticky headers |
| `z-modal` | 1050 | Modal dialogs |
| `z-popover` | 1060 | Popovers |
| `z-tooltip` | 1070 | Tooltips |

---

## 🔄 Migration Cheatsheet

### Replace Arbitrary Values
```jsx
// ❌ Before
<div className="m-[13px] p-[18px] gap-[22px]">

// ✅ After (aligned to 8px grid)
<div className="m-3 p-4 gap-6">
```

### Upgrade Cards
```jsx
// ❌ Before
<div className="bg-card border border-border rounded-lg shadow-md">

// ✅ After
<div className="surface-elevated shadow-md">
```

### Add Glows
```jsx
// ❌ Before
<button className="bg-primary hover:opacity-80">

// ✅ After
<button className="bg-primary glow-primary hover:glow-primary-lg transition-shadow duration-base">
```

### Container Queries
```jsx
// ❌ Before (global media queries)
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

// ✅ After (component-scoped)
<div className="container-query grid-responsive">
```

---

## 🛠️ Installation

### Required (Already Installed)
- Tailwind CSS 3.4+
- tailwindcss-animate

### Optional (Enhanced Features)
```bash
npm install @tailwindcss/container-queries
```

Enables advanced container query utilities beyond basic CSS `@container`.

---

## 📱 Responsive Strategy

### Old Way: Media Queries
```jsx
<div className="text-base md:text-lg lg:text-xl">
```

### New Way: Fluid Typography
```jsx
<h1 className="text-display"> {/* Auto-scales 40px-64px */}
<h2 className="text-heading"> {/* Auto-scales 24px-40px */}
```

### New Way: Container Queries
```jsx
<div className="container-query">
  <div className="grid-responsive"> {/* Adapts to container width */}
```

---

## ⚡ Performance Tips

1. **Use Design Tokens** - Faster than inline styles
2. **Leverage Cascade Layers** - Reduces specificity conflicts
3. **Container Queries** - Better than global media queries
4. **Respect Motion Preferences** - Auto-handled in CSS reset
5. **Variable Fonts** - Use Inter/Geist for optimal loading

---

## 🎓 Examples in Codebase

Look for these patterns in existing components:

### Dashboard Cards
```jsx
// app/(dashboard)/dashboard/page.tsx
<div className="surface-elevated-lg animate-slide-up">
```

### Forms
```jsx
// components/forms/*.tsx
<input className="focus-ring transition-colors duration-fast">
```

### Modals
```jsx
// Future modals should use:
<div className="glass surface-elevated-lg animate-scale-in">
```

---

## 🐛 Troubleshooting

### "Container query not working"
Install plugin: `npm install @tailwindcss/container-queries`

### "Animation stuttering"
Check if user has motion preferences enabled (auto-handled by CSS)

### "Glow not showing"
Ensure element has some padding/margin for shadow to be visible

### "Spacing feels off"
Stick to 8px grid multiples: 4, 8, 12, 16, 24, 32, 48, 64

---

## 📚 Full Documentation
See [DESIGN_SYSTEM_2.0.md](DESIGN_SYSTEM_2.0.md) for complete details.
