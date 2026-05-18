# Design System Inspired by WakaTime

## 1. Visual Theme & Atmosphere

WakaTime's design system embodies a professional, data-driven aesthetic built for developers and engineering teams. The visual language combines a sophisticated blue-toned foundation with energetic orange accents, creating an interface that feels both authoritative and approachable. The system prioritizes clarity and information hierarchy, leveraging generous whitespace and subtle shadows to create depth. The palette conveys trust and technical expertise while maintaining warmth through strategic use of accent colors. This design system supports complex analytics dashboards, performance metrics, and developer-centric workflows while remaining accessible and intuitive.

**Key Characteristics**

- Blue-dominant color palette with warm orange CTAs
- Data-visualization-ready neutral grounds
- Clean, card-based layout system
- Generous whitespace and breathing room
- Subtle shadow elevation for depth
- Professional typography with strong hierarchy
- Developer-friendly, information-dense layouts
- Accessible contrast ratios throughout

## 2. Color Palette & Roles

### Primary

- **Primary Blue** (`#337AB7`): Main interactive elements, links, and primary UI actions
- **Primary Blue (Muted)** (`#4C83B2`): Secondary interactive states and lighter emphasis
- **Dark Blue** (`#1B263B`): Primary text and headings
- **Darker Blue** (`#12263A`): Deep backgrounds and strong emphasis areas

### Accent Colors

- **Bright Orange** (`#FF6A14`): Primary call-to-action buttons and high-emphasis actions
- **Cyan Light** (`#D5E8F7`): Highlight backgrounds and light interactive states

### Interactive

- **Bright Blue** (`#007CF1`): Secondary button states and alternate interactive elements
- **Blue Border** (`#0069CD`): Active button borders and focus states

### Neutral Scale

- **Dark Gray** (`#333333`): Primary body text and standard content
- **Medium Gray** (`#4E575B`): Secondary text and UI elements
- **Light Medium Gray** (`#5E6B78`): Tertiary text and disabled states
- **Mid Gray** (`#979DA3`): Placeholder text and hints
- **Light Gray** (`#777777`): Subtle text and dividers
- **Very Light Gray** (`#D7DADD`): Light borders and divider lines
- **Pale Gray** (`#D9E5EF`): Subtle background tints

### Surface & Borders

- **White** (`#FFFFFF`): Primary surface, cards, and containers
- **Light Border** (`#DDDDDD`): Default input and card borders
- **Pale Blue** (`#A9BFD1`): Soft card borders and subtle divisions

### Shadow Colors

- **Card Shadow**: `rgba(13, 39, 62, 0.08) 0px 12px 36px 0px` — subtle depth for cards
- **Button Shadow**: `rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px` — elevation for interactive elements
- **Inset Shadow**: `rgba(0, 0, 0, 0.075) 0px 1px 1px 0px inset` — input field depth

## 3. Typography Rules

### Font Family

**Primary:** `Rubik, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif`

**Secondary:** `Rubik, sans-serif` (fallback stack for monospace or technical contexts)

### Hierarchy

| Role              | Font  | Size   | Weight | Line Height | Letter Spacing | Notes                            |
| ----------------- | ----- | ------ | ------ | ----------- | -------------- | -------------------------------- |
| Display / H1      | Rubik | 64px   | 600    | 69.12px     | 0px            | Hero headlines and page titles   |
| Heading / H2      | Rubik | 27.2px | 400    | 29.92px     | 0px            | Section headings and card titles |
| Subheading        | Rubik | 19.2px | 700    | 27.4286px   | 0px            | Card subtitles and emphasis      |
| Body / Paragraph  | Rubik | 16px   | 400    | 22.8571px   | 0px            | Standard text content            |
| Link / Navigation | Rubik | 18px   | 400    | 30px        | 0px            | Navigation and link text         |
| Link Secondary    | Rubik | 16px   | 400    | 19px        | 0px            | Secondary nav and footer links   |
| Input / Form      | Rubik | 14px   | 400    | 20px        | 0px            | Form input and placeholder text  |
| Button Large      | Rubik | 20.8px | 600    | 29.7143px   | 0px            | Primary CTA buttons              |
| Button Standard   | Rubik | 18px   | 400    | 25.7143px   | 0px            | Secondary buttons                |
| Button Compact    | Rubik | 14px   | 700    | 19px        | 0px            | Tertiary and compact buttons     |
| Caption / Span    | Rubik | 16px   | 400    | 22.8571px   | 0px            | Helper text and captions         |

### Principles

- **Weight Contrast**: Use weight 600 for dominant headings; 400 for body and secondary text
- **Scale Discipline**: Follow the established size scale; do not introduce arbitrary sizes
- **Line Height**: Maintain 1.4x multiplier for readability; adjust for smaller text to 1.43x
- **All Caps Labeling**: Use sparingly for metadata labels (e.g., "AI CODING ANALYTICS")
- **Accessibility**: Ensure 4.5:1 contrast minimum for all body text against backgrounds

## 4. Component Stylings

### Buttons

#### Primary CTA Button (Large)

- **Background**: `#FF6A14`
- **Text Color**: `#FFFFFF`
- **Font Size**: `20.8px`
- **Font Weight**: `600`
- **Padding**: `20px 40px`
- **Border Radius**: `4px`
- **Border**: `1px solid #FF6A14`
- **Box Shadow**: `rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px`
- **Line Height**: `29.7143px`
- **Hover**: Darken background to `#E55D0B`, maintain shadow
- **Active**: Scale to `0.98`, maintain colors
- **Disabled**: Opacity `0.5`, cursor `not-allowed`

#### Secondary Blue Button

- **Background**: `#007CF1`
- **Text Color**: `#FFFFFF`
- **Font Size**: `18px`
- **Font Weight**: `400`
- **Padding**: `10px 40px`
- **Border Radius**: `4px`
- **Border**: `1px solid #0069CD`
- **Box Shadow**: `rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px`
- **Line Height**: `25.7143px`
- **Hover**: Darken to `#0069CD`
- **Active**: Scale `0.98`
- **Disabled**: Opacity `0.5`

#### Tertiary / Ghost Button (White Outline)

- **Background**: `transparent`
- **Text Color**: `#FFFFFF`
- **Font Size**: `14px`
- **Font Weight**: `700`
- **Padding**: `6px 12px`
- **Border Radius**: `6px`
- **Border**: `1px solid #FFFFFF`
- **Box Shadow**: `rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px`
- **Line Height**: `19px`
- **Height**: `34px`
- **Hover**: Background `rgba(255, 255, 255, 0.1)`, maintain border
- **Active**: Background `rgba(255, 255, 255, 0.2)`
- **Disabled**: Opacity `0.5`

#### Minimal Button (Gray Outline)

- **Background**: `transparent`
- **Text Color**: `#333333`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Padding**: `9px 10px`
- **Border Radius**: `4px`
- **Border**: `1px solid #DDDDDD`
- **Box Shadow**: `none`
- **Line Height**: `22.8571px`
- **Hover**: Background `#F5F5F5`, border color `#BFBFBF`
- **Active**: Background `#EEEEEE`
- **Disabled**: Opacity `0.5`

### Cards & Containers

#### Standard Card

- **Background**: `#FFFFFF`
- **Text Color**: `#333333`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Padding**: `20px 30px`
- **Border Radius**: `22px`
- **Border**: `1px solid #D9E5EF`
- **Box Shadow**: `rgba(13, 39, 62, 0.08) 0px 12px 36px 0px`
- **Line Height**: `22.8571px`
- **Hover**: Elevate shadow to `rgba(13, 39, 62, 0.12) 0px 16px 48px 0px`
- **Min Height**: `auto` (content-driven)

#### Card Heading (Numeric Label)

- **Background**: `transparent`
- **Text Color**: `#4C83B2`
- **Font Size**: `19.2px`
- **Font Weight**: `700`
- **Padding**: `0px`
- **Border Radius**: `0px`
- **Border**: `none`
- **Box Shadow**: `none`
- **Line Height**: `27.4286px`
- **Margin Bottom**: `12px`

#### Hero Section (Dark Blue Gradient Background)

- **Background**: Linear gradient from `#4C7BA7` to `#1B4D7F`
- **Text Color**: `#FFFFFF`
- **Padding**: `60px 72px`
- **Min Height**: `400px`
- **Display**: Flex with column layout
- **Justify Content**: `space-between`

### Inputs & Forms

#### Text Input / Search Field

- **Background**: `#FFFFFF`
- **Text Color**: `#555555`
- **Placeholder Color**: `#979DA3`
- **Font Size**: `14px`
- **Font Weight**: `400`
- **Padding**: `6px 12px 6px 25px`
- **Border Radius**: `4px`
- **Border**: `2px solid #BDBDBD`
- **Box Shadow**: `rgba(0, 0, 0, 0.075) 0px 1px 1px 0px inset`
- **Height**: `34px`
- **Line Height**: `20px`
- **Focus**: Border color `#007CF1`, box shadow `0 0 0 3px rgba(0, 124, 241, 0.1)`
- **Disabled**: Background `#F5F5F5`, opacity `0.6`

#### Label Text

- **Font Size**: `14px`
- **Font Weight**: `600`
- **Color**: `#333333`
- **Margin Bottom**: `8px`
- **Display**: `block`

### Navigation

#### Top Navigation Bar

- **Background**: `#527DA4`
- **Height**: `80px`
- **Padding**: `0px 40px`
- **Display**: `flex`
- **Align Items**: `center`
- **Justify Content**: `space-between`
- **Box Shadow**: `rgba(0, 0, 0, 0.1) 0px 2px 4px 0px`

#### Navigation Links

- **Text Color**: `#FFFFFF`
- **Font Size**: `16px`
- **Font Weight**: `400`
- **Padding**: `15px 15px`
- **Line Height**: `19px`
- **Text Decoration**: `none`
- **Hover**: Background `rgba(255, 255, 255, 0.1)`, border radius `4px`
- **Active**: Border bottom `3px solid #FF6A14`

#### Logo

- **Font Size**: `24px`
- **Font Weight**: `600`
- **Color**: `#FFFFFF`
- **Display**: `flex`
- **Align Items**: `center`
- **Gap**: `8px`

## 5. Layout Principles

### Spacing System

**Base Unit:** `4px`

**Scale:**

- `8px` (xs) — tight spacing, internal padding
- `12px` (sm) — small gaps between elements
- `16px` (md) — standard padding and margins
- `20px` (lg) — card padding and medium spacing
- `24px` (xl) — section spacing
- `28px` (2xl) — large gaps
- `32px` (3xl) — heading margins
- `40px` (4xl) — container padding
- `44px` (5xl) — large margins
- `60px` (6xl) — section breaks
- `64px` (7xl) — major section spacing
- `72px` (8xl) — hero section padding

**Context:**

- **8px, 12px**: Internal button/input padding, icon spacing
- **16px**: Standard content padding, default gap
- **20px, 24px**: Card padding, component margins
- **40px, 60px, 72px**: Section and container padding

### Grid & Container

- **Max Width**: `1440px` (full-width breakpoint)
- **Gutter**: `40px` (left/right margins on max-width containers)
- **Column Strategy**: 12-column flexible grid; stack to 6 columns at tablet, 1 at mobile
- **Card Grid**: 3-column layout on desktop, 2 on tablet, 1 on mobile with `24px` gap
- **Hero Section**: Full-width, single column, center-aligned content

### Whitespace Philosophy

Generous whitespace creates visual breathing room and hierarchy. Prioritize:

- Minimum `24px` between major sections
- `16px-20px` padding around primary content
- `40px+` margins between distinct content blocks
- Cards separated by at least `24px` vertically and horizontally
- Vertical rhythm maintained throughout for scanability

### Border Radius Scale

- **4px**: Standard buttons, inputs, minimal UI elements
- **6px**: Secondary buttons, compact components
- **16px**: Large interactive elements, image corners
- **22px**: Cards and containers
- **40px**: Fully rounded pill-shaped buttons
- **50%**: Circular images and avatars

## 6. Depth & Elevation

| Level               | Treatment                                                                                                       | Use                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **Flat (Base)**     | No shadow, `box-shadow: none`                                                                                   | Text, flat buttons (minimal style), backgrounds |
| **Level 1**         | `rgba(0, 0, 0, 0.075) 0px 1px 1px 0px inset`                                                                    | Input fields, subtle inset effects              |
| **Level 2**         | `rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px` | Buttons, interactive components                 |
| **Level 3**         | `rgba(13, 39, 62, 0.08) 0px 12px 36px 0px`                                                                      | Cards, containers                               |
| **Level 4 (Hover)** | `rgba(13, 39, 62, 0.12) 0px 16px 48px 0px`                                                                      | Elevated cards on interaction                   |

**Shadow Philosophy:**
Subtle, directional shadows suggest depth without overwhelming. Use shadows strategically to separate layers: buttons float above surfaces, cards rise from backgrounds. The shadow palette ranges from soft inset shadows on inputs (creating a "pressed" feeling) to larger ambient shadows on cards (creating layered depth). All shadows use dark blue undertones to align with the color system and maintain cohesion.

## 7. Do's and Don'ts

### Do

- **Use orange accents sparingly** for primary CTAs to draw attention and create focal points
- **Maintain the blue gradient** in hero sections; it establishes brand identity and visual hierarchy
- **Pair white text** with dark blue backgrounds for maximum contrast and readability
- **Apply 22px border radius** to all card-like containers for brand consistency
- **Use 16px base font** for body text; adjust up for headings, down for captions
- **Include subtle shadows** on cards to create depth without clutter
- **Stack cards in a 3-column grid** on desktop; collapse responsively
- **Provide at least 44px touch targets** for interactive elements
- **Use placeholder color `#979DA3`** for input hints; maintain readability
- **Keep form inputs at 34px height** for comfortable interaction on all devices

### Don't

- **Avoid bright orange outside of CTAs**; it loses impact if overused
- **Don't remove border-radius** on buttons or cards; it's essential to the visual language
- **Don't use shadows on buttons** unless specifically elevated (Level 2 treatment)
- **Avoid text smaller than 14px** without explicit accessibility review
- **Don't use pure black (`#000000`)** for text; prefer `#333333` for softer, more professional appearance
- **Don't mix serif fonts** with Rubik; maintain typographic consistency
- **Avoid fully transparent backgrounds** without sufficient border contrast
- **Don't crowd cards** with padding less than 20px; whitespace is crucial
- **Avoid more than three CTA buttons per section**; reduce choice paralysis
- **Don't set line-height below 1.4x** font size; impacts readability

## 8. Responsive Behavior

### Breakpoints

| Name              | Width             | Key Changes                                                           |
| ----------------- | ----------------- | --------------------------------------------------------------------- |
| **Mobile**        | `< 640px`         | 1-column layout, full-width cards, stacked navigation, 16px padding   |
| **Tablet**        | `640px - 1024px`  | 2-column grid, adjusted spacing (24px), collapsible nav, 20px padding |
| **Desktop**       | `1024px - 1440px` | 3-column grid, full spacing scale, expanded nav, 40px padding         |
| **Large Desktop** | `> 1440px`        | Max-width container (`1440px`), centered, consistent spacing          |

### Touch Targets

- **Minimum Size**: `44px × 44px` for all interactive elements (buttons, links, inputs)
- **Spacing Between Targets**: Minimum `8px` to prevent accidental activation
- **Button Padding**: Maintain at least `6px 12px` for comfortable finger interaction
- **Link Hit Area**: Extend to at least `18px` height with padding

### Collapsing Strategy

- **Navigation**: Hamburger menu below `640px`; full horizontal nav above
- **Card Grid**: 1 column mobile (`< 640px`) → 2 columns tablet (`640px-1024px`) → 3 columns desktop (`> 1024px`)
- **Padding**: Reduce from `72px` (hero) on desktop to `40px` tablet, `24px` mobile
- **Typography**: Reduce heading sizes by 10-15% on mobile (e.g., H1 from `64px` to `48px`)
- **Margins**: Scale section gaps from `64px` desktop to `40px` tablet to `24px` mobile
- **Container**: Remove max-width constraint below `640px`; use full width with `16px` padding

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA**: Bright Orange (`#FF6A14`)
- **Primary Interactive**: Primary Blue (`#337AB7`)
- **Secondary Interactive**: Bright Blue (`#007CF1`)
- **Background**: White (`#FFFFFF`)
- **Text (Primary)**: Dark Gray (`#333333`)
- **Text (Secondary)**: Medium Gray (`#4E575B`)
- **Heading**: Dark Blue (`#1B263B`)
- **Border**: Light Gray (`#D7DADD`)
- **Card Shadow**: `rgba(13, 39, 62, 0.08) 0px 12px 36px 0px`
- **Button Shadow**: `rgba(0, 0, 0, 0.2) 0px 3px 1px -2px, rgba(0, 0, 0, 0.14) 0px 2px 2px 0px, rgba(0, 0, 0, 0.12) 0px 1px 5px 0px`

### Iteration Guide

1. **Always use Rubik font** with fallback to system sans-serif; maintain 1.4x+ line-height for readability
2. **Primary buttons are orange (`#FF6A14`)** with `20.8px` bold text and `20px 40px` padding; secondary buttons use blue (`#007CF1`) with `18px` regular text
3. **All cards use 22px border-radius**, `#FFFFFF` background, `#D9E5EF` borders, and subtle card shadow; maintain `20px 30px` padding minimum
4. **Navigation bar is `#527DA4`** at `80px` height; navigation links are white `#FFFFFF` at `16px` with hover state of `rgba(255, 255, 255, 0.1)` background
5. **Hero sections use blue gradient** from `#4C7BA7` to `#1B4D7F` with white text; minimum `400px` height with `60px 72px` padding
6. **Form inputs are 34px tall**, `14px` gray text, `#BDBDBD` borders, `#979DA3` placeholders; focus state adds blue border (`#007CF1`) and outline shadow
7. **Cards grid to 3 columns on desktop** with `24px` gap; collapse to 2 columns at tablet (`640px-1024px`) and 1 column on mobile (`< 640px`)
8. **Maintain 44px minimum touch targets** for all interactive elements; ensure 8px minimum spacing between buttons
9. **Use inset shadow `rgba(0, 0, 0, 0.075) 0px 1px 1px 0px inset`** on inputs only; all other components use outer shadows at appropriate elevation level
10. **Scale typography down 10-15% on mobile** (e.g., H1 `64px` → `48px`); reduce padding from `72px` to `40px` tablet to `24px` mobile

### Use a modern SaaS design system inspired by Linear + Vercel.

Rules:

- Large spacing
- Minimal borders
- Rounded-xl cards
- Subtle shadows
- Smooth hover animations
- Dark mode optimized
- Typography hierarchy like Linear
- Sticky sidebar
- Compact professional tables
- Clean status badges
- Modern loading skeletons
- Elegant empty states
- No Bootstrap look
- No generic admin template feel
