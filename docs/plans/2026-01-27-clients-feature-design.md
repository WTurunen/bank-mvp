# Clients Feature Design

## Overview

Add a Clients entity to the invoice management system. Clients are managed separately from invoices, with invoices storing a snapshot of client data at creation time while maintaining a reference to the source client.

**Purpose:** Add architectural depth to the MVP for dev lead interview discussions - demonstrates relational data modeling, migration strategy, and production SaaS patterns.

## Data Model

### Client Model (new)

```prisma
model Client {
  id            String     @id @default(cuid())
  name          String
  email         String
  companyName   String?
  phone         String?
  address       String?
  archivedAt    DateTime?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  invoices      Invoice[]
}
```

### Invoice Model (modified)

```prisma
model Invoice {
  // ... existing fields ...

  // Reference to client (nullable for migration safety)
  clientId           String?
  client             Client?   @relation(fields: [clientId], references: [id])

  // Snapshot fields (copied from client at invoice creation)
  clientName         String    // existing, now snapshot
  clientEmail        String    // existing, now snapshot
  clientCompanyName  String?   // new
  clientPhone        String?   // new
  clientAddress      String?   // new
}
```

### Key Decisions

- **`archivedAt` timestamp** rather than boolean - provides audit trail of when archived
- **`clientId` nullable** - existing invoices won't have reference until migration
- **Snapshot pattern** - invoice stores copy of client data at creation for historical accuracy
- **Soft delete** - clients with invoices cannot be hard deleted, only archived

## Client Management Pages

### Routes

- `/clients` - List all active clients
- `/clients/new` - Create client form
- `/clients/[id]` - Edit client form

### Client List Page

- Header: "Clients" with "New Client" button
- Table columns: Name, Company, Email, Phone, Invoices (count), Actions
- Search box filters by name/email/company (client-side for MVP)
- Toggle to "Show archived" at bottom
- Archived clients shown with muted styling + "Archived" badge

### Client Form

- Reusable `ClientForm` component
- Fields: Name (required), Email (required), Company Name, Phone, Address (textarea)
- Back link, Cancel/Save buttons
- Edit page: "Archive" button with confirmation if client has invoices

### Server Actions (`src/app/actions/clients.ts`)

- `createClient(data)`
- `updateClient(id, data)`
- `archiveClient(id)` - sets `archivedAt`
- `restoreClient(id)` - clears `archivedAt`
- `getClients(includeArchived?)`
- `getClient(id)`

## Invoice Form Changes

### Client Selection

- Replace free-text client fields with dropdown selector
- Shows active clients: "Acme Corp (acme@example.com)"
- Required field - can't create invoice without client
- Link: "Don't see your client? Create one" (opens `/clients/new`)

### Snapshot Behavior

- When client selected: snapshot fields auto-populate (hidden from user)
- Form shows read-only summary below selector
- On submit: snapshot copied from client's current data
- Editing invoice: warning if client details changed since creation

## Migration Strategy

### Seed Script Update

1. Create clients first from unique name/email combinations
2. Create invoices with `clientId` reference + snapshot fields

### Existing Data Migration

```
1. Group invoices by (clientName, clientEmail)
2. Create Client for each unique combination
3. Update invoices with clientId
4. New snapshot fields (company, phone, address) → null
```

### Seed Data Clients

| Name | Company | Email |
|------|---------|-------|
| Acme Corp | Acme Corp | acme@example.com |
| Globex Ltd | Globex Ltd | globex@example.com |
| Initech | Initech | initech@example.com |
| Umbrella Inc | Umbrella Inc | umbrella@example.com |
| Sterling & Partners | Sterling & Partners | sterling@example.com |
| Northwind Traders | Northwind Traders | northwind@example.com |

## TDD Implementation Order

### Phase 1: Schema & Foundation
1. Add Client model to `prisma/schema.prisma`, update Invoice model
2. Run `prisma db push` and `prisma generate`

### Phase 2: Validation (Test First)
1. Write `__tests__/lib/clients-validation.test.ts`
2. Implement `src/lib/clients-validation.ts`

### Phase 3: Server Actions (Test First)
1. Write `__tests__/actions/clients.test.ts`
2. Implement `src/app/actions/clients.ts`

### Phase 4: Client Form (Test First)
1. Write `__tests__/components/ClientForm.test.tsx`
2. Implement `src/components/client-form.tsx`
3. Wire up `/clients/new` and `/clients/[id]` pages

### Phase 5: Client Selector (Test First)
1. Write `__tests__/components/ClientSelector.test.tsx`
2. Implement `src/components/client-selector.tsx`

### Phase 6: Invoice Form Integration (Test First)
1. Update `__tests__/components/InvoiceForm.test.tsx`
2. Modify `src/components/invoice-form.tsx`

### Phase 7: Pages & Seed
1. Build `/clients` list page
2. Update `prisma/seed.ts`

## Files

### New Files
- `src/app/clients/page.tsx`
- `src/app/clients/new/page.tsx`
- `src/app/clients/[id]/page.tsx`
- `src/app/actions/clients.ts`
- `src/components/client-form.tsx`
- `src/components/client-selector.tsx`
- `src/lib/clients-validation.ts`
- `__tests__/lib/clients-validation.test.ts`
- `__tests__/actions/clients.test.ts`
- `__tests__/components/ClientForm.test.tsx`
- `__tests__/components/ClientSelector.test.tsx`

### Modified Files
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/components/invoice-form.tsx`
- `src/app/page.tsx` (add nav to clients)
- `__tests__/components/InvoiceForm.test.tsx`

## Interview Talking Points

This feature demonstrates:
- **Relational data modeling** - Client-Invoice relationship with proper foreign keys
- **Snapshot pattern** - Denormalizing for historical accuracy while maintaining references
- **Soft delete** - Production pattern for audit compliance
- **Migration thinking** - How to evolve schema with existing data
- **TDD discipline** - Tests drive implementation at each phase
