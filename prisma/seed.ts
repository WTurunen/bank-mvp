import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo invoices...');

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
      clientEmail: 'billing@acme.com',
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
      clientEmail: 'accounts@globex.com',
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
      clientEmail: 'finance@initech.com',
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
      clientEmail: 'ap@umbrella.com',
      status: 'sent',
      daysAgo: 14,
      dueDaysAgo: 4, // overdue
      lineItems: [
        { description: 'API Integration', quantity: 16, unitPrice: 110 },
      ],
    },
    {
      clientName: 'Sterling Partners',
      clientEmail: 'invoices@sterling.com',
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
      clientEmail: 'billing@northwind.com',
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

    await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName: inv.clientName,
        clientEmail: inv.clientEmail,
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
