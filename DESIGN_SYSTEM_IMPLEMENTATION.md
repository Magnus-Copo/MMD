# MagnusCopo Design System v2.0 - Implementation Complete

## Overview

This document summarizes the comprehensive design system upgrade implemented for the Magnus Copo Staffing Operations System, based on neuropsychology principles for optimal user experience.

## Design Philosophy

1. **"Cognitive Load is the enemy"** - Externalize memory with visible stage, owner, SLA, last activity, next action
2. **"Scanning beats reading"** - 8px grid, consistent card structure, fixed column alignment
3. **"Make actions reversible"** - Undo toast, autosave drafts
4. **"Dense UI but visually calm"** - High information density, low visual noise

## Brand Colors

```
MagnusCopo Palette:
├── Deep Indigo: #1700ae (--brand-700)
├── Strong Blue:  #001bff (--brand-500)
├── Gold:         #a69624 (--gold)
├── Coral:        #ff6b35 (--coral)
└── Neutrals:     Slate scale
```

### Semantic Color Language
- **Blue** = Trusted, completed, active
- **Gold** = VIP, priority, special
- **Coral** = Pending, waiting for response (soft attention)
- **Red** = Error only (static, not pulsing)
- **Green** = Success, confirmation (brief pop animation)

## Motion System

```
Timing Scale:
├── micro:  120ms  (button press, checkbox)
├── fast:   180ms  (tooltips, micro-feedback)
├── base:   220ms  (standard transitions)
├── normal: 300ms  (panels, modals)
├── slow:   450ms  (page transitions)
└── slower: 600ms  (complex animations)

Premium Bezier: cubic-bezier(0.22, 0.9, 0.33, 1)
```

## New Components

### 1. SLAProgressRing (`components/ui/SLAProgressRing.tsx`)
- Visual progress ring for temporal urgency
- Color changes only near breach (80% warning, 90% critical)
- Optional pulse animation for critical states
- Supports compact and large variants

### 2. MissionCard (`components/ui/MissionCard.tsx`)
- Core staffing card with fixed layout positions
- Left: Avatar/Name, Middle: Stage/Activity, Right: Owner/SLA/Actions
- Quick actions limited to 3 (Hick's law)
- VIP badge with gold gradient
- Coral pulse for blocked states

### 3. UndoToast (`components/ui/UndoToast.tsx`)
- High-trust undo pattern for destructive actions
- Progress countdown bar
- Optimistic UI support with rollback
- Success toast with micro-spark effect
- Context provider for global access

### 4. StatusBadge (`components/ui/StatusBadge.tsx`) - Updated
- New semantic color system
- Coral pulse for pending states
- Success pop animation
- Size variants (xs, sm, md)
- Reduced motion support

### 5. GlassCard (`components/ui/GlassCard.tsx`) - Updated
- Added lightMode prop for light-themed contexts
- LightCard export for common use case
- Premium hover lift effect
- MissionCardWrapper export

## Updated Components

### KPICard (`components/dashboard/KPICard.tsx`)
- MagnusCopo brand color palette
- New color variants: gold, coral
- lightMode support
- Decorative progress bar with premium animation
- Improved trend indicators

### Sidebar (`components/layout/Sidebar.tsx`)
- MagnusCopo brand gradient
- Framer Motion animated collapse/expand
- Premium active indicator bar
- Reduced motion support

### NeuroBackground (`components/layout/NeuroBackground.tsx`)
- MagnusCopo branded shaders
- New 'mesh' variant
- Performance optimization
- Reduced motion fallback

## CSS Architecture

### Tailwind Extensions (`tailwind.config.ts`)
- Brand color scale (brand-50 to brand-900)
- Gold color scale
- Coral color scale
- Motion utilities (duration-micro, duration-fast, etc.)
- Glow shadows (glow-brand, glow-gold, glow-coral)

### CSS Custom Properties (`globals.css`)
- Complete token system
- Semantic color mappings
- Motion timing variables
- Shadow definitions

### Sass Module (`styles/_components.scss`)
- Component mixins (card-hover-lift, micro-feedback, focus-ring)
- Dopamine micro-rewards (success-check, stage-move-ripple, micro-spark)
- Attention states (badge-pending, badge-vip, badge-error)
- Utility patterns

## Animation Library (`lib/animations.ts`)

### Presets Available
- `fadeIn` / `fadeInUp` / `fadeInDown`
- `slideUp` / `slideDown` / `slideLeft` / `slideRight`
- `cardHover` - Premium card lift effect
- `buttonPress` - Micro-feedback for buttons
- `drawerSlide` - Side panel animation
- `modalScale` - Modal entrance
- `successPop` - Success feedback
- `warningPulse` / `criticalPulse` - Urgency indicators
- `toastSlideUp` - Toast notification
- `pageTransition` - Page-level transitions

## Usage Examples

### Using SLAProgressRing
```tsx
<SLAProgressRing
  progress={0.85}  // 85% elapsed
  label="2h"
  breached={false}
  size={36}
/>
```

### Using MissionCard
```tsx
<MissionCard
  id="123"
  name="John Smith"
  status="Interview Scheduled"
  stage="Interview"
  owner="Jane Doe"
  slaProgress={0.6}
  isVIP
  quickActions={[
    { icon: Mail, label: "Send Email", onClick: () => {} },
    { icon: Phone, label: "Call", onClick: () => {} },
  ]}
/>
```

### Using UndoToast
```tsx
const { showUndoToast, showSuccess } = useUndoToast()

// For destructive actions
showUndoToast({
  type: 'undo',
  title: 'Candidate archived',
  message: '5 seconds to undo',
  onUndo: () => restoreCandidate(id),
})

// For success feedback
showSuccess('Submission sent', 'Email delivered successfully')
```

## Accessibility

All components include:
- `prefers-reduced-motion` respect via `useReducedMotion` hook
- ARIA labels and roles
- Keyboard navigation support
- Focus visible styles
- Screen reader considerations

## File Structure

```
components/
├── ui/
│   ├── index.ts          # Central exports
│   ├── SLAProgressRing.tsx
│   ├── MissionCard.tsx
│   ├── UndoToast.tsx
│   ├── StatusBadge.tsx
│   └── GlassCard.tsx
├── dashboard/
│   └── KPICard.tsx
└── layout/
    ├── Sidebar.tsx
    └── NeuroBackground.tsx

lib/
└── animations.ts         # Framer Motion presets

styles/
└── _components.scss      # Sass patterns

app/
└── globals.css           # CSS tokens & base styles

tailwind.config.ts        # Extended theme
```

## Next Steps

1. Apply design system to remaining pages
2. Create Storybook documentation
3. Add visual regression tests
4. Implement dark mode toggle (tokens ready)
5. Performance audit on animations
