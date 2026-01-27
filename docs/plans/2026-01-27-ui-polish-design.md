# UI Polish Design: Dashboard & Invoice Form

## Overview

Improve the visual polish of the dashboard and invoice form to convey a professional/corporate aesthetic (Stripe, Linear style) while maintaining GOV.UK-level accessibility. Focus areas are the dashboard and invoice form, with full mobile responsiveness.

## Color Palette & Foundation

### Primary Colors
- **Text:** Deep slate (`#0F172A`)
- **Interactive:** Blue (`#2563EB`)
- **Interactive hover:** Darker blue (`#1D4ED8`)

### Accent Tints
- Hover backgrounds: `#EFF6FF`
- Selected/active: `#DBEAFE`

### Status Colors (muted, professional)
| Status | Text | Background | Icon |
|--------|------|------------|------|
| Draft | `#64748B` | `#F1F5F9` | ○ (empty circle) |
| Sent | `#2563EB` | `#DBEAFE` | ● (filled circle) |
| Paid | `#059669` | `#D1FAE5` | ✓ (checkmark) |
| Overdue | `#D97706` | `#FEF3C7` | ⚠ (warning) |

### Typography
- Page titles: `text-2xl font-semibold`
- Section headers: `text-sm font-medium text-slate-500 uppercase tracking-wide`
- Money/numbers: `tabular-nums` for decimal alignment
- Base font: 16px minimum

### Shadows
Cards use subtle layered shadows instead of borders:
```css
shadow-sm ring-1 ring-slate-900/5
```

## Dashboard Design

### Stat Cards
- Icon in soft colored circle matching stat type
- Large prominent number (`text-3xl font-semibold`)
- Muted label above number
- Optional secondary info (e.g., "3 invoices")
- Subtle hover with shadow lift

```
┌─────────────────────────┐
│  ◯  Outstanding         │
│     €12,450.00          │
│     3 invoices          │
└─────────────────────────┘
```

### Invoice Table
- Shadow instead of outer border
- Row hover: `hover:bg-slate-50`
- Invoice number: `font-medium text-blue-600 hover:underline`
- Right-aligned amounts
- Single "View" action link (cleaner than multiple buttons)

### Header
- Title with subtitle: "Invoices" / "Manage and track your invoices"
- "New Invoice" button: solid blue with plus icon

## Invoice Form Design

### Layout (Desktop)
Two-column layout for related fields:

```
┌──────────────────────────────────────────────────┐
│  ← Back to Invoices                              │
│                                                  │
│  New Invoice                     Draft  ●        │
├──────────────────────────────────────────────────┤
│  CLIENT DETAILS                                  │
│  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Client Name     │  │ Client Email    │        │
│  └─────────────────┘  └─────────────────┘        │
│                                                  │
│  DATES                                           │
│  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Invoice Date    │  │ Due Date        │        │
│  └─────────────────┘  └─────────────────┘        │
├──────────────────────────────────────────────────┤
│  LINE ITEMS                                      │
│  Description          Qty     Price      Total   │
│  ───────────────────────────────────────────────│
│  Web Development      10      €85.00    €850.00  │
│                                      + Add Line  │
├──────────────────────────────────────────────────┤
│  Notes (optional)                    Subtotal    │
│  ┌─────────────────┐                 €850.00     │
│  │                 │                             │
│  └─────────────────┘    ┌──────────┐ ┌────────┐  │
│                         │ Save     │ │ Send ▶ │  │
│                         └──────────┘ └────────┘  │
└──────────────────────────────────────────────────┘
```

### Form Inputs
- Light borders: `border-slate-200`
- Focus state: `focus:ring-2 focus:ring-blue-500`
- Labels above inputs, always visible

## Mobile Responsive Design

### Breakpoint Strategy
- Mobile-first: single column by default
- `md:` (768px+) for two-column layouts

### Form on Mobile
- Client name/email stack vertically
- Date fields stay side-by-side (short fields)
- Inputs full width with taller padding (`py-3`)

### Line Items on Mobile
Stack as cards instead of table rows:

```
┌──────────────────────────┐
│ Line Item 1          ✕   │
├──────────────────────────┤
│ Description              │
│ ┌──────────────────────┐ │
│ │ Web Development      │ │
│ └──────────────────────┘ │
│ Qty          Price       │
│ ┌────────┐  ┌──────────┐ │
│ │ 10     │  │ €85.00   │ │
│ └────────┘  └──────────┘ │
│              Total €850  │
└──────────────────────────┘
```

### Touch Targets
- All interactive elements minimum 44x44px
- Delete button top-right of line item card
- "Add Line Item" button full width
- Sticky footer with Save/Send on mobile

### Dashboard on Mobile
- Stat cards stack vertically
- Table becomes card list

## Accessibility (GOV.UK Principles)

### Color Contrast
- All text meets WCAG AA (4.5:1 minimum)
- Never rely on color alone

### Status Badges
Icon + text + color (three ways to convey status):
```
┌────────────┐  ┌────────────┐  ┌────────────┐
│ ○ Draft    │  │ ● Sent     │  │ ✓ Paid     │
└────────────┘  └────────────┘  └────────────┘
```

### Focus States
- Visible high-contrast focus ring: `ring-2 ring-offset-2 ring-blue-600`
- No `outline-none` without replacement
- Focus order follows visual order

### Form Inputs
- Labels always visible (no placeholder-only)
- Error messages linked with `aria-describedby`
- Required fields marked with "(required)" text
- Related fields grouped with `fieldset` + `legend`

### Typography
- Base font 16px minimum
- Line height 1.5
- Left-aligned text

## Implementation

### Files to Modify
1. `src/app/globals.css` - Design tokens
2. `src/app/page.tsx` - Dashboard
3. `src/components/invoice-form.tsx` - Form layout
4. `prisma/seed.ts` - Demo data

### New Components
- `src/components/stat-card.tsx` - Reusable stat card
- `src/components/status-badge.tsx` - Accessible status badge

### Seed Data
| Invoice | Client | Amount | Status | Due Date |
|---------|--------|--------|--------|----------|
| INV-001 | Acme Corp | €2,400 | Paid | Jan 10 |
| INV-002 | Globex Ltd | €1,850 | Paid | Jan 15 |
| INV-003 | Initech | €3,200 | Sent | Jan 30 |
| INV-004 | Umbrella Inc | €950 | Sent (overdue) | Jan 20 |
| INV-005 | Sterling & Partners | €4,100 | Draft | Feb 5 |
| INV-006 | Northwind Traders | €780 | Draft | Feb 10 |

### Order of Work
1. Add design tokens to globals.css
2. Create stat-card and status-badge components
3. Update dashboard
4. Update invoice form with responsive layout
5. Add seed script and populate demo data
