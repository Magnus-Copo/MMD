# MMDSS Micro-Interactions Implementation Guide

## 🎯 Overview

Comprehensive micro-interactions have been implemented across MMDSS to enhance user experience with subtle animations, tactile feedback, and smooth transitions.

---

## ✨ Implemented Features

### 1. Button Interactions

#### Magnetic/Elastic Buttons
Buttons now have subtle scale and lift effects on hover with spring easing.

**CSS Classes:**
- `.btn-primary` - Primary action buttons with indigo glow
- `.btn-secondary` - Secondary buttons with shadow lift
- `.btn-accent` - Accent buttons with cyan glow

**Effects:**
- Hover: `translateY(-1px) scale(1.02)` + shadow glow
- Active: `scale(0.98)` with instant transition (tactile press)
- Transition: Spring easing (cubic-bezier(0.34, 1.56, 0.64, 1))

**Usage:**
```tsx
import InteractiveButton from '@/components/ui/InteractiveButton'

<InteractiveButton variant="primary" isLoading={isPending} loadingText="Saving...">
  Submit Form
</InteractiveButton>
```

#### Loading States
- Animated spinner with 0.6s rotation
- Button text remains (prevents layout shift)
- Opacity reduced to 0.7
- Pointer events disabled during loading

---

### 2. Hover Effects

#### Row Highlight in Tables
Interactive table rows with left border accent animation.

**CSS Class:** `.table-row-interactive`

**Effects:**
- Subtle background: `rgba(99, 102, 241, 0.05)`
- Left border (2px cyan) slides in with spring easing
- Cursor changes to pointer
- 150ms transition duration

**Usage:**
```tsx
<tr className="table-row-interactive">
  <td>Row content</td>
</tr>
```

#### Card Lift Effects
Cards lift on hover with smooth shadow transition.

**CSS Class:** `.card-interactive`

**Effects:**
- Hover: `translateY(-2px)` + `shadow-lg`
- Active: Returns to original position instantly
- 250ms ease-out-expo transition

**Usage:**
```tsx
import InteractiveCard from '@/components/ui/InteractiveCard'

<InteractiveCard variant="elevated" glow="primary" interactive>
  Card content
</InteractiveCard>
```

#### Icon Animations

**Available Animations:**
- `icon-bounce` - Bounces on hover (6px travel)
- `icon-shake` - Shakes horizontally (for alerts)
- `icon-rotate` - 180° rotation (for accordions)
- `icon-morph` - Plus to X morphing (45° rotation)

**Usage:**
```tsx
import AnimatedIcon from '@/components/ui/AnimatedIcon'
import { ChevronDown } from 'lucide-react'

<AnimatedIcon 
  icon={ChevronDown} 
  animation="rotate" 
  rotated={isOpen} 
  size={20} 
/>
```

---

### 3. Focus States (Accessibility + Aesthetics)

#### Enhanced Focus Ring
- Replaces default browser outline
- 2px solid primary color
- 2px offset initially, grows to 4px on focus
- Only visible for keyboard navigation (`:focus-visible`)
- Mouse clicks don't show focus rings

**CSS Classes:**
- `.focus-ring-enhanced` - Single ring with growing offset
- `.focus-ring-double` - Double ring effect (2px background + 4px primary)

**Auto-applied** to InteractiveButton component.

---

### 4. Active States

All interactive elements have instant tactile feedback:
- **Scale down:** 0.98 on click
- **Brightness:** Darken by 10%
- **Duration:** Instant (0ms) for immediate response

**CSS Class:** `.active-press`

---

### 5. Module-Specific Enhancements

#### Module 2: Dashboard (AdminMiniReports)
✅ **Implemented:**
- KPI cards use `InteractiveCard` with hover lift
- Count-up animation for numbers using `CountUp` component
- Icons bounce on hover
- Smooth glow effects on primary card

**Example:**
```tsx
<InteractiveCard glow="primary">
  <CountUp value={followupsToday} duration={1000} />
</InteractiveCard>
```

#### Module 4: Requirements (Coming Soon)
🔜 **Planned:**
- Status badge smooth color transitions (300ms)
- MMD-ID copy with toast notification
- Create button pulse glow when form valid
- Table row highlight with accent border

#### Module 6: Workflow (Coming Soon)
🔜 **Planned:**
- Status dropdown checkmark scale-in animation
- Wiggle animation for blocked state transitions
- Timeline items stagger-in (0.1s delay each)

#### Module 7: Activities (Coming Soon)
🔜 **Planned:**
- Activity item slide-in from right when added
- Fade + collapse animation on delete
- Type icons bounce on hover

#### Module 8: Candidates (Coming Soon)
🔜 **Planned:**
- Pipeline drag-drop ghost preview with rotation
- Status change color transition (300ms)
- Avatar gradient backgrounds with initials

---

## 🎨 Component Library

### InteractiveButton
Full-featured button with loading states and variants.

**Props:**
- `variant`: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `isLoading`: boolean - Shows spinner
- `loadingText`: string - Optional loading text
- `pulseOnValid`: boolean - Pulse glow when ready

**Example:**
```tsx
<InteractiveButton 
  variant="primary" 
  size="lg"
  isLoading={isPending}
  pulseOnValid={isFormValid}
>
  Save Changes
</InteractiveButton>
```

### InteractiveCard
Card component with hover lift and glow effects.

**Props:**
- `variant`: 'default' | 'elevated' | 'glass'
- `interactive`: boolean - Enable hover lift
- `glow`: 'primary' | 'accent' | 'none'

**Example:**
```tsx
<InteractiveCard variant="elevated" glow="primary">
  Dashboard widget content
</InteractiveCard>
```

### AnimatedIcon
Icon wrapper with animation presets.

**Props:**
- `icon`: LucideIcon - Icon component
- `animation`: 'bounce' | 'shake' | 'rotate' | 'morph' | 'none'
- `rotated`: boolean - For rotate animation
- `morphed`: boolean - For morph animation
- `size`: number - Icon size

**Example:**
```tsx
<AnimatedIcon icon={Bell} animation="shake" size={20} />
```

### StatusBadge
Status badge with smooth color transitions.

**Props:**
- `status`: string - Status name
- `className`: string - Additional classes

**Auto-maps** statuses to colors:
- Open, Filled, Placed → Green
- In Progress, Interview → Orange
- Cancelled, Rejected → Red
- On Hold, Withdrawn → Gray

**Example:**
```tsx
<StatusBadge status="In Progress" />
```

### CopyToast + useCopyToClipboard
Toast notification for copy success.

**Usage:**
```tsx
import { CopyToast, useCopyToClipboard } from '@/components/ui/CopyToast'

function Component() {
  const { isCopied, copy } = useCopyToClipboard()
  
  return (
    <>
      <button onClick={() => copy('MMD-12345')}>Copy ID</button>
      <CopyToast show={isCopied} message="MMD ID Copied!" />
    </>
  )
}
```

### CountUp
Animated number count-up effect.

**Props:**
- `value`: number - Final value
- `duration`: number - Animation duration (ms)
- `className`: string

**Example:**
```tsx
<CountUp value={stalledCount} duration={1000} />
```

---

## 🚀 Performance Optimizations

### GPU-Accelerated Transforms
All animations use **compositor-only properties**:
- `transform` - Never animates left/top/width/height
- `opacity` - Smooth fade effects
- `will-change` applied sparingly

### Debounced Hover
Rapid mouse movements don't trigger excessive state changes.

**CSS Class:** `.hover-debounce`
- 50ms delay on hover out
- 0ms delay on hover in
- Prevents flickering on cursor movement

### Respect User Preferences
All animations disabled when user prefers reduced motion:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📋 CSS Animation Reference

### Keyframe Animations

| Animation | Duration | Easing | Use Case |
|-----------|----------|--------|----------|
| `spin` | 0.6s | linear | Button loading spinner |
| `shake` | 0.5s | spring | Alert/error feedback |
| `bounce` | 0.6s | spring | Icon hover effects |
| `wiggle` | 0.4s | in-out-quad | Blocked actions |
| `pulse-glow` | 2s | in-out-quad | Valid form highlight |
| `stagger-in` | 0.25s | out-expo | Timeline items |
| `fade-collapse` | 0.35s | out-expo | Item removal |
| `copy-toast` | 2s | out-expo | Copy success notification |

### Stagger Delays
CSS provides nth-child delays up to 10 items (0.1s intervals).

**Usage:**
```tsx
<div>
  <div className="stagger-item">Item 1</div>
  <div className="stagger-item">Item 2</div>
  <div className="stagger-item">Item 3</div>
  {/* Auto-staggers with 0.1s delay */}
</div>
```

---

## 🎭 Framer Motion Integration

Framer Motion is installed for advanced animations (AnimatePresence, layout animations).

**Available Now:**
- `CopyToast` - Uses AnimatePresence for enter/exit
- `CountUp` - Smooth number transitions
- Future: Activity item animations, modal transitions

**Example Pattern:**
```tsx
import { motion, AnimatePresence } from 'framer-motion'

<AnimatePresence mode="wait">
  {items.map(item => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

---

## 🧪 Testing Micro-Interactions

### Manual Testing Checklist

**Buttons:**
- [ ] Hover shows lift + glow
- [ ] Click shows scale-down feedback
- [ ] Loading state shows spinner without layout shift
- [ ] Disabled buttons have reduced opacity

**Cards:**
- [ ] Hover lifts card by 2px
- [ ] Shadow transitions from sm → lg
- [ ] Active state returns to original position

**Icons:**
- [ ] Bounce animation on hover
- [ ] Rotate animation completes in 250ms
- [ ] Shake animation doesn't interfere with layout

**Focus:**
- [ ] Tab navigation shows focus ring
- [ ] Mouse clicks don't show focus ring
- [ ] Focus ring grows from 2px to 4px offset

**Accessibility:**
- [ ] Enable "Reduce Motion" in OS → animations disabled
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen readers announce state changes

---

## 📊 Browser Compatibility

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| CSS Animations | ✅ All | ✅ All | ✅ All | ✅ All |
| Transform/Opacity | ✅ All | ✅ All | ✅ All | ✅ All |
| :focus-visible | ✅ 86+ | ✅ 15.4+ | ✅ 85+ | ✅ 86+ |
| Framer Motion | ✅ All | ✅ All | ✅ All | ✅ All |
| will-change | ✅ 36+ | ✅ 9.1+ | ✅ 36+ | ✅ 79+ |

**Graceful Degradation:** All animations degrade to instant state changes in older browsers.

---

## 🔧 Customization

### Adjusting Animation Speed
Modify CSS variables in `globals.css`:

```css
:root {
  --duration-fast: 100ms;    /* Faster (default: 150ms) */
  --duration-base: 200ms;    /* Faster (default: 250ms) */
  --duration-slow: 300ms;    /* Faster (default: 350ms) */
}
```

### Changing Easing Functions
```css
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);        /* Smooth */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);      /* Bouncy */
  --ease-in-out-quad: cubic-bezier(0.45, 0, 0.55, 1);    /* Balanced */
}
```

### Disabling Animations Globally
Add to `globals.css`:

```css
* {
  animation: none !important;
  transition: none !important;
}
```

---

## 🚦 Implementation Status

### ✅ Phase 1: Core Interactions (Complete)
- [x] Button interactions (magnetic, elastic, loading)
- [x] Card lift effects
- [x] Icon animations (bounce, shake, rotate, morph)
- [x] Enhanced focus states
- [x] Active press feedback
- [x] CSS animation library
- [x] Framer Motion integration
- [x] Component library (InteractiveButton, InteractiveCard, etc.)

### 🔜 Phase 2: Module-Specific (In Progress)
- [x] Dashboard KPI cards (AdminMiniReports)
- [ ] Requirements table row highlights
- [ ] Candidate pipeline animations
- [ ] Workflow timeline stagger
- [ ] Activity item slide-in/collapse

### 🔮 Phase 3: Advanced (Planned)
- [ ] Page transition animations (View Transitions API)
- [ ] Drag-drop with ghost preview
- [ ] Parallax scroll effects
- [ ] Confetti on placement success
- [ ] Toast notification system

---

## 📚 Resources

- **Design System 2.0:** See `DESIGN_SYSTEM_2.0.md`
- **CSS Tokens:** See `globals.css` @layer tokens
- **Component Examples:** See `components/ui/Interactive*.tsx`
- **Framer Motion Docs:** https://www.framer.com/motion/

---

## 🐛 Known Issues

1. **Container Queries Warning:** `@tailwindcss/container-queries` not installed
   - **Fix:** Run `npm install @tailwindcss/container-queries`
   - **Impact:** Limited - container query utilities fall back to CSS @container

2. **InteractiveButton TypeScript:** `as="a"` prop not in ButtonHTMLAttributes
   - **Status:** Low priority - use regular `<a>` with button classes if needed

---

## ✨ Next Steps

1. **Apply to Remaining Components:**
   - Update `AutomationPanel.tsx` buttons
   - Update `TemplateEditor.tsx` buttons
   - Update `WorkLogger.tsx` buttons

2. **Add Module-Specific Interactions:**
   - Requirements: Status badge transitions + copy toast
   - Workflow: Wiggle animation for blocked transitions
   - Activities: Slide-in + collapse animations
   - Candidates: Avatar gradients + status transitions

3. **Performance Monitoring:**
   - Measure FPS during animations
   - Test on low-end devices
   - Optimize will-change usage

4. **User Testing:**
   - Gather feedback on animation speed
   - Test accessibility with screen readers
   - Verify reduced motion preferences work

---

**Design System Engineer:** GitHub Copilot  
**Date:** February 2, 2026  
**Version:** Micro-Interactions 1.0  
**Status:** ✅ Core Features Complete, Module Integration In Progress
