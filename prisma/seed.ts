import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clients and invoices...');

  // Create clients first
  const clientsData = [
    {
      name: 'Acme Corp',
      email: 'billing@acme.com',
      companyName: 'Acme Corporation',
      phone: '+1-555-123-4567',
      address: '123 Business Ave\nSan Francisco, CA 94107',
    },
    {
      name: 'Globex Ltd',
      email: 'accounts@globex.com',
      companyName: 'Globex Limited',
      phone: '+1-555-234-5678',
      address: '456 Commerce St\nNew York, NY 10001',
    },
    {
      name: 'Initech',
      email: 'finance@initech.com',
      companyName: 'Initech Inc',
      phone: '+1-555-345-6789',
      address: '789 Tech Park\nAustin, TX 78701',
    },
    {
      name: 'Umbrella Inc',
      email: 'ap@umbrella.com',
      companyName: 'Umbrella Corporation',
      phone: '+1-555-456-7890',
      address: '321 Corporate Blvd\nRacoon City, RC 12345',
    },
    {
      name: 'Sterling Partners',
      email: 'invoices@sterling.com',
      companyName: 'Sterling & Partners LLP',
      phone: '+1-555-567-8901',
      address: '555 Madison Ave\nNew York, NY 10022',
    },
    {
      name: 'Northwind Traders',
      email: 'billing@northwind.com',
      companyName: 'Northwind Traders Inc',
      phone: '+1-555-678-9012',
      address: '888 Trade Center\nSeattle, WA 98101',
    },
  ];

  // Create or update clients
  const clients: Record<string, string> = {};
  for (const clientData of clientsData) {
    const client = await prisma.client.upsert({
      where: { email: clientData.email },
      update: clientData,
      create: clientData,
    });
    clients[clientData.name] = client.id;
    console.log(`Created/updated client: ${client.name}`);
  }

  // Get next invoice number
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { invoiceNumber: 'desc' },
  });
  let nextNum = 1;
  if (lastInvoice?.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }

  const invoices = [
    {
      clientName: 'Acme Corp',
      status: 'paid',
      daysAgo: 20,
      dueDaysAgo: 10,
      lineItems: [
        { description: 'Web Development', quantity: 40, unitPrice: 95 },
        { description: 'Hosting Setup', quantity: 1, unitPrice: 200 },
      ],
    },
    {
      clientName: 'Globex Ltd',
      status: 'paid',
      daysAgo: 15,
      dueDaysAgo: 5,
      lineItems: [
        { description: 'Technical Consulting', quantity: 8, unitPrice: 150 },
        { description: 'Documentation', quantity: 1, unitPrice: 450 },
      ],
    },
    {
      clientName: 'Initech',
      status: 'sent',
      daysAgo: 5,
      dueDaysFromNow: 25,
      lineItems: [
        { description: 'UI/UX Design', quantity: 24, unitPrice: 85 },
        { description: 'Frontend Development', quantity: 32, unitPrice: 95 },
      ],
    },
    {
      clientName: 'Umbrella Inc',
      status: 'sent',
      daysAgo: 14,
      dueDaysAgo: 4, // overdue
      lineItems: [
        { description: 'API Integration', quantity: 16, unitPrice: 110 },
      ],
    },
    {
      clientName: 'Sterling Partners',
      status: 'draft',
      daysAgo: 2,
      dueDaysFromNow: 28,
      lineItems: [
        { description: 'Brand Strategy Workshop', quantity: 1, unitPrice: 2500 },
        { description: 'Logo Design', quantity: 1, unitPrice: 1600 },
      ],
    },
    {
      clientName: 'Northwind Traders',
      status: 'draft',
      daysAgo: 1,
      dueDaysFromNow: 30,
      lineItems: [
        { description: 'Database Optimization', quantity: 12, unitPrice: 125 },
      ],
    },
  ];

  for (const inv of invoices) {
    const invoiceNumber = `INV-${String(nextNum).padStart(3, '0')}`;
    nextNum++;

    const issueDate = new Date();
    issueDate.setDate(issueDate.getDate() - inv.daysAgo);

    const dueDate = new Date();
    if ('dueDaysAgo' in inv && inv.dueDaysAgo !== undefined) {
      dueDate.setDate(dueDate.getDate() - inv.dueDaysAgo);
    } else if ('dueDaysFromNow' in inv && inv.dueDaysFromNow !== undefined) {
      dueDate.setDate(dueDate.getDate() + inv.dueDaysFromNow);
    }

    // Find the client data for snapshot
    const clientData = clientsData.find((c) => c.name === inv.clientName);
    const clientId = clients[inv.clientName];

    if (!clientData || !clientId) {
      console.error(`Client not found: ${inv.clientName}`);
      continue;
    }

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        clientName: clientData.name,
        clientEmail: clientData.email,
        clientCompanyName: clientData.companyName,
        clientPhone: clientData.phone,
        clientAddress: clientData.address,
        status: inv.status,
        issueDate,
        dueDate,
        lineItems: {
          create: inv.lineItems,
        },
      },
    });

    console.log(`Created ${invoiceNumber} - ${inv.clientName}`);
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
