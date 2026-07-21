import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing demo seed without ALLOW_DEMO_SEED=true');
  }
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error('DEMO_PASSWORD must contain at least 12 characters');
  }
  console.log('Seeding database with comprehensive sample data...');

  // ==================== LOOKUPS (Configurable Dropdowns) ====================
  console.log('Creating lookup values...');
  const lookupData = [
    // Industries
    { category: 'industry', value: 'Technology', label: 'Technology', order: 1 },
    { category: 'industry', value: 'Healthcare', label: 'Healthcare', order: 2 },
    { category: 'industry', value: 'Finance', label: 'Finance', order: 3 },
    { category: 'industry', value: 'Retail', label: 'Retail', order: 4 },
    { category: 'industry', value: 'Manufacturing', label: 'Manufacturing', order: 5 },
    { category: 'industry', value: 'Education', label: 'Education', order: 6 },
    { category: 'industry', value: 'Real Estate', label: 'Real Estate', order: 7 },
    { category: 'industry', value: 'Energy', label: 'Energy', order: 8 },
    { category: 'industry', value: 'Hospitality', label: 'Hospitality', order: 9 },
    { category: 'industry', value: 'Automotive', label: 'Automotive', order: 10 },
    { category: 'industry', value: 'Entertainment', label: 'Entertainment', order: 11 },
    { category: 'industry', value: 'Logistics', label: 'Logistics', order: 12 },
    { category: 'industry', value: 'Sports', label: 'Sports', order: 13 },
    { category: 'industry', value: 'Travel', label: 'Travel', order: 14 },
    { category: 'industry', value: 'Other', label: 'Other', order: 99 },

    // Client Statuses
    { category: 'client_status', value: 'ACTIVE', label: 'Active', order: 1 },
    { category: 'client_status', value: 'INACTIVE', label: 'Inactive', order: 2 },
    { category: 'client_status', value: 'PROSPECT', label: 'Prospect', order: 3 },
    { category: 'client_status', value: 'CHURNED', label: 'Churned', order: 4 },

    // Project Statuses
    { category: 'project_status', value: 'PLANNING', label: 'Planning', order: 1 },
    { category: 'project_status', value: 'IN_PROGRESS', label: 'In Progress', order: 2 },
    { category: 'project_status', value: 'ON_HOLD', label: 'On Hold', order: 3 },
    { category: 'project_status', value: 'COMPLETED', label: 'Completed', order: 4 },
    { category: 'project_status', value: 'CANCELLED', label: 'Cancelled', order: 5 },

    // Campaign Types
    { category: 'campaign_type', value: 'EMAIL', label: 'Email', order: 1 },
    { category: 'campaign_type', value: 'SOCIAL', label: 'Social Media', order: 2 },
    { category: 'campaign_type', value: 'PPC', label: 'PPC', order: 3 },
    { category: 'campaign_type', value: 'CONTENT', label: 'Content', order: 4 },
    { category: 'campaign_type', value: 'SEO', label: 'SEO', order: 5 },
    { category: 'campaign_type', value: 'MULTI_CHANNEL', label: 'Multi-Channel', order: 6 },

    // Lead Sources
    { category: 'lead_source', value: 'WEBSITE', label: 'Website', order: 1 },
    { category: 'lead_source', value: 'REFERRAL', label: 'Referral', order: 2 },
    { category: 'lead_source', value: 'COLD_CALL', label: 'Cold Call', order: 3 },
    { category: 'lead_source', value: 'EMAIL_CAMPAIGN', label: 'Email Campaign', order: 4 },
    { category: 'lead_source', value: 'SOCIAL_MEDIA', label: 'Social Media', order: 5 },
    { category: 'lead_source', value: 'AD_CAMPAIGN', label: 'Ad Campaign', order: 6 },
    { category: 'lead_source', value: 'EVENT', label: 'Event', order: 7 },
    { category: 'lead_source', value: 'OTHER', label: 'Other', order: 99 },

    // Candidate Sources
    { category: 'candidate_source', value: 'LinkedIn', label: 'LinkedIn', order: 1 },
    { category: 'candidate_source', value: 'Indeed', label: 'Indeed', order: 2 },
    { category: 'candidate_source', value: 'Glassdoor', label: 'Glassdoor', order: 3 },
    { category: 'candidate_source', value: 'Referral', label: 'Referral', order: 4 },
    { category: 'candidate_source', value: 'Website', label: 'Website', order: 5 },
    { category: 'candidate_source', value: 'Job Fair', label: 'Job Fair', order: 6 },
    { category: 'candidate_source', value: 'University', label: 'University', order: 7 },
    { category: 'candidate_source', value: 'Agency', label: 'Recruitment Agency', order: 8 },
    { category: 'candidate_source', value: 'Other', label: 'Other', order: 99 },

    // Billing Types
    { category: 'billing_type', value: 'RETAINER', label: 'Retainer', order: 1 },
    { category: 'billing_type', value: 'PROJECT', label: 'Project', order: 2 },
    { category: 'billing_type', value: 'TIME_BASED', label: 'Time-Based', order: 3 },
    { category: 'billing_type', value: 'COMMISSION', label: 'Commission', order: 4 },

    // Task Priorities
    { category: 'task_priority', value: 'LOW', label: 'Low', order: 1 },
    { category: 'task_priority', value: 'MEDIUM', label: 'Medium', order: 2 },
    { category: 'task_priority', value: 'HIGH', label: 'High', order: 3 },
    { category: 'task_priority', value: 'URGENT', label: 'Urgent', order: 4 },

    // Task Statuses
    { category: 'task_status', value: 'TODO', label: 'To Do', order: 1 },
    { category: 'task_status', value: 'IN_PROGRESS', label: 'In Progress', order: 2 },
    { category: 'task_status', value: 'IN_REVIEW', label: 'In Review', order: 3 },
    { category: 'task_status', value: 'COMPLETED', label: 'Completed', order: 4 },
  ];

  for (const lookup of lookupData) {
    await prisma.lookup.upsert({
      where: { category_value: { category: lookup.category, value: lookup.value } },
      update: { label: lookup.label, order: lookup.order },
      create: lookup
    });
  }
  console.log(`Created ${lookupData.length} lookup values`);

  const hashedPassword = await bcrypt.hash(demoPassword, 12);

  // ==================== USERS (15+) ====================
  console.log('Creating users...');
  const users = await Promise.all([
    prisma.user.upsert({ where: { email: 'admin@agency.com' }, update: {}, create: { email: 'admin@agency.com', password: hashedPassword, name: 'Admin User', role: 'ADMIN' } }),
    prisma.user.upsert({ where: { email: 'sarah.johnson@agency.com' }, update: {}, create: { email: 'sarah.johnson@agency.com', password: hashedPassword, name: 'Sarah Johnson', role: 'MANAGER' } }),
    prisma.user.upsert({ where: { email: 'mike.chen@agency.com' }, update: {}, create: { email: 'mike.chen@agency.com', password: hashedPassword, name: 'Mike Chen', role: 'MANAGER' } }),
    prisma.user.upsert({ where: { email: 'emily.davis@agency.com' }, update: {}, create: { email: 'emily.davis@agency.com', password: hashedPassword, name: 'Emily Davis', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'james.wilson@agency.com' }, update: {}, create: { email: 'james.wilson@agency.com', password: hashedPassword, name: 'James Wilson', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'lisa.martinez@agency.com' }, update: {}, create: { email: 'lisa.martinez@agency.com', password: hashedPassword, name: 'Lisa Martinez', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'david.brown@agency.com' }, update: {}, create: { email: 'david.brown@agency.com', password: hashedPassword, name: 'David Brown', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'amanda.taylor@agency.com' }, update: {}, create: { email: 'amanda.taylor@agency.com', password: hashedPassword, name: 'Amanda Taylor', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'robert.garcia@agency.com' }, update: {}, create: { email: 'robert.garcia@agency.com', password: hashedPassword, name: 'Robert Garcia', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'jennifer.lee@agency.com' }, update: {}, create: { email: 'jennifer.lee@agency.com', password: hashedPassword, name: 'Jennifer Lee', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'michael.anderson@agency.com' }, update: {}, create: { email: 'michael.anderson@agency.com', password: hashedPassword, name: 'Michael Anderson', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'nicole.white@agency.com' }, update: {}, create: { email: 'nicole.white@agency.com', password: hashedPassword, name: 'Nicole White', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'chris.thompson@agency.com' }, update: {}, create: { email: 'chris.thompson@agency.com', password: hashedPassword, name: 'Chris Thompson', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'stephanie.harris@agency.com' }, update: {}, create: { email: 'stephanie.harris@agency.com', password: hashedPassword, name: 'Stephanie Harris', role: 'MEMBER' } }),
    prisma.user.upsert({ where: { email: 'kevin.clark@agency.com' }, update: {}, create: { email: 'kevin.clark@agency.com', password: hashedPassword, name: 'Kevin Clark', role: 'MEMBER' } }),
  ]);
  console.log(`Created ${users.length} users`);

  const admin = users[0];
  const managers = users.slice(1, 3);
  const members = users.slice(3);

  // ==================== CLIENTS (20+) ====================
  console.log('Creating clients...');
  const clientsData = [
    { name: 'Acme Corporation', email: 'contact@acme.com', phone: '+1 555-0100', company: 'Acme Corp', website: 'https://acme.com', industry: 'Technology', status: 'ACTIVE' as const, address: '123 Tech Blvd, San Francisco, CA' },
    { name: 'TechStart Inc', email: 'hello@techstart.io', phone: '+1 555-0101', company: 'TechStart', website: 'https://techstart.io', industry: 'Technology', status: 'ACTIVE' as const, address: '456 Innovation Ave, Austin, TX' },
    { name: 'Global Retail Co', email: 'info@globalretail.com', phone: '+1 555-0102', company: 'Global Retail', website: 'https://globalretail.com', industry: 'Retail', status: 'ACTIVE' as const, address: '789 Commerce St, New York, NY' },
    { name: 'HealthFirst Medical', email: 'admin@healthfirst.org', phone: '+1 555-0103', company: 'HealthFirst', website: 'https://healthfirst.org', industry: 'Healthcare', status: 'ACTIVE' as const, address: '321 Medical Center Dr, Boston, MA' },
    { name: 'EduLearn Academy', email: 'info@edulearn.edu', phone: '+1 555-0104', company: 'EduLearn', website: 'https://edulearn.edu', industry: 'Education', status: 'ACTIVE' as const, address: '567 Campus Way, Seattle, WA' },
    { name: 'FinanceHub LLC', email: 'contact@financehub.com', phone: '+1 555-0105', company: 'FinanceHub', website: 'https://financehub.com', industry: 'Finance', status: 'ACTIVE' as const, address: '890 Wall St, Chicago, IL' },
    { name: 'GreenEnergy Solutions', email: 'hello@greenenergy.com', phone: '+1 555-0106', company: 'GreenEnergy', website: 'https://greenenergy.com', industry: 'Energy', status: 'ACTIVE' as const, address: '234 Solar Ave, Denver, CO' },
    { name: 'Urban Properties', email: 'info@urbanprops.com', phone: '+1 555-0107', company: 'Urban Properties', website: 'https://urbanprops.com', industry: 'Real Estate', status: 'ACTIVE' as const, address: '678 Realty Blvd, Miami, FL' },
    { name: 'FoodDelight Restaurant Group', email: 'contact@fooddelight.com', phone: '+1 555-0108', company: 'FoodDelight', website: 'https://fooddelight.com', industry: 'Hospitality', status: 'ACTIVE' as const, address: '901 Culinary St, Los Angeles, CA' },
    { name: 'AutoDrive Motors', email: 'sales@autodrive.com', phone: '+1 555-0109', company: 'AutoDrive', website: 'https://autodrive.com', industry: 'Automotive', status: 'ACTIVE' as const, address: '345 Motor Way, Detroit, MI' },
    { name: 'CloudSync Software', email: 'support@cloudsync.io', phone: '+1 555-0110', company: 'CloudSync', website: 'https://cloudsync.io', industry: 'Technology', status: 'ACTIVE' as const, address: '678 Cloud Ave, Portland, OR' },
    { name: 'FashionForward', email: 'hello@fashionforward.com', phone: '+1 555-0111', company: 'FashionForward', website: 'https://fashionforward.com', industry: 'Retail', status: 'ACTIVE' as const, address: '901 Style St, New York, NY' },
    { name: 'MediaMax Entertainment', email: 'info@mediamax.com', phone: '+1 555-0112', company: 'MediaMax', website: 'https://mediamax.com', industry: 'Entertainment', status: 'ACTIVE' as const, address: '234 Studio Blvd, Hollywood, CA' },
    { name: 'LogiTech Freight', email: 'ops@logitech-freight.com', phone: '+1 555-0113', company: 'LogiTech Freight', website: 'https://logitech-freight.com', industry: 'Logistics', status: 'ACTIVE' as const, address: '567 Shipping Ln, Houston, TX' },
    { name: 'BioPharm Labs', email: 'research@biopharmlabs.com', phone: '+1 555-0114', company: 'BioPharm Labs', website: 'https://biopharmlabs.com', industry: 'Healthcare', status: 'ACTIVE' as const, address: '890 Research Dr, San Diego, CA' },
    { name: 'SportsPro Athletics', email: 'info@sportspro.com', phone: '+1 555-0115', company: 'SportsPro', website: 'https://sportspro.com', industry: 'Sports', status: 'PROSPECT' as const, address: '123 Arena Way, Phoenix, AZ' },
    { name: 'TravelEase Vacations', email: 'book@travelease.com', phone: '+1 555-0116', company: 'TravelEase', website: 'https://travelease.com', industry: 'Travel', status: 'PROSPECT' as const, address: '456 Holiday Ave, Orlando, FL' },
    { name: 'SecureIT Solutions', email: 'security@secureit.com', phone: '+1 555-0117', company: 'SecureIT', website: 'https://secureit.com', industry: 'Technology', status: 'INACTIVE' as const, address: '789 Cyber St, Washington, DC' },
    { name: 'ArtisanCrafts Co', email: 'hello@artisancrafts.com', phone: '+1 555-0118', company: 'ArtisanCrafts', website: 'https://artisancrafts.com', industry: 'Retail', status: 'CHURNED' as const, address: '321 Craft Ln, Nashville, TN' },
    { name: 'PetCare Plus', email: 'care@petcareplus.com', phone: '+1 555-0119', company: 'PetCare Plus', website: 'https://petcareplus.com', industry: 'Retail', status: 'ACTIVE' as const, address: '654 Pet Blvd, Atlanta, GA' },
  ];

  const clients = [];
  for (const clientData of clientsData) {
    const client = await prisma.client.create({
      data: { ...clientData, createdById: admin.id }
    });
    clients.push(client);
  }
  console.log(`Created ${clients.length} clients`);

  // ==================== CONTRACTS (20+) ====================
  console.log('Creating contracts...');
  const contractsData = [];
  for (let i = 0; i < 20; i++) {
    const client = clients[i % clients.length];
    contractsData.push({
      clientId: client.id,
      title: [`Annual Service Agreement`, `Marketing Retainer`, `Website Development`, `SEO Package`, `Social Media Management`, `Brand Strategy`, `Content Creation`, `PPC Management`][i % 8] + ` - ${client.company}`,
      description: `Professional services contract for ${client.company}`,
      startDate: new Date(2024, i % 12, 1),
      endDate: new Date(2025, i % 12, 1),
      value: [5000, 10000, 25000, 50000, 75000, 100000][i % 6],
      status: ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PENDING', 'DRAFT'][i % 5] as 'DRAFT' | 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED',
    });
  }
  await prisma.contract.createMany({ data: contractsData });
  console.log(`Created ${contractsData.length} contracts`);

  // ==================== PROJECTS (20+) ====================
  console.log('Creating projects...');
  const projectsData = [
    { name: 'Website Redesign', description: 'Complete website redesign with modern UI/UX', status: 'IN_PROGRESS' as const, budget: 25000 },
    { name: 'Mobile App Development', description: 'iOS and Android app development', status: 'IN_PROGRESS' as const, budget: 75000 },
    { name: 'Brand Identity Refresh', description: 'Logo, colors, and brand guidelines update', status: 'COMPLETED' as const, budget: 15000 },
    { name: 'E-commerce Platform', description: 'Full e-commerce solution with payment integration', status: 'IN_PROGRESS' as const, budget: 50000 },
    { name: 'SEO Optimization', description: 'Comprehensive SEO audit and implementation', status: 'COMPLETED' as const, budget: 8000 },
    { name: 'Content Marketing Strategy', description: 'Content calendar and blog strategy', status: 'IN_PROGRESS' as const, budget: 12000 },
    { name: 'Social Media Campaign', description: 'Q4 social media marketing campaign', status: 'PLANNING' as const, budget: 20000 },
    { name: 'PPC Campaign Management', description: 'Google Ads and Meta Ads management', status: 'IN_PROGRESS' as const, budget: 30000 },
    { name: 'CRM Implementation', description: 'Salesforce CRM setup and customization', status: 'ON_HOLD' as const, budget: 45000 },
    { name: 'Video Production', description: 'Corporate video and marketing videos', status: 'COMPLETED' as const, budget: 35000 },
    { name: 'Email Marketing Automation', description: 'HubSpot email automation setup', status: 'IN_PROGRESS' as const, budget: 10000 },
    { name: 'Landing Page Development', description: 'High-converting landing pages', status: 'COMPLETED' as const, budget: 5000 },
    { name: 'Market Research Study', description: 'Competitive analysis and market research', status: 'COMPLETED' as const, budget: 18000 },
    { name: 'UI/UX Audit', description: 'User experience analysis and recommendations', status: 'IN_PROGRESS' as const, budget: 7500 },
    { name: 'API Integration', description: 'Third-party API integrations', status: 'PLANNING' as const, budget: 22000 },
    { name: 'Database Migration', description: 'Legacy database migration to cloud', status: 'ON_HOLD' as const, budget: 40000 },
    { name: 'Security Audit', description: 'Comprehensive security assessment', status: 'COMPLETED' as const, budget: 15000 },
    { name: 'Performance Optimization', description: 'Website speed and performance improvements', status: 'IN_PROGRESS' as const, budget: 8500 },
    { name: 'Analytics Dashboard', description: 'Custom analytics dashboard development', status: 'PLANNING' as const, budget: 28000 },
    { name: 'Chatbot Development', description: 'AI-powered customer service chatbot', status: 'IN_PROGRESS' as const, budget: 35000 },
  ];

  const projects = [];
  for (let i = 0; i < projectsData.length; i++) {
    const project = await prisma.project.create({
      data: {
        ...projectsData[i],
        clientId: clients[i % clients.length].id,
        managerId: managers[i % managers.length].id,
        startDate: new Date(2024, i % 12, 1),
        endDate: new Date(2024, (i + 3) % 12, 28),
      }
    });
    projects.push(project);
  }
  console.log(`Created ${projects.length} projects`);

  // ==================== TASKS (50+) ====================
  console.log('Creating tasks...');
  const taskTitles = [
    'Design mockups', 'Frontend development', 'Backend integration', 'Testing & QA', 'Content writing',
    'SEO optimization', 'Performance testing', 'Bug fixes', 'Code review', 'Documentation',
    'User research', 'Wireframing', 'Database design', 'API development', 'Security audit',
    'Deployment setup', 'Client review', 'Revisions', 'Final approval', 'Launch preparation'
  ];
  const tasksData = [];
  for (let i = 0; i < 60; i++) {
    tasksData.push({
      projectId: projects[i % projects.length].id,
      title: taskTitles[i % taskTitles.length],
      description: `Task description for ${taskTitles[i % taskTitles.length]}`,
      assigneeId: members[i % members.length].id,
      status: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'][i % 4] as 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED',
      priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4] as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      dueDate: new Date(2024, 11, (i % 28) + 1),
      estimatedHours: [2, 4, 8, 16, 24][i % 5],
    });
  }
  await prisma.task.createMany({ data: tasksData });
  console.log(`Created ${tasksData.length} tasks`);

  // ==================== MILESTONES (30+) ====================
  console.log('Creating milestones...');
  const milestoneTitles = ['Project Kickoff', 'Design Phase Complete', 'Development Complete', 'Testing Complete', 'Launch Ready'];
  const milestonesData = [];
  for (let i = 0; i < 40; i++) {
    milestonesData.push({
      projectId: projects[i % projects.length].id,
      title: milestoneTitles[i % milestoneTitles.length],
      description: `Milestone for ${milestoneTitles[i % milestoneTitles.length]}`,
      dueDate: new Date(2024, 11, (i % 28) + 1),
      completed: i % 3 === 0,
      completedAt: i % 3 === 0 ? new Date() : null,
    });
  }
  await prisma.milestone.createMany({ data: milestonesData });
  console.log(`Created ${milestonesData.length} milestones`);

  // ==================== TIME ENTRIES (50+) ====================
  console.log('Creating time entries...');
  const timeEntriesData = [];
  for (let i = 0; i < 60; i++) {
    timeEntriesData.push({
      projectId: projects[i % projects.length].id,
      userId: members[i % members.length].id,
      hours: [1, 2, 3, 4, 5, 6, 7, 8][i % 8],
      description: ['Development work', 'Design review', 'Client meeting', 'Code review', 'Testing', 'Documentation'][i % 6],
      date: new Date(2024, 10, (i % 28) + 1),
      billable: i % 4 !== 0,
    });
  }
  await prisma.timeEntry.createMany({ data: timeEntriesData });
  console.log(`Created ${timeEntriesData.length} time entries`);

  // ==================== CAMPAIGNS (20+) ====================
  console.log('Creating campaigns...');
  const campaignNames = [
    'Q4 Holiday Campaign', 'Brand Awareness Push', 'Product Launch', 'Lead Generation', 'Retargeting Campaign',
    'Email Newsletter', 'Social Media Blitz', 'SEO Content Push', 'PPC Optimization', 'Influencer Partnership',
    'Webinar Promotion', 'Trade Show Marketing', 'Customer Retention', 'Referral Program', 'Video Marketing',
    'Podcast Sponsorship', 'LinkedIn Outreach', 'Facebook Ads', 'Google Ads Campaign', 'Content Syndication'
  ];
  const campaigns = [];
  for (let i = 0; i < 20; i++) {
    const campaign = await prisma.campaign.create({
      data: {
        name: campaignNames[i],
        description: `Marketing campaign: ${campaignNames[i]}`,
        clientId: clients[i % clients.length].id,
        managerId: managers[i % managers.length].id,
        status: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED'][i % 5] as 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED',
        type: ['EMAIL', 'SOCIAL', 'PPC', 'CONTENT', 'SEO', 'MULTI_CHANNEL'][i % 6] as 'EMAIL' | 'SOCIAL' | 'PPC' | 'CONTENT' | 'SEO' | 'MULTI_CHANNEL',
        budget: [5000, 10000, 15000, 25000, 50000][i % 5],
        spent: [1000, 3000, 5000, 8000, 12000][i % 5],
        startDate: new Date(2024, i % 12, 1),
        endDate: new Date(2024, (i + 2) % 12, 28),
      }
    });
    campaigns.push(campaign);
  }
  console.log(`Created ${campaigns.length} campaigns`);

  // ==================== CAMPAIGN METRICS (60+) ====================
  console.log('Creating campaign metrics...');
  const metricsData = [];
  for (let i = 0; i < 80; i++) {
    metricsData.push({
      campaignId: campaigns[i % campaigns.length].id,
      date: new Date(2024, 10, (i % 28) + 1),
      impressions: Math.floor(Math.random() * 50000) + 10000,
      clicks: Math.floor(Math.random() * 2000) + 100,
      conversions: Math.floor(Math.random() * 100) + 5,
      spend: Math.floor(Math.random() * 500) + 50,
      revenue: Math.floor(Math.random() * 2000) + 100,
    });
  }
  await prisma.campaignMetric.createMany({ data: metricsData });
  console.log(`Created ${metricsData.length} campaign metrics`);

  // ==================== AB TESTS (15+) ====================
  console.log('Creating A/B tests...');
  const abTestsData = [];
  for (let i = 0; i < 18; i++) {
    abTestsData.push({
      campaignId: campaigns[i % campaigns.length].id,
      name: `A/B Test ${i + 1}: ${['Headline', 'CTA Button', 'Image', 'Copy', 'Layout', 'Color'][i % 6]} Test`,
      variantA: `Variant A - ${['Original headline', 'Blue button', 'Hero image', 'Short copy', 'Single column', 'Blue theme'][i % 6]}`,
      variantB: `Variant B - ${['New headline', 'Green button', 'Lifestyle image', 'Long copy', 'Two columns', 'Green theme'][i % 6]}`,
      status: ['RUNNING', 'COMPLETED', 'CANCELLED'][i % 3] as 'RUNNING' | 'COMPLETED' | 'CANCELLED',
      winnerVariant: i % 3 === 1 ? ['A', 'B'][i % 2] : null,
    });
  }
  await prisma.aBTest.createMany({ data: abTestsData });
  console.log(`Created ${abTestsData.length} A/B tests`);

  // ==================== JOB POSITIONS (15+) ====================
  console.log('Creating job positions...');
  const jobPositions = [
    { title: 'Senior Software Engineer', requirements: ['5+ years experience', 'React/Node.js', 'Cloud experience'], skills: ['JavaScript', 'React', 'Node.js', 'AWS'], salaryMin: 120000, salaryMax: 180000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Marketing Manager', requirements: ['3+ years marketing', 'Team leadership', 'Digital marketing'], skills: ['Marketing', 'Leadership', 'Analytics'], salaryMin: 80000, salaryMax: 120000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'UX Designer', requirements: ['Portfolio required', 'Figma expertise', 'User research'], skills: ['Figma', 'UI/UX', 'Prototyping'], salaryMin: 90000, salaryMax: 140000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Data Analyst', requirements: ['SQL proficiency', 'Python/R', 'Data visualization'], skills: ['SQL', 'Python', 'Tableau'], salaryMin: 75000, salaryMax: 110000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Product Manager', requirements: ['5+ years PM experience', 'Agile methodology', 'Technical background'], skills: ['Product Strategy', 'Agile', 'Analytics'], salaryMin: 130000, salaryMax: 180000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Frontend Developer', requirements: ['3+ years React', 'TypeScript', 'CSS expertise'], skills: ['React', 'TypeScript', 'CSS', 'JavaScript'], salaryMin: 100000, salaryMax: 150000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Backend Developer', requirements: ['Node.js/Python', 'Database design', 'API development'], skills: ['Node.js', 'Python', 'PostgreSQL'], salaryMin: 100000, salaryMax: 160000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'DevOps Engineer', requirements: ['AWS/GCP', 'CI/CD', 'Kubernetes'], skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform'], salaryMin: 120000, salaryMax: 170000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Sales Representative', requirements: ['2+ years sales', 'CRM experience', 'B2B sales'], skills: ['Sales', 'CRM', 'Communication'], salaryMin: 60000, salaryMax: 100000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Content Writer', requirements: ['Writing portfolio', 'SEO knowledge', 'B2B experience'], skills: ['Writing', 'SEO', 'Content Strategy'], salaryMin: 55000, salaryMax: 85000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Customer Success Manager', requirements: ['Client management', 'Technical aptitude', 'Communication'], skills: ['Customer Service', 'Account Management', 'Communication'], salaryMin: 70000, salaryMax: 100000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'QA Engineer', requirements: ['Test automation', 'Selenium/Cypress', 'Agile'], skills: ['Testing', 'Selenium', 'JavaScript'], salaryMin: 80000, salaryMax: 120000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'HR Coordinator', requirements: ['HR experience', 'Recruiting', 'HRIS systems'], skills: ['HR', 'Recruiting', 'Communication'], salaryMin: 50000, salaryMax: 70000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Graphic Designer', requirements: ['Adobe Creative Suite', 'Brand design', 'Portfolio'], skills: ['Photoshop', 'Illustrator', 'InDesign'], salaryMin: 60000, salaryMax: 90000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Project Coordinator', requirements: ['Project management', 'Organization', 'Communication'], skills: ['Project Management', 'Organization', 'Communication'], salaryMin: 55000, salaryMax: 75000, type: 'FULL_TIME' as const, status: 'OPEN' as const },
    { title: 'Contract Developer', requirements: ['Full-stack experience', '6-month contract', 'Remote'], skills: ['React', 'Node.js', 'PostgreSQL'], salaryMin: 100, salaryMax: 150, type: 'CONTRACT' as const, status: 'OPEN' as const },
  ];
  const jobs = [];
  for (const jobData of jobPositions) {
    const job = await prisma.jobPosition.create({ data: jobData });
    jobs.push(job);
  }
  console.log(`Created ${jobs.length} job positions`);

  // ==================== CANDIDATES (25+) ====================
  console.log('Creating candidates...');
  const candidatesData = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@email.com', phone: '+1 555-1001', currentTitle: 'Software Engineer', currentCompany: 'Google', experience: 5, expectedSalary: 150000, location: 'San Francisco, CA', skills: ['JavaScript', 'React', 'Node.js', 'AWS'], status: 'SCREENING' as const, score: 85, source: 'LinkedIn' },
    { firstName: 'Emily', lastName: 'Johnson', email: 'emily.j@email.com', phone: '+1 555-1002', currentTitle: 'Product Manager', currentCompany: 'Meta', experience: 7, expectedSalary: 170000, location: 'New York, NY', skills: ['Product Strategy', 'Agile', 'Analytics'], status: 'INTERVIEWING' as const, score: 92, source: 'Referral' },
    { firstName: 'Michael', lastName: 'Williams', email: 'm.williams@email.com', phone: '+1 555-1003', currentTitle: 'UX Designer', currentCompany: 'Apple', experience: 4, expectedSalary: 130000, location: 'Seattle, WA', skills: ['Figma', 'UI/UX', 'Prototyping'], status: 'NEW' as const, score: 78, source: 'Indeed' },
    { firstName: 'Sarah', lastName: 'Brown', email: 'sarah.b@email.com', phone: '+1 555-1004', currentTitle: 'Data Analyst', currentCompany: 'Amazon', experience: 3, expectedSalary: 95000, location: 'Austin, TX', skills: ['SQL', 'Python', 'Tableau'], status: 'OFFERED' as const, score: 88, source: 'LinkedIn' },
    { firstName: 'David', lastName: 'Jones', email: 'd.jones@email.com', phone: '+1 555-1005', currentTitle: 'Marketing Manager', currentCompany: 'HubSpot', experience: 6, expectedSalary: 110000, location: 'Boston, MA', skills: ['Marketing', 'SEO', 'Analytics'], status: 'PLACED' as const, score: 90, source: 'Referral' },
    { firstName: 'Jessica', lastName: 'Garcia', email: 'j.garcia@email.com', phone: '+1 555-1006', currentTitle: 'Frontend Developer', currentCompany: 'Netflix', experience: 4, expectedSalary: 140000, location: 'Los Angeles, CA', skills: ['React', 'TypeScript', 'CSS'], status: 'INTERVIEWING' as const, score: 82, source: 'LinkedIn' },
    { firstName: 'Daniel', lastName: 'Martinez', email: 'd.martinez@email.com', phone: '+1 555-1007', currentTitle: 'DevOps Engineer', currentCompany: 'Microsoft', experience: 5, expectedSalary: 160000, location: 'Seattle, WA', skills: ['AWS', 'Docker', 'Kubernetes'], status: 'SCREENING' as const, score: 86, source: 'Indeed' },
    { firstName: 'Ashley', lastName: 'Anderson', email: 'a.anderson@email.com', phone: '+1 555-1008', currentTitle: 'Content Writer', currentCompany: 'Shopify', experience: 3, expectedSalary: 75000, location: 'Remote', skills: ['Writing', 'SEO', 'Content Strategy'], status: 'NEW' as const, score: 74, source: 'Website' },
    { firstName: 'Christopher', lastName: 'Taylor', email: 'c.taylor@email.com', phone: '+1 555-1009', currentTitle: 'Sales Executive', currentCompany: 'Salesforce', experience: 4, expectedSalary: 90000, location: 'Chicago, IL', skills: ['Sales', 'CRM', 'B2B'], status: 'INTERVIEWING' as const, score: 80, source: 'Referral' },
    { firstName: 'Amanda', lastName: 'Thomas', email: 'a.thomas@email.com', phone: '+1 555-1010', currentTitle: 'HR Specialist', currentCompany: 'Workday', experience: 5, expectedSalary: 85000, location: 'Denver, CO', skills: ['HR', 'Recruiting', 'HRIS'], status: 'OFFERED' as const, score: 87, source: 'LinkedIn' },
    { firstName: 'Matthew', lastName: 'Hernandez', email: 'm.hernandez@email.com', phone: '+1 555-1011', currentTitle: 'Backend Developer', currentCompany: 'Stripe', experience: 6, expectedSalary: 170000, location: 'San Francisco, CA', skills: ['Python', 'PostgreSQL', 'AWS'], status: 'SCREENING' as const, score: 91, source: 'LinkedIn' },
    { firstName: 'Stephanie', lastName: 'Moore', email: 's.moore@email.com', phone: '+1 555-1012', currentTitle: 'Project Manager', currentCompany: 'Asana', experience: 7, expectedSalary: 125000, location: 'Remote', skills: ['Project Management', 'Agile', 'Leadership'], status: 'INTERVIEWING' as const, score: 89, source: 'Referral' },
    { firstName: 'Andrew', lastName: 'Jackson', email: 'a.jackson@email.com', phone: '+1 555-1013', currentTitle: 'QA Engineer', currentCompany: 'Uber', experience: 4, expectedSalary: 110000, location: 'San Francisco, CA', skills: ['Testing', 'Selenium', 'Cypress'], status: 'NEW' as const, score: 76, source: 'Indeed' },
    { firstName: 'Nicole', lastName: 'White', email: 'n.white@email.com', phone: '+1 555-1014', currentTitle: 'Graphic Designer', currentCompany: 'Adobe', experience: 5, expectedSalary: 85000, location: 'San Jose, CA', skills: ['Photoshop', 'Illustrator', 'Figma'], status: 'SCREENING' as const, score: 83, source: 'LinkedIn' },
    { firstName: 'Joshua', lastName: 'Harris', email: 'j.harris@email.com', phone: '+1 555-1015', currentTitle: 'Customer Success', currentCompany: 'Zendesk', experience: 3, expectedSalary: 80000, location: 'Austin, TX', skills: ['Customer Service', 'Account Management'], status: 'INTERVIEWING' as const, score: 79, source: 'Website' },
    { firstName: 'Rachel', lastName: 'Clark', email: 'r.clark@email.com', phone: '+1 555-1016', currentTitle: 'Full Stack Developer', currentCompany: 'Airbnb', experience: 5, expectedSalary: 155000, location: 'San Francisco, CA', skills: ['React', 'Node.js', 'PostgreSQL', 'AWS'], status: 'OFFERED' as const, score: 93, source: 'Referral' },
    { firstName: 'Kevin', lastName: 'Lewis', email: 'k.lewis@email.com', phone: '+1 555-1017', currentTitle: 'Data Scientist', currentCompany: 'LinkedIn', experience: 4, expectedSalary: 145000, location: 'Sunnyvale, CA', skills: ['Python', 'Machine Learning', 'SQL'], status: 'SCREENING' as const, score: 88, source: 'LinkedIn' },
    { firstName: 'Megan', lastName: 'Robinson', email: 'm.robinson@email.com', phone: '+1 555-1018', currentTitle: 'Account Executive', currentCompany: 'Oracle', experience: 6, expectedSalary: 100000, location: 'Austin, TX', skills: ['Sales', 'Enterprise Sales', 'CRM'], status: 'NEW' as const, score: 77, source: 'Indeed' },
    { firstName: 'Brandon', lastName: 'Walker', email: 'b.walker@email.com', phone: '+1 555-1019', currentTitle: 'Security Engineer', currentCompany: 'CrowdStrike', experience: 5, expectedSalary: 165000, location: 'Remote', skills: ['Security', 'AWS', 'Python'], status: 'INTERVIEWING' as const, score: 85, source: 'LinkedIn' },
    { firstName: 'Lauren', lastName: 'Hall', email: 'l.hall@email.com', phone: '+1 555-1020', currentTitle: 'Business Analyst', currentCompany: 'Deloitte', experience: 4, expectedSalary: 95000, location: 'New York, NY', skills: ['Business Analysis', 'SQL', 'Excel'], status: 'SCREENING' as const, score: 81, source: 'Referral' },
    { firstName: 'Ryan', lastName: 'Allen', email: 'r.allen@email.com', phone: '+1 555-1021', currentTitle: 'Mobile Developer', currentCompany: 'Spotify', experience: 5, expectedSalary: 150000, location: 'New York, NY', skills: ['React Native', 'iOS', 'Android'], status: 'REJECTED' as const, score: 72, source: 'LinkedIn' },
    { firstName: 'Samantha', lastName: 'Young', email: 's.young@email.com', phone: '+1 555-1022', currentTitle: 'Operations Manager', currentCompany: 'DoorDash', experience: 6, expectedSalary: 105000, location: 'San Francisco, CA', skills: ['Operations', 'Logistics', 'Leadership'], status: 'NEW' as const, score: 78, source: 'Indeed' },
    { firstName: 'Tyler', lastName: 'King', email: 't.king@email.com', phone: '+1 555-1023', currentTitle: 'Cloud Architect', currentCompany: 'IBM', experience: 8, expectedSalary: 180000, location: 'Austin, TX', skills: ['AWS', 'Azure', 'Terraform'], status: 'INTERVIEWING' as const, score: 94, source: 'Referral' },
    { firstName: 'Kayla', lastName: 'Wright', email: 'k.wright@email.com', phone: '+1 555-1024', currentTitle: 'Social Media Manager', currentCompany: 'Buffer', experience: 3, expectedSalary: 70000, location: 'Remote', skills: ['Social Media', 'Content', 'Analytics'], status: 'SCREENING' as const, score: 75, source: 'LinkedIn' },
    { firstName: 'Justin', lastName: 'Scott', email: 'j.scott@email.com', phone: '+1 555-1025', currentTitle: 'Technical Writer', currentCompany: 'Twilio', experience: 4, expectedSalary: 80000, location: 'Denver, CO', skills: ['Technical Writing', 'Documentation', 'API'], status: 'WITHDRAWN' as const, score: 73, source: 'Website' },
  ];

  const candidates = [];
  for (const candData of candidatesData) {
    const candidate = await prisma.candidate.create({
      data: { ...candData, createdById: admin.id }
    });
    candidates.push(candidate);
  }
  console.log(`Created ${candidates.length} candidates`);

  // ==================== INTERVIEWS (25+) ====================
  console.log('Creating interviews...');
  const interviewsData = [];
  for (let i = 0; i < 30; i++) {
    interviewsData.push({
      candidateId: candidates[i % candidates.length].id,
      scheduledAt: new Date(2024, 11, (i % 28) + 1, 10 + (i % 8), 0),
      duration: [30, 45, 60, 90][i % 4],
      type: ['PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL'][i % 4] as 'PHONE' | 'VIDEO' | 'ONSITE' | 'TECHNICAL',
      location: ['Zoom', 'Google Meet', 'Office', 'HackerRank'][i % 4],
      status: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'][i % 4] as 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
      feedback: i % 4 === 1 ? 'Strong candidate with excellent technical skills' : null,
      rating: i % 4 === 1 ? [3, 4, 5][i % 3] : null,
    });
  }
  await prisma.interview.createMany({ data: interviewsData });
  console.log(`Created ${interviewsData.length} interviews`);

  // ==================== LEADS (25+) ====================
  console.log('Creating leads...');
  const leadsData = [
    { firstName: 'Robert', lastName: 'Miller', email: 'r.miller@company.com', phone: '+1 555-2001', company: 'Miller Industries', title: 'CEO', source: 'WEBSITE' as const, status: 'NEW' as const, score: 85 },
    { firstName: 'Patricia', lastName: 'Davis', email: 'p.davis@corp.com', phone: '+1 555-2002', company: 'Davis Corp', title: 'Marketing Director', source: 'REFERRAL' as const, status: 'CONTACTED' as const, score: 90 },
    { firstName: 'William', lastName: 'Wilson', email: 'w.wilson@tech.io', phone: '+1 555-2003', company: 'Wilson Tech', title: 'CTO', source: 'COLD_CALL' as const, status: 'QUALIFIED' as const, score: 78 },
    { firstName: 'Jennifer', lastName: 'Moore', email: 'j.moore@enterprise.com', phone: '+1 555-2004', company: 'Enterprise Solutions', title: 'VP Sales', source: 'EMAIL_CAMPAIGN' as const, status: 'NEW' as const, score: 82 },
    { firstName: 'Charles', lastName: 'Taylor', email: 'c.taylor@startup.io', phone: '+1 555-2005', company: 'Taylor Startup', title: 'Founder', source: 'SOCIAL_MEDIA' as const, status: 'CONTACTED' as const, score: 88 },
    { firstName: 'Elizabeth', lastName: 'Anderson', email: 'e.anderson@global.com', phone: '+1 555-2006', company: 'Global Inc', title: 'Operations Manager', source: 'AD_CAMPAIGN' as const, status: 'QUALIFIED' as const, score: 75 },
    { firstName: 'Joseph', lastName: 'Thomas', email: 'j.thomas@mega.com', phone: '+1 555-2007', company: 'MegaCorp', title: 'IT Director', source: 'EVENT' as const, status: 'NEW' as const, score: 80 },
    { firstName: 'Margaret', lastName: 'Jackson', email: 'm.jackson@solutions.com', phone: '+1 555-2008', company: 'Solutions Plus', title: 'HR Director', source: 'WEBSITE' as const, status: 'CONVERTED' as const, score: 95 },
    { firstName: 'Thomas', lastName: 'White', email: 't.white@innovations.com', phone: '+1 555-2009', company: 'Innovations Ltd', title: 'Product Manager', source: 'REFERRAL' as const, status: 'CONTACTED' as const, score: 72 },
    { firstName: 'Dorothy', lastName: 'Harris', email: 'd.harris@ventures.com', phone: '+1 555-2010', company: 'Harris Ventures', title: 'CFO', source: 'COLD_CALL' as const, status: 'NEW' as const, score: 68 },
    { firstName: 'Christopher', lastName: 'Martin', email: 'c.martin@digital.io', phone: '+1 555-2011', company: 'Digital First', title: 'CEO', source: 'EMAIL_CAMPAIGN' as const, status: 'QUALIFIED' as const, score: 92 },
    { firstName: 'Sandra', lastName: 'Thompson', email: 's.thompson@retail.com', phone: '+1 555-2012', company: 'Thompson Retail', title: 'E-commerce Director', source: 'SOCIAL_MEDIA' as const, status: 'CONTACTED' as const, score: 84 },
    { firstName: 'Daniel', lastName: 'Garcia', email: 'd.garcia@media.com', phone: '+1 555-2013', company: 'Garcia Media', title: 'Creative Director', source: 'AD_CAMPAIGN' as const, status: 'NEW' as const, score: 77 },
    { firstName: 'Nancy', lastName: 'Martinez', email: 'n.martinez@health.org', phone: '+1 555-2014', company: 'HealthFirst', title: 'Marketing Manager', source: 'EVENT' as const, status: 'LOST' as const, score: 45 },
    { firstName: 'Paul', lastName: 'Robinson', email: 'p.robinson@finance.com', phone: '+1 555-2015', company: 'Robinson Finance', title: 'Managing Partner', source: 'WEBSITE' as const, status: 'QUALIFIED' as const, score: 89 },
    { firstName: 'Karen', lastName: 'Clark', email: 'k.clark@edu.org', phone: '+1 555-2016', company: 'Clark Academy', title: 'Dean', source: 'REFERRAL' as const, status: 'CONTACTED' as const, score: 71 },
    { firstName: 'Mark', lastName: 'Rodriguez', email: 'm.rodriguez@logistics.com', phone: '+1 555-2017', company: 'Rodriguez Logistics', title: 'Operations VP', source: 'COLD_CALL' as const, status: 'NEW' as const, score: 83 },
    { firstName: 'Betty', lastName: 'Lewis', email: 'b.lewis@consulting.com', phone: '+1 555-2018', company: 'Lewis Consulting', title: 'Principal', source: 'EMAIL_CAMPAIGN' as const, status: 'CONVERTED' as const, score: 96 },
    { firstName: 'Steven', lastName: 'Lee', email: 's.lee@software.io', phone: '+1 555-2019', company: 'Lee Software', title: 'Engineering Lead', source: 'SOCIAL_MEDIA' as const, status: 'CONTACTED' as const, score: 79 },
    { firstName: 'Helen', lastName: 'Walker', email: 'h.walker@design.com', phone: '+1 555-2020', company: 'Walker Design', title: 'Creative Lead', source: 'AD_CAMPAIGN' as const, status: 'UNQUALIFIED' as const, score: 35 },
    { firstName: 'Edward', lastName: 'Hall', email: 'e.hall@manufacturing.com', phone: '+1 555-2021', company: 'Hall Manufacturing', title: 'Plant Manager', source: 'EVENT' as const, status: 'NEW' as const, score: 74 },
    { firstName: 'Deborah', lastName: 'Allen', email: 'd.allen@services.com', phone: '+1 555-2022', company: 'Allen Services', title: 'COO', source: 'WEBSITE' as const, status: 'QUALIFIED' as const, score: 87 },
    { firstName: 'Brian', lastName: 'Young', email: 'b.young@tech.com', phone: '+1 555-2023', company: 'Young Technologies', title: 'VP Engineering', source: 'REFERRAL' as const, status: 'CONTACTED' as const, score: 81 },
    { firstName: 'Sharon', lastName: 'King', email: 's.king@retail.io', phone: '+1 555-2024', company: 'King Retail', title: 'Merchandising Director', source: 'COLD_CALL' as const, status: 'NEW' as const, score: 76 },
    { firstName: 'Ronald', lastName: 'Wright', email: 'r.wright@energy.com', phone: '+1 555-2025', company: 'Wright Energy', title: 'Business Development', source: 'EMAIL_CAMPAIGN' as const, status: 'CONTACTED' as const, score: 86 },
  ];

  const leads = [];
  for (let i = 0; i < leadsData.length; i++) {
    const lead = await prisma.lead.create({
      data: { ...leadsData[i], assignedToId: members[i % members.length].id }
    });
    leads.push(lead);
  }
  console.log(`Created ${leads.length} leads`);

  // ==================== FOLLOW UPS (40+) ====================
  console.log('Creating follow-ups...');
  const followUpsData = [];
  for (let i = 0; i < 50; i++) {
    followUpsData.push({
      leadId: leads[i % leads.length].id,
      type: ['CALL', 'EMAIL', 'MEETING', 'DEMO'][i % 4] as 'CALL' | 'EMAIL' | 'MEETING' | 'DEMO',
      scheduledAt: new Date(2024, 11, (i % 28) + 1, 10 + (i % 8), 0),
      completedAt: i % 3 === 0 ? new Date(2024, 11, (i % 28) + 1, 11 + (i % 8), 0) : null,
      notes: `Follow-up notes for lead ${i + 1}`,
      outcome: i % 3 === 0 ? ['Positive response', 'Needs more info', 'Scheduled demo', 'Not interested'][i % 4] : null,
    });
  }
  await prisma.followUp.createMany({ data: followUpsData });
  console.log(`Created ${followUpsData.length} follow-ups`);

  // ==================== INVOICES (20+) ====================
  console.log('Creating invoices...');
  const invoices = [];
  for (let i = 0; i < 25; i++) {
    const subtotal = [2500, 5000, 7500, 10000, 15000, 25000, 50000][i % 7];
    const tax = subtotal * 0.08;
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${String(i + 1).padStart(5, '0')}`,
        clientId: clients[i % clients.length].id,
        createdById: admin.id,
        type: ['RETAINER', 'PROJECT', 'TIME_BASED', 'COMMISSION'][i % 4] as 'RETAINER' | 'PROJECT' | 'TIME_BASED' | 'COMMISSION',
        status: ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'][i % 5] as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED',
        subtotal,
        tax,
        total: subtotal + tax,
        dueDate: new Date(2024, 11, (i % 28) + 1),
        paidAt: i % 5 === 2 ? new Date() : null,
        notes: `Invoice for services rendered - Invoice ${i + 1}`,
      }
    });
    invoices.push(invoice);
  }
  console.log(`Created ${invoices.length} invoices`);

  // ==================== INVOICE ITEMS (60+) ====================
  console.log('Creating invoice items...');
  const invoiceItemsData = [];
  const itemDescriptions = ['Consulting Services', 'Development Work', 'Design Services', 'Marketing Services', 'SEO Optimization', 'Content Creation', 'Project Management', 'Technical Support'];
  for (let i = 0; i < 75; i++) {
    invoiceItemsData.push({
      invoiceId: invoices[i % invoices.length].id,
      description: itemDescriptions[i % itemDescriptions.length],
      quantity: [1, 2, 5, 10, 20][i % 5],
      unitPrice: [100, 150, 200, 250, 500][i % 5],
      amount: [100, 300, 1000, 2500, 10000][i % 5],
    });
  }
  await prisma.invoiceItem.createMany({ data: invoiceItemsData });
  console.log(`Created ${invoiceItemsData.length} invoice items`);

  // ==================== PAYMENTS (15+) ====================
  console.log('Creating payments...');
  const paymentsData = [];
  const paidInvoices = invoices.filter((_, i) => i % 5 === 2);
  for (let i = 0; i < Math.max(20, paidInvoices.length); i++) {
    paymentsData.push({
      invoiceId: paidInvoices[i % paidInvoices.length].id,
      amount: [1000, 2500, 5000, 7500, 10000][i % 5],
      method: ['CREDIT_CARD', 'BANK_TRANSFER', 'CHECK', 'PAYPAL'][i % 4] as 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CHECK' | 'PAYPAL',
      reference: `PAY-${String(i + 1).padStart(6, '0')}`,
    });
  }
  await prisma.payment.createMany({ data: paymentsData });
  console.log(`Created ${paymentsData.length} payments`);

  // ==================== RETAINERS (10+) ====================
  console.log('Creating retainers...');
  const retainersData = [];
  for (let i = 0; i < 12; i++) {
    retainersData.push({
      clientId: clients[i % clients.length].id,
      amount: [5000, 10000, 15000, 20000, 25000][i % 5],
      frequency: ['WEEKLY', 'MONTHLY', 'QUARTERLY'][i % 3] as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY',
      startDate: new Date(2024, i % 12, 1),
      endDate: i % 4 === 0 ? null : new Date(2025, (i + 6) % 12, 1),
      status: ['ACTIVE', 'PAUSED', 'CANCELLED'][i % 3] as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
    });
  }
  await prisma.retainer.createMany({ data: retainersData });
  console.log(`Created ${retainersData.length} retainers`);

  // ==================== COMMISSIONS (15+) ====================
  console.log('Creating commissions...');
  const commissionsData = [];
  for (let i = 0; i < 18; i++) {
    commissionsData.push({
      type: ['PLACEMENT', 'SALE', 'REFERRAL', 'BONUS'][i % 4],
      referenceId: i < candidates.length ? candidates[i].id : invoices[i % invoices.length].id,
      amount: [1000, 2500, 5000, 7500, 10000, 15000][i % 6],
      percentage: [5, 10, 15, 20, 25][i % 5],
      status: ['PENDING', 'APPROVED', 'PAID'][i % 3] as 'PENDING' | 'APPROVED' | 'PAID',
      paidAt: i % 3 === 2 ? new Date() : null,
    });
  }
  await prisma.commission.createMany({ data: commissionsData });
  console.log(`Created ${commissionsData.length} commissions`);

  // ==================== COMMUNICATIONS (30+) ====================
  console.log('Creating communications...');
  const communicationsData = [];
  for (let i = 0; i < 40; i++) {
    communicationsData.push({
      clientId: clients[i % clients.length].id,
      userId: members[i % members.length].id,
      type: ['EMAIL', 'PHONE', 'MEETING', 'NOTE'][i % 4] as 'EMAIL' | 'PHONE' | 'MEETING' | 'NOTE',
      subject: ['Project Update', 'Invoice Discussion', 'Strategy Meeting', 'Follow-up Call', 'Contract Review'][i % 5],
      content: `Communication content for ${clients[i % clients.length].name} - Entry ${i + 1}`,
    });
  }
  await prisma.communication.createMany({ data: communicationsData });
  console.log(`Created ${communicationsData.length} communications`);

  // ==================== ACTIVITIES (50+) ====================
  console.log('Creating activity logs...');
  const activitiesData = [];
  const actions = ['created a new client', 'updated project', 'added task', 'logged time', 'sent invoice', 'scheduled interview', 'qualified lead', 'completed milestone', 'added candidate', 'launched campaign'];
  for (let i = 0; i < 60; i++) {
    activitiesData.push({
      userId: users[i % users.length].id,
      action: actions[i % actions.length],
      entityType: ['Client', 'Project', 'Task', 'Invoice', 'Lead', 'Candidate', 'Campaign'][i % 7],
      entityId: `entity-${i + 1}`,
    });
  }
  await prisma.activity.createMany({ data: activitiesData });
  console.log(`Created ${activitiesData.length} activities`);

  console.log('');
  console.log('==========================================');
  console.log('  Database seeding completed successfully!');
  console.log('==========================================');
  console.log('');
  console.log('Summary:');
  console.log(`  - ${users.length} users`);
  console.log(`  - ${clients.length} clients`);
  console.log(`  - ${contractsData.length} contracts`);
  console.log(`  - ${projects.length} projects`);
  console.log(`  - ${tasksData.length} tasks`);
  console.log(`  - ${milestonesData.length} milestones`);
  console.log(`  - ${timeEntriesData.length} time entries`);
  console.log(`  - ${campaigns.length} campaigns`);
  console.log(`  - ${metricsData.length} campaign metrics`);
  console.log(`  - ${abTestsData.length} A/B tests`);
  console.log(`  - ${jobs.length} job positions`);
  console.log(`  - ${candidates.length} candidates`);
  console.log(`  - ${interviewsData.length} interviews`);
  console.log(`  - ${leads.length} leads`);
  console.log(`  - ${followUpsData.length} follow-ups`);
  console.log(`  - ${invoices.length} invoices`);
  console.log(`  - ${invoiceItemsData.length} invoice items`);
  console.log(`  - ${paymentsData.length} payments`);
  console.log(`  - ${retainersData.length} retainers`);
  console.log(`  - ${commissionsData.length} commissions`);
  console.log(`  - ${communicationsData.length} communications`);
  console.log(`  - ${activitiesData.length} activities`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
