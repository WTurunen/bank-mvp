import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding clients and invoices...');

  // Create clients first
  // Using RFC 2606 reserved TLD (.example.invalid) and fictional phone range (555-01xx)
  const clientsData = [
    {
      name: 'Acme Corporation',
      email: 'billing@acme.example.invalid',
      phone: '555-0101',
      address: '123 Business Ave\nSan Francisco, CA 94107',
    },
    {
      name: 'Globex Limited',
      email: 'accounts@globex.example.invalid',
      phone: '555-0102',
      address: '456 Commerce St\nNew York, NY 10001',
    },
    {
      name: 'Initech Inc',
      email: 'finance@initech.example.invalid',
      phone: '555-0103',
      address: '789 Tech Park\nAustin, TX 78701',
    },
    {
      name: 'Umbrella Corporation',
      email: 'ap@umbrella.example.invalid',
      phone: '555-0104',
      address: '321 Corporate Blvd\nRacoon City, RC 12345',
    },
    {
      name: 'Sterling & Partners LLP',
      email: 'invoices@sterling.example.invalid',
      phone: '555-0105',
      address: '555 Madison Ave\nNew York, NY 10022',
    },
    {
      name: 'Northwind Traders Inc',
      email: 'billing@northwind.example.invalid',
      phone: '555-0106',
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
      clientName: 'Acme Corporation',
      status: 'paid',
      daysAgo: 20,
      dueDaysAgo: 10,
      lineItems: [
        { description: 'Web Development', quantity: 40, unitPrice: 95 },
        { description: 'Hosting Setup', quantity: 1, unitPrice: 200 },
      ],
    },
    {
      clientName: 'Globex Limited',
      status: 'paid',
      daysAgo: 15,
      dueDaysAgo: 5,
      lineItems: [
        { description: 'Technical Consulting', quantity: 8, unitPrice: 150 },
        { description: 'Documentation', quantity: 1, unitPrice: 450 },
      ],
    },
    {
      clientName: 'Initech Inc',
      status: 'sent',
      daysAgo: 5,
      dueDaysFromNow: 25,
      lineItems: [
        { description: 'UI/UX Design', quantity: 24, unitPrice: 85 },
        { description: 'Frontend Development', quantity: 32, unitPrice: 95 },
      ],
    },
    {
      clientName: 'Umbrella Corporation',
      status: 'sent',
      daysAgo: 14,
      dueDaysAgo: 4, // overdue
      lineItems: [
        { description: 'API Integration', quantity: 16, unitPrice: 110 },
      ],
    },
    {
      clientName: 'Sterling & Partners LLP',
      status: 'draft',
      daysAgo: 2,
      dueDaysFromNow: 28,
      lineItems: [
        { description: 'Brand Strategy Workshop', quantity: 1, unitPrice: 2500 },
        { description: 'Logo Design', quantity: 1, unitPrice: 1600 },
      ],
    },
    {
      clientName: 'Northwind Traders Inc',
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
