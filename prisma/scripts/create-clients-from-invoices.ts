/**
 * Migration script to:
 * 1. Create clients from unlinked invoices
 * 2. Fill in empty client fields from invoice snapshot data
 *
 * Run with: npx tsx prisma/scripts/create-clients-from-invoices.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateClientsFromInvoices() {
  console.log('Starting client migration from invoices...\n');

  // === PART 1: Create clients from unlinked invoices ===
  const unlinkedInvoices = await prisma.invoice.findMany({
    where: { clientId: null },
    select: {
      id: true,
      clientName: true,
      clientEmail: true,
      clientPhone: true,
      clientAddress: true,
    },
  });

  if (unlinkedInvoices.length > 0) {
    console.log(`Found ${unlinkedInvoices.length} unlinked invoices`);

    const clientsByEmail = new Map<string, (typeof unlinkedInvoices)[0]>();
    for (const invoice of unlinkedInvoices) {
      if (invoice.clientEmail && !clientsByEmail.has(invoice.clientEmail)) {
        clientsByEmail.set(invoice.clientEmail, invoice);
      }
    }

    console.log(`Creating ${clientsByEmail.size} new clients...\n`);

    const emailToClientId = new Map<string, string>();
    for (const [email, data] of clientsByEmail) {
      const client = await prisma.client.upsert({
        where: { email },
        create: {
          name: data.clientName,
          email: data.clientEmail,
          phone: data.clientPhone,
          address: data.clientAddress,
        },
        update: {},
      });
      emailToClientId.set(email, client.id);
      console.log(`Created client: ${client.name} <${email}>`);
    }

    console.log('\nLinking invoices to clients...');
    let linked = 0;
    for (const invoice of unlinkedInvoices) {
      if (invoice.clientEmail) {
        const clientId = emailToClientId.get(invoice.clientEmail);
        if (clientId) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: { clientId },
          });
          linked++;
        }
      }
    }
    console.log(`Linked ${linked} invoices\n`);
  } else {
    console.log('No unlinked invoices found.\n');
  }

  // === PART 2: Fill in empty client fields from invoice data ===
  console.log('Checking for clients with missing data...');

  const clientsWithMissingData = await prisma.client.findMany({
    where: {
      OR: [
        { phone: null },
        { address: null },
      ],
    },
    include: {
      invoices: {
        select: {
          clientPhone: true,
          clientAddress: true,
        },
      },
    },
  });

  if (clientsWithMissingData.length === 0) {
    console.log('All clients have complete data.\n');
  } else {
    console.log(`Found ${clientsWithMissingData.length} clients with missing fields\n`);

    let updated = 0;
    for (const client of clientsWithMissingData) {
      if (client.invoices.length === 0) continue;

      // Use first non-null value found from linked invoices
      let phone = client.phone;
      let address = client.address;

      for (const inv of client.invoices) {
        if (!phone && inv.clientPhone) phone = inv.clientPhone;
        if (!address && inv.clientAddress) address = inv.clientAddress;
      }

      // Update if we found any new data
      const hasUpdates =
        phone !== client.phone ||
        address !== client.address;

      if (hasUpdates) {
        await prisma.client.update({
          where: { id: client.id },
          data: { phone, address },
        });
        console.log(`Updated ${client.name}: filled missing fields`);
        updated++;
      }
    }

    console.log(`\nUpdated ${updated} clients with data from invoices`);
  }

  console.log('\nMigration complete!');
}

migrateClientsFromInvoices()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
