# Theme System

Centralized theme and styling configurations with dark mode optimization for Telegram Mini Apps.

## Architecture

```
theme/
├── claude-code/          # Systematic color theme engine (Tailwind integration)
│   ├── colors/          # Modular color palette by category
│   └── types.ts         # TypeScript color system interfaces
└── dark/                # Dark theme constants and utilities
    ├── animations.ts    # Motion, transitions, scale effects
    ├── cards.ts         # Card and list item Tailwind classes
    ├── categories.ts    # Transaction category colors & icons
    ├── currencies.ts    # Currency icons & branded colors
    ├── gradients.ts     # Background & UI element gradients
    ├── layouts.ts       # Flexbox & grid layout patterns
    └── index.ts         # Central export hub
```

## Color Palette

### Currencies (Branded Colors)
Maps ISO currency codes to meaningful colors and icons:

| Currency | Color | Icon | Meaning |
|----------|-------|------|---------|
| **USD** | `#10B981` (Green) | $ DollarSign | American dollar |
| **EUR** | `#3B82F6` (Blue) | € Euro | European euro |
| **UAH** | `#F59E0B` (Amber) | ₴ Custom | Ukrainian hryvnia |
| **RON** | `#8B5CF6` (Purple) | 💳 CreditCard | Romanian leu |

**Files**: `currencies.ts` → `currencyIconMap`, `currencyColorMap`

### Transaction Categories
Semantic color coding for transaction types:

| Category | Color | Icon | Usage |
|----------|-------|------|-------|
| **Food** | `#EF4444` (Red) | 🛍️ ShoppingBag | Groceries, dining |
| **Cafe** | `#F59E0B` (Amber) | ☕ Coffee | Restaurants, cafes |
| **Transport** | `#3B82F6` (Blue) | 🚗 Car | Taxi, transit, fuel |
| **Home** | `#10B981` (Green) | 🏠 Home | Rent, utilities, maintenance |
| **Health** | `#EC4899` (Pink) | ❤️ Heart | Medical, wellness |
| **Entertainment** | `#8B5CF6` (Purple) | 🎮 Gamepad2 | Games, movies, hobbies |
| **Education** | `#6366F1` (Indigo) | 🎓 GraduationCap | Courses, books |
| **Gift** | `#F472B6` (Rose) | 🎁 Gift | Presents, donations |
| **Office** | `#64748B` (Slate) | 🏢 Building2 | Work, supplies |
| **Other** | `#6B7280` (Gray) | ❌ MoreHorizontal | Uncategorized |

**Files**: `categories.ts` → `categoryColors`, `categoryColorMap`, `getCategoryColorValue()`

**Dynamic Resolution**: Category names are matched against keywords (e.g., "grocery" → red food color)

## Gradients

### Background Gradients
- **Screen**: Rich purple/indigo `to-b from-indigo-950 via-purple-950/30 to-indigo-950`
- **Balance Card**: Emerald-teal gradient with backdrop blur
- **Error**: Red tint `bg-red-500/10`
- **Success**: Green tint `bg-green-500/10`

### Component Gradients
- **Card**: Semi-transparent slate `bg-slate-800/40 backdrop-blur-sm`
- **Card Hover**: Enhanced opacity `bg-slate-800/60`
- **Input**: Slate with focus ring `focus:ring-amber-500/50`
- **Header**: Border with backdrop `border-slate-700/50 backdrop-blur-sm`

**File**: `gradients.ts` → `gradients` object with `.screen`, `.card.*`, `.button.*`, `.input`

## Animations & Transitions

### Scale Animations
- **Hover**: `scale-105` (5% increase)
- **Active**: `scale-98` (2% decrease)
- **Combined**: Both hover + active states

### Transitions
- **Durations**: `duration-200`, `duration-300`, `duration-500`
- **Properties**: `transition-all`, `transition-colors`, `transition-transform`, `transition-opacity`
- **Easing**: `ease-linear`, `ease-in`, `ease-out`, `ease-in-out`

### Effects
- **Pulse**: `animate-pulse` (gentle fading)
- **Spin**: `animate-spin` (loading indicator)
- **Bounce**: `animate-bounce` (attention grabber)

**File**: `animations.ts` → `animations` object with presets and combinations

## Layouts

Reusable flexbox/grid patterns for consistent spacing and alignment:

| Pattern | Usage |
|---------|-------|
| `flex-center` | Centered flex container |
| `flex-between` | Space-between layout |
| `flex-col-center` | Column with centered content |
| `grid-cols-*` | Grid column configurations |

**File**: `layouts.ts` → `layouts` object

## Card Styles

Predefined Tailwind classes for consistent card appearance:

- **Base**: `rounded-lg bg-slate-800/30 border border-slate-700/50 p-4`
- **Interactive**: Hover/active states with backdrop blur
- **Hover**: Enhanced opacity + border color
- **Active**: Darker background on click

**File**: `cards.ts` → `cardStyles` object

## Usage Examples

### Import Currency Theme
```typescript
import { currencyColorMap, currencyIconMap } from '@/theme/dark/currencies';

const color = currencyColorMap['USD']; // '#10B981'
const Icon = currencyIconMap['EUR'];   // Euro component
```

### Import Category Colors
```typescript
import { categoryColors, getCategoryColorValue } from '@/theme/dark/categories';

const color = categoryColors.food;                          // '#EF4444'
const dynamicColor = getCategoryColorValue('Coffee Shop');  // '#F59E0B'
```

### Apply Gradient Classes
```typescript
import { gradients } from '@/theme/dark/gradients';

<div className={gradients.screen}>
  <div className={gradients.card.hoverBoth}>Content</div>
</div>
```

### Use Animations
```typescript
import { animations } from '@/theme/dark/animations';

<button className={`${animations.transitionSmooth} ${animations.scaleBoth}`}>
  Click me
</button>
```

## Central Export

All theme modules are re-exported from `dark/index.ts`:

```typescript
import { gradients, cardStyles, animations, categories, currencies, layouts } from '@/theme/dark';
// OR use the theme object
import { theme } from '@/theme/dark';
theme.categories.categoryColors.food; // '#EF4444'
```

## Design Principles

- **Semantic Colors**: Colors convey meaning (red=food, green=home, blue=transport)
- **Branded Icons**: Currency symbols match real-world visual representation
- **Dark Mode First**: All colors optimized for OLED and dark backgrounds
- **Accessibility**: High contrast ratios maintained for readability
- **Performance**: Pre-computed Tailwind classes for zero runtime overhead
- **Maintainability**: Centralized definitions prevent color/icon duplication
