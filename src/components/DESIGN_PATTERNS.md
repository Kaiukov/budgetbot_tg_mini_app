# Component Design Patterns

Design patterns and styling conventions used in the Budget Mini App components.

## Confirmation Screen Pattern

**File:** `src/components/ConfirmScreen.tsx`

### Overview
The ConfirmScreen component demonstrates a mobile-optimized confirmation flow pattern with clear visual hierarchy, icon-based field labeling, and responsive spacing for iPhone screens.

### Core Design Principles

#### 1. **Visual Hierarchy**
- **Primary Action:** Large, prominent amount display (text-3xl)
- **Secondary Information:** Details card with organized fields
- **Tertiary Elements:** Date input and notes textarea
- **Actions:** Two prominent buttons at bottom

#### 2. **Color Coding with Icons**
Each transaction detail uses a colored icon for quick visual scanning:
- 💼 **Wallet (blue-400):** Account selection
- 🏷️ **Tag (amber-400):** Category/classification
- 📍 **MapPin (green-400):** Destination/recipient
- 📅 **Calendar (purple-400):** Transaction date
- 📝 **FileText (cyan-400):** Notes/comments

#### 3. **Spacing System**
Responsive spacing adapts to device size:
- **Desktop:** `p-4, mb-6, gap-3`
- **Mobile (iPhone):** `p-3, mb-4, gap-2`

### Component Structure

```
ConfirmScreen (container)
├── Header
│   └── "Confirm Withdrawal" title
├── Content
│   ├── Amount Card (gradient red background)
│   ├── Details Card
│   │   ├── Account field (icon + label + value)
│   │   ├── Category field (icon + label + value)
│   │   ├── Destination field (icon + label + value)
│   │   ├── Date field (icon + label + input)
│   │   └── Notes field (icon + label + textarea)
│   ├── Status Message (conditional success/error)
│   └── Action Buttons
│       ├── Decline button (red-600)
│       └── Confirm button (green-600)
```

### Amount Card Pattern

**Purpose:** Highlight the key transaction amount prominently

**Styling:**
```tailwind
bg-gradient-to-br from-red-900/40 to-red-900/20
border border-red-800/50
shadow-lg
rounded-lg
```

**Content Hierarchy:**
1. Label: "AMOUNT" (uppercase, small, red-200)
2. Value: `-$12` (large, bold, red-400)
3. Subtext: "Withdrawal Transaction" (gray-400)

**Mobile Optimization:**
- Padding: `p-3` (reduced from desktop `p-4`)
- Font size: `text-3xl` (reduced from `text-4xl`)
- Margins: `mb-4` (compact spacing)

### Details Card Pattern

**Purpose:** Present transaction details with clear labeling and icons

**Container:**
```tailwind
rounded-lg
bg-gray-800/50
border border-gray-700/50
shadow-lg
overflow-hidden
```

**Field Structure:**
```tsx
<div className="p-3 border-b border-gray-700/50">
  <div className="flex items-center gap-2 mb-0.5">
    <Icon size={14} className="text-{color}-400 flex-shrink-0" />
    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Label</span>
  </div>
  <span className="text-xs font-medium text-white ml-5">Value</span>
</div>
```

**Design Features:**
- **Icon sizing:** `size-14` (14px) for mobile readability
- **Icon position:** Flex with `gap-2` for clean alignment
- **Label style:** Uppercase, semibold, small font, gray-300
- **Value indentation:** `ml-5` aligns with icon baseline
- **Dividers:** `border-b border-gray-700/50` between fields
- **Last field:** No border-bottom

### Form Input Pattern

**Date Input:**
```tailwind
bg-gray-900/50
border border-gray-600/50
text-white
text-xs
px-2 py-1.5
rounded-md
focus:outline-none
focus:ring-2 focus:ring-purple-500/50
w-full max-w-[140px]
```

**Notes Textarea:**
```tailwind
bg-gray-900/50
border border-gray-600/50
text-white
text-xs
px-2 py-1.5
rounded-md
focus:outline-none
focus:ring-2 focus:ring-cyan-500/50
resize-y
min-h-[100px]
w-[calc(100%-20px)]
rows="4"
```

**Mobile Features:**
- **Consistent styling:** Both inputs match overall dark theme
- **Focus states:** Colored ring matching field icon color
- **Sizing:** Reduced padding/text for mobile screens
- **Responsive width:** Textarea uses `calc()` for available space

### Status Message Pattern

**Success Message:**
```tailwind
bg-green-900/30
border border-green-600/50
text-green-200
```

**Error Message:**
```tailwind
bg-red-900/30
border border-red-600/50
text-red-200
```

**Structure:**
- Icon (left): `Check` or `X` (size-16)
- Text (center): Status message
- Spacing: `gap-2` between icon and text
- Padding: `p-3, mb-3` (compact mobile sizing)

### Action Buttons Pattern

**Container:**
```tailwind
grid grid-cols-2 gap-2
```

**Button Base:**
```tailwind
py-2.5
rounded-lg
font-semibold
text-xs
transition
active:scale-95
flex items-center justify-center
gap-1.5
disabled:opacity-50
disabled:cursor-not-allowed
shadow-lg
```

**Decline Button:**
```tailwind
bg-red-600 hover:bg-red-700
```

**Confirm Button:**
```tailwind
bg-green-600 hover:bg-green-700
```

**Features:**
- **Icon alignment:** Centered with text using flexbox
- **Hover states:** Darker shade on hover
- **Active states:** `scale-95` for tactile feedback
- **Disabled states:** Reduced opacity + not-allowed cursor
- **Mobile optimization:** Smaller padding (py-2.5 vs py-3)

## Typography System

### Heading
- `text-2xl font-bold` - Main screen heading

### Labels
- `text-xs font-semibold text-gray-300 uppercase tracking-wide`
- Used for field labels to maintain visual hierarchy

### Values
- `text-xs font-medium text-white`
- Used for displayed transaction data

### Placeholders & Hints
- `text-xs text-gray-400`
- Used for helper text and subtitles

### Amount Display
- `text-3xl font-bold text-red-400`
- Primary call-to-action visual element

## Color Palette

### Alert/Status
- **Red (Decline/Withdrawal):** `red-600` buttons, `red-400` amount, `red-200` labels
- **Green (Confirm):** `green-600` buttons
- **Gray (Neutral):** `gray-800`, `gray-700`, `gray-400` for backgrounds and text

### Icon Colors (Field Indicators)
- **Blue:** Wallet (Account)
- **Amber:** Tag (Category)
- **Green:** MapPin (Destination)
- **Purple:** Calendar (Date)
- **Cyan:** FileText (Notes)

### Background
- **Screens:** Dark navy gradient from `gradients.screen`
- **Cards:** `gray-800/50` with `border-gray-700/50`
- **Inputs:** `gray-900/50` with subtle borders

## Responsive Behavior

### Desktop Sizing
- Amount card: `text-4xl, p-4, mb-6`
- Details card: `p-4, gap-3, mb-6`
- Buttons: `py-3, text-sm, gap-2, gap-3`
- Icons: `size-16`

### Mobile Sizing (iPhone)
- Amount card: `text-3xl, p-3, mb-4`
- Details card: `p-3, gap-2, mb-4`
- Buttons: `py-2.5, text-xs, gap-1.5, gap-2`
- Icons: `size-14`

### Breakpoint Strategy
- Single responsive design without media queries
- Compact spacing designed for iPhone baseline
- Scales up gracefully on larger screens

## Accessibility Features

1. **Icon + Label Combination:** Icons support visual scanning, labels provide context
2. **Color Contrast:** All text maintains WCAG AA contrast ratios
3. **Focus States:** Clear focus rings on interactive elements
4. **Semantic HTML:** Proper use of labels, inputs, buttons
5. **Keyboard Navigation:** All interactive elements are keyboard accessible

## Implementation Example

```tsx
// Field with icon, label, and value
<div className="p-3 border-b border-gray-700/50">
  <div className="flex items-center gap-2 mb-0.5">
    <Wallet size={14} className="text-blue-400 flex-shrink-0" />
    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
      Account
    </span>
  </div>
  <span className="text-xs font-medium text-white ml-5">
    {account_name}
  </span>
</div>
```

## Design Benefits

✅ **Clear Visual Hierarchy:** Most important info (amount) is most prominent
✅ **Mobile-First:** Optimized for iPhone screens without sacrificing desktop experience
✅ **Icon-Based Scanning:** Users can quickly identify transaction details
✅ **Consistent Styling:** Unified color scheme and spacing throughout
✅ **Accessible:** High contrast, semantic HTML, clear labeling
✅ **Responsive:** Flexible spacing adapts to different screen sizes
✅ **Professional Appearance:** Modern dark theme with subtle gradients and shadows

## Related Components

- **TransactionCard:** Similar icon + detail pattern for transaction history
- **TransferConfirmScreen:** Applies same confirmation pattern for transfers
- **IncomeConfirmScreen:** Reuses confirmation layout with income-specific styling

## Future Enhancements

- [ ] Add animation for amount display (fade in from bottom)
- [ ] Implement field-level validation indicators
- [ ] Add swipe-to-confirm gesture for mobile
- [ ] Expandable sections for optional fields
- [ ] Dark/light theme toggle support
