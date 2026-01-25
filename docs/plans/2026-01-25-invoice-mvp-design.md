# Invoice MVP Design

## Overview

A minimal invoicing application for demo purposes. Single-user, no auth, focused on core invoice CRUD with a shareable public preview link.

**Timeline:** Build and deploy today
**Purpose:** Interview demo project

## Data Model

### Invoice
| Field | Type | Description |
|-------|------|-------------|
| id | cuid | Primary key |
| invoiceNumber | string | Human-readable (INV-001) |
| clientName | string | Who's being billed |
| clientEmail | string | Client contact |
| status | enum | draft, sent, paid |
| issueDate | datetime | When created |
| dueDate | datetime | Payment deadline |
| notes | string? | Optional terms/notes |
| createdAt | datetime | Record created |
| updatedAt | datetime | Record updated |

### LineItem
| Field | Type | Description |
|-------|------|-------------|
| id | cuid | Primary key |
| invoiceId | string | FK to Invoice |
| description | string | What the charge is for |
| quantity | decimal | Number of units |
| unitPrice | decimal | Price per unit |

Total calculated as: quantity × unitPrice

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Dashboard - invoice list, summary stats |
| `/invoices/new` | Create invoice form |
| `/invoices/[id]` | View/edit invoice |
| `/invoices/[id]/preview` | Public shareable link |

### Dashboard (/)
- Summary cards: Total Outstanding, Total Paid, Overdue count
- Invoice table: Number, Client, Amount, Status, Due Date, Actions
- "New Invoice" button top right

### Create/Edit Form
- Client name & email fields
- Dynamic line items (add/remove rows)
- Auto-calculated totals
- Due date picker
- Notes textarea
- Save as Draft / Mark as Sent buttons

### Public Preview
- Clean, professional invoice layout
- Company name placeholder at top
- No edit controls
- Print button

## Tech Stack

- **Next.js 14** - App Router, Server Actions
- **Prisma** - ORM
- **SQLite** (local) / **Neon PostgreSQL** (production)
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Vercel** - Deployment

## Project Structure

```
bank-mvp/
├── app/
│   ├── page.tsx                    # Dashboard
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Tailwind styles
│   ├── invoices/
│   │   ├── new/page.tsx            # Create form
│   │   ├── [id]/page.tsx           # Edit view
│   │   └── [id]/preview/page.tsx   # Public view
│   └── actions/
│       └── invoices.ts             # Server Actions
├── components/
│   ├── ui/                         # shadcn components
│   ├── invoice-form.tsx            # Reusable form
│   ├── invoice-table.tsx           # Dashboard table
│   └── invoice-preview.tsx         # Printable view
├── lib/
│   ├── db.ts                       # Prisma client
│   └── utils.ts                    # Helpers
├── prisma/
│   └── schema.prisma               # Data model
└── package.json
```

## Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add Neon PostgreSQL connection string as env var
4. Deploy

## Demo Flow

1. Open deployed URL
2. Create invoice with line items
3. Show dashboard with stats
4. Open public preview link
5. Mark as paid, show status change

## Out of Scope (for MVP)

- User authentication
- Multi-tenancy / organizations
- Approval workflows
- Email sending
- Payment processing
- Accounting integrations
