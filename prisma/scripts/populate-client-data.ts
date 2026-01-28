/**
 * Populate clients with sample data for testing.
 * Run with: npx tsx prisma/scripts/populate-client-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const sampleData = [
  { phone: '+358 40 123 4567', address: 'Mannerheimintie 1, 00100 Helsinki' },
  { phone: '+358 50 234 5678', address: 'Aleksanterinkatu 15, 00100 Helsinki' },
  { phone: '+358 45 345 6789', address: 'Itämerenkatu 5, 00180 Helsinki' },
  { phone: '+358 40 456 7890', address: 'Bulevardi 21, 00120 Helsinki' },
  { phone: '+358 50 567 8901', address: 'Erottajankatu 9, 00130 Helsinki' },
  { phone: '+358 45 678 9012', address: 'Fredrikinkatu 33, 00120 Helsinki' },
  { phone: '+358 40 789 0123', address: 'Kampinkuja 2, 00100 Helsinki' },
  { phone: '+358 50 890 1234', address: 'Lönnrotinkatu 18, 00120 Helsinki' },
];

async function populateClientData() {
  console.log('Populating client data...\n');

  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { phone: null },
        { address: null },
      ],
    },
  });

  console.log(`Found ${clients.length} clients with missing data\n`);

  let updated = 0;
  for (let i = 0; i < clients.length; i++) {
    const client = clients[i];
    const sample = sampleData[i % sampleData.length];

    await prisma.client.update({
      where: { id: client.id },
      data: {
        phone: client.phone ?? sample.phone,
        address: client.address ?? sample.address,
      },
    });

    console.log(`Updated ${client.name}`);
    updated++;
  }

  console.log(`\nPopulated ${updated} clients with sample data`);
}

populateClientData()
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
