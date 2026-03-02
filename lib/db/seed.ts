// @ts-nocheck
// sonarlint-disable
import connectDB from './mongodb'
import User from './models/User'
import Company from './models/Company'
import Requirement from './models/Requirement'
import Candidate from './models/Candidate'
import Activity from './models/Activity'
import Lead from './models/Lead'
import Template from './models/Template'
import { hash } from 'bcryptjs'
import { subDays, subHours } from 'date-fns'

interface UserData {
  email: string
  password: string
  name: string
  role: 'ADMIN' | 'COORDINATOR' | 'RECRUITER' | 'SCRAPER'
  assignedGroup?: string
}

const defaultUsers: UserData[] = [
  { email: 'admin@magnuscopo.com', password: 'Admin123!', name: 'System Administrator', role: 'ADMIN' },
  { email: 'rashmi@magnuscopo.com', password: 'Coordinator123!', name: 'Rashmi Sharma', role: 'COORDINATOR', assignedGroup: 'RASHMI' },
  { email: 'manjunath@magnuscopo.com', password: 'Coordinator123!', name: 'Manjunath Kumar', role: 'COORDINATOR', assignedGroup: 'MANJUNATH' },
  { email: 'priya@magnuscopo.com', password: 'Recruiter123!', name: 'Priya Patel', role: 'RECRUITER' },
  { email: 'rahul@magnuscopo.com', password: 'Recruiter123!', name: 'Rahul Singh', role: 'RECRUITER' },
  { email: 'scraper@magnuscopo.com', password: 'Scraper123!', name: 'Data Scraper', role: 'SCRAPER' },
]


const sampleCompanies = [
  { name: 'TechVision Solutions', category: 'Software Development', sector: 'IT', location: 'Bangalore, India', hiringType: 'PERMANENT', source: 'REFERRAL', website: 'https://techvision.com', mouStatus: 'SIGNED', mouStartDate: subDays(new Date(), 90), mouEndDate: subDays(new Date(), -180), commercialPercent: 12 },
  { name: 'FinanceFirst Corp', category: 'Banking & Finance', sector: 'NON_IT', location: 'Mumbai, India', hiringType: 'PERMANENT', source: 'EVENT', website: 'https://financefirst.com', mouStatus: 'SIGNED', mouStartDate: subDays(new Date(), 30), mouEndDate: subDays(new Date(), -60), commercialPercent: 10 },
  { name: 'HealthPlus Systems', category: 'Healthcare Technology', sector: 'IT', location: 'Hyderabad, India', hiringType: 'CONTRACT', source: 'SCRAPING', website: 'https://healthplus.io', mouStatus: 'IN_PROGRESS', mouStartDate: null, mouEndDate: null, commercialPercent: 0 },
  { name: 'GreenEnergy Dynamics', category: 'Renewable Energy', sector: 'CORE', location: 'Chennai, India', hiringType: 'PERMANENT', source: 'REFERRAL', website: 'https://greenenergy.com', mouStatus: 'SIGNED', mouStartDate: subDays(new Date(), 120), mouEndDate: subDays(new Date(), 30), commercialPercent: 15 },
  { name: 'StartupX Innovations', category: 'Product Development', sector: 'STARTUP', location: 'Pune, India', hiringType: 'INTERNSHIP', source: 'SCRAPING', website: 'https://startupx.io', mouStatus: 'SIGNED', mouStartDate: subDays(new Date(), 10), mouEndDate: subDays(new Date(), 350), commercialPercent: 8 },
  { name: 'LogiFlow Freight', category: 'Logistics', sector: 'CORE', location: 'Delhi, India', hiringType: 'PERMANENT', source: 'REFERRAL', website: 'https://logiflow.com', mouStatus: 'SIGNED', mouStartDate: subDays(new Date(), 15), mouEndDate: subDays(new Date(), 200), commercialPercent: 14 },
  { name: 'CyberGuard Security', category: 'Cybersecurity', sector: 'IT', location: 'Bangalore, India', hiringType: 'CONTRACT', source: 'REFERRAL', website: 'https://cyberguard.io', mouStatus: 'SIGNED', mouStartDate: subDays(new Date(), 45), mouEndDate: subDays(new Date(), 150), commercialPercent: 18 },
  { name: 'AgriNova Foods', category: 'AgriTech', sector: 'NON_IT', location: 'Indore, India', hiringType: 'PERMANENT', source: 'SCRAPING', website: 'https://agrinovafoods.com', mouStatus: 'SIGNED', mouStartDate: subDays(new Date(), 400), mouEndDate: subDays(new Date(), 10), commercialPercent: 9 },
  { name: 'Quantum AI Labs', category: 'Deep Tech', sector: 'IT', location: 'Bangalore, India', hiringType: 'PERMANENT', source: 'EVENT', website: 'https://quantumailabs.com', mouStatus: 'SIGNED', mouStartDate: subDays(new Date(), 5), mouEndDate: subDays(new Date(), 720), commercialPercent: 20 },
  { name: 'UrbanBuild Constructions', category: 'Construction', sector: 'CORE', location: 'Hyderabad, India', hiringType: 'CONTRACT', source: 'REFERRAL', website: 'https://urbanbuild.com', mouStatus: 'IN_PROGRESS', mouStartDate: null, mouEndDate: null, commercialPercent: 0 },
]



const sampleRequirements = [
  {
    jobTitle: 'Senior Full Stack Developer',
    status: 'ACTIVE',
    positions: 3,
    skills: ['React', 'Node.js', 'MongoDB'],
    fullDescription: 'We are looking for an experienced Full Stack Developer to lead our web development team. You will be responsible for architecting and building scalable web applications.',
    workMode: 'HYBRID',
    experienceMin: 5,
    experienceMax: 8,
    location: 'Bangalore, India',
    salaryMin: 2500000,
    salaryMax: 3500000
  },
  {
    jobTitle: 'DevOps Engineer',
    status: 'SOURCING',
    positions: 2,
    skills: ['AWS', 'Kubernetes', 'Docker'],
    fullDescription: 'Join our infrastructure team to build and maintain robust CI/CD pipelines and cloud infrastructure.',
    workMode: 'REMOTE',
    experienceMin: 4,
    experienceMax: 7,
    location: 'Pune, India',
    salaryMin: 1800000,
    salaryMax: 2800000
  },
  {
    jobTitle: 'Data Scientist',
    status: 'INTERVIEWING',
    positions: 1,
    skills: ['Python', 'Machine Learning', 'TensorFlow'],
    fullDescription: 'We need a Data Scientist to analyze large datasets and build predictive models to drive business decisions.',
    workMode: 'ONSITE',
    experienceMin: 3,
    experienceMax: 6,
    location: 'Hyderabad, India',
    salaryMin: 2000000,
    salaryMax: 3000000
  },
  {
    jobTitle: 'Product Manager',
    status: 'AWAITING_JD',
    positions: 1,
    skills: ['Agile', 'Scrum', 'Product Strategy'],
    fullDescription: 'Looking for a Product Manager to define product vision and roadmap, working closely with engineering and design teams.',
    workMode: 'HYBRID',
    experienceMin: 6,
    experienceMax: 10,
    location: 'Mumbai, India',
    salaryMin: 3000000,
    salaryMax: 4500000
  },
  {
    jobTitle: 'UI/UX Designer',
    status: 'ACTIVE',
    positions: 2,
    skills: ['Figma', 'Adobe XD', 'User Research'],
    fullDescription: 'Seeking a creative UI/UX Designer to design intuitive and visually appealing user interfaces for our digital products.',
    workMode: 'REMOTE',
    experienceMin: 2,
    experienceMax: 5,
    location: 'Bangalore, India',
    salaryMin: 1200000,
    salaryMax: 2000000
  },
  {
    jobTitle: 'Cloud Architect',
    status: 'SOURCING',
    positions: 1,
    skills: ['Azure', 'AWS', 'GCP'],
    fullDescription: 'We are hiring a Cloud Architect to design and oversee the implementation of our cloud computing strategy.',
    workMode: 'HYBRID',
    experienceMin: 10,
    experienceMax: 15,
    location: 'Chennai, India',
    salaryMin: 4000000,
    salaryMax: 6000000
  },
  {
    jobTitle: 'Mobile Developer',
    status: 'INTERVIEWING',
    positions: 2,
    skills: ['React Native', 'Flutter', 'iOS'],
    fullDescription: 'Mobile Developer needed to build high-quality mobile applications for both iOS and Android platforms.',
    workMode: 'ONSITE',
    experienceMin: 3,
    experienceMax: 6,
    location: 'Gurgaon, India',
    salaryMin: 1500000,
    salaryMax: 2500000
  },
  {
    jobTitle: 'QA Lead',
    status: 'ACTIVE',
    positions: 1,
    skills: ['Selenium', 'Cypress', 'Test Automation'],
    fullDescription: 'Experienced QA Lead required to manage our testing processes and ensure the highest quality of software delivery.',
    workMode: 'REMOTE',
    experienceMin: 7,
    experienceMax: 12,
    location: 'Noida, India',
    salaryMin: 2200000,
    salaryMax: 3200000
  },
  {
    jobTitle: 'Backend Engineer',
    status: 'OFFER',
    positions: 2,
    skills: ['Java', 'Spring Boot', 'Microservices'],
    fullDescription: 'Backend Engineer wanted to develop server-side logic and ensure high performance and responsiveness to requests from the front-end.',
    workMode: 'HYBRID',
    experienceMin: 4,
    experienceMax: 8,
    location: 'Bangalore, India',
    salaryMin: 2000000,
    salaryMax: 3000000
  },
  {
    jobTitle: 'Frontend Developer',
    status: 'CLOSED_HIRED',
    positions: 2,
    skills: ['Angular', 'TypeScript', 'CSS'],
    fullDescription: 'We are looking for a Frontend Developer to implement visual elements that users see and interact with within a web application.',
    workMode: 'REMOTE',
    experienceMin: 3,
    experienceMax: 6,
    location: 'Kolkata, India',
    salaryMin: 1400000,
    salaryMax: 2200000
  },
  {
    jobTitle: 'HR Business Partner',
    status: 'ON_HOLD',
    positions: 1,
    skills: ['HRBP', 'Employee Relations', 'Compliance'],
    fullDescription: 'Responsible for partnering with business leaders on people strategies and compliance.',
    workMode: 'HYBRID',
    experienceMin: 7,
    experienceMax: 12,
    location: 'Delhi, India',
    salaryMin: 1800000,
    salaryMax: 2600000
  },
  {
    jobTitle: 'Inside Sales Specialist',
    status: 'ACTIVE',
    positions: 3,
    skills: ['SaaS Sales', 'Cold Calling', 'CRM'],
    fullDescription: 'Drive outbound prospecting, nurture pipelines, and close mid-market SaaS deals.',
    workMode: 'REMOTE',
    experienceMin: 2,
    experienceMax: 5,
    location: 'Remote',
    salaryMin: 900000,
    salaryMax: 1400000
  },
  {
    jobTitle: 'Business Analyst',
    status: 'SOURCING',
    positions: 2,
    skills: ['SQL', 'JIRA', 'User Stories'],
    fullDescription: 'Gather requirements, write user stories, and support delivery squads.',
    workMode: 'HYBRID',
    experienceMin: 3,
    experienceMax: 6,
    location: 'Pune, India',
    salaryMin: 1200000,
    salaryMax: 1800000
  },
  {
    jobTitle: 'Data Engineer',
    status: 'INTERVIEWING',
    positions: 2,
    skills: ['Spark', 'Airflow', 'Python'],
    fullDescription: 'Build data pipelines, optimize ETL, and own lakehouse reliability.',
    workMode: 'HYBRID',
    experienceMin: 4,
    experienceMax: 8,
    location: 'Bangalore, India',
    salaryMin: 2200000,
    salaryMax: 3200000
  },
  {
    jobTitle: 'Customer Success Manager',
    status: 'OFFER',
    positions: 1,
    skills: ['CSM', 'Renewals', 'Upsell'],
    fullDescription: 'Own enterprise accounts, drive adoption and renewals.',
    workMode: 'REMOTE',
    experienceMin: 5,
    experienceMax: 9,
    location: 'Remote',
    salaryMin: 1800000,
    salaryMax: 2800000
  },
  {
    jobTitle: 'Mechanical Design Engineer',
    status: 'ACTIVE',
    positions: 2,
    skills: ['CATIA', 'SolidWorks', 'DFM'],
    fullDescription: 'Design mechanical components for industrial products.',
    workMode: 'ONSITE',
    experienceMin: 4,
    experienceMax: 7,
    location: 'Chennai, India',
    salaryMin: 1400000,
    salaryMax: 2000000
  },
  {
    jobTitle: 'Finance Controller',
    status: 'CLOSED_NOT_HIRED',
    positions: 1,
    skills: ['FP&A', 'Controllership', 'IFRS'],
    fullDescription: 'Lead controllership, audits, and compliance for a mid-size enterprise.',
    workMode: 'HYBRID',
    experienceMin: 8,
    experienceMax: 12,
    location: 'Mumbai, India',
    salaryMin: 2800000,
    salaryMax: 3600000
  }
]


const sampleCandidates = [
  { name: 'Arun Kumar', email: 'arun.kumar@email.com', phone: '+91 9876543210', status: 'APPLIED', experience: 5 },
  { name: 'Sneha Reddy', email: 'sneha.reddy@email.com', phone: '+91 9876543211', status: 'SHORTLISTED', experience: 3 },
  { name: 'Vikram Mehta', email: 'vikram.mehta@email.com', phone: '+91 9876543212', status: 'INTERVIEWED', experience: 7 },
  { name: 'Priyanka Das', email: 'priyanka.das@email.com', phone: '+91 9876543213', status: 'OFFERED', experience: 4 },
  { name: 'Raj Patel', email: 'raj.patel@email.com', phone: '+91 9876543214', status: 'JOINED', experience: 6 },
  { name: 'Ananya Gupta', email: 'ananya.gupta@email.com', phone: '+91 9876543215', status: 'APPLIED', experience: 2 },
  { name: 'Karthik Nair', email: 'karthik.nair@email.com', phone: '+91 9876543216', status: 'SHORTLISTED', experience: 8 },
  { name: 'Meera Shah', email: 'meera.shah@email.com', phone: '+91 9876543217', status: 'INTERVIEWED', experience: 5 },
  { name: 'Sanjay Verma', email: 'sanjay.verma@email.com', phone: '+91 9876543218', status: 'REJECTED', experience: 4 },
  { name: 'Deepa Iyer', email: 'deepa.iyer@email.com', phone: '+91 9876543219', status: 'APPLIED', experience: 3 },
  { name: 'Amit Sharma', email: 'amit.sharma@email.com', phone: '+91 9876543220', status: 'SHORTLISTED', experience: 6 },
  { name: 'Kavita Rajan', email: 'kavita.rajan@email.com', phone: '+91 9876543221', status: 'INTERVIEWED', experience: 5 },
  { name: 'Rohit Mishra', email: 'rohit.mishra@email.com', phone: '+91 9876543222', status: 'OFFERED', experience: 7 },
  { name: 'Nisha Bose', email: 'nisha.bose@email.com', phone: '+91 9876543223', status: 'APPLIED', experience: 2 },
  { name: 'Suresh Kumar', email: 'suresh.kumar@email.com', phone: '+91 9876543224', status: 'SHORTLISTED', experience: 4 },
  { name: 'Lakshmi Menon', email: 'lakshmi.menon@email.com', phone: '+91 9876543225', status: 'INTERVIEWED', experience: 6 },
  { name: 'Arjun Reddy', email: 'arjun.reddy@email.com', phone: '+91 9876543226', status: 'JOINED', experience: 5 },
  { name: 'Pooja Jain', email: 'pooja.jain@email.com', phone: '+91 9876543227', status: 'APPLIED', experience: 3 },
  { name: 'Vivek Agarwal', email: 'vivek.agarwal@email.com', phone: '+91 9876543228', status: 'REJECTED', experience: 4 },
  { name: 'Swati Pillai', email: 'swati.pillai@email.com', phone: '+91 9876543229', status: 'SHORTLISTED', experience: 5 },
]

const sampleLeads = [
  { companyName: 'CloudTech Solutions', sourcePlatform: 'LinkedIn', sector: 'IT', confidenceScore: 85, status: 'NEW' },
  { companyName: 'DataDriven Inc', sourcePlatform: 'Naukri', sector: 'IT', confidenceScore: 72, status: 'CONTACTED' },
  { companyName: 'RetailMax', sourcePlatform: 'AngelList', sector: 'STARTUP', confidenceScore: 45, status: 'QUALIFIED' },
  { companyName: 'ManufacturePro', sourcePlatform: 'LinkedIn', sector: 'CORE', confidenceScore: 90, status: 'NEW' },
  { companyName: 'EduTech Academy', sourcePlatform: 'Naukri', sector: 'STARTUP', confidenceScore: 60, status: 'STALLED' },
]

const sampleTemplates = [
  {
    name: 'JD Request',
    category: 'JD_REQUEST',
    subject: 'Request for Job Description - {{jobTitle}}',
    body: 'Dear {{contactName}},\n\nI hope this email finds you well. We are excited to partner with {{companyName}} for the {{jobTitle}} position.\n\nCould you please share the detailed job description including:\n- Key responsibilities\n- Required qualifications\n- Experience requirements\n- Compensation range (if available)\n\nThis will help us identify the best candidates for your team.\n\nBest regards,\nMagnus Copo Team',
  },
  {
    name: 'Candidate Submission',
    category: 'CANDIDATE_SUBMISSION',
    subject: 'Candidate Profile: {{candidateName}} for {{jobTitle}} - {{mmdId}}',
    body: 'Dear {{contactName}},\n\nWe are pleased to submit {{candidateName}} for the {{jobTitle}} position ({{mmdId}}).\n\nCandidate Highlights:\n- Experience: {{experience}} years\n- Current Company: {{currentCompany}}\n- Notice Period: {{noticePeriod}}\n\nPlease find the attached resume for your review.\n\nLooking forward to your feedback.\n\nBest regards,\nMagnus Copo Team',
  },
  {
    name: 'Interview Scheduling',
    category: 'INTERVIEW_SCHEDULING',
    subject: 'Interview Confirmation: {{candidateName}} - {{interviewDate}}',
    body: 'Dear {{candidateName}},\n\nYour interview for the {{jobTitle}} position at {{companyName}} has been scheduled.\n\nDetails:\n- Date: {{interviewDate}}\n- Time: {{interviewTime}}\n- Location: {{location}}\n- Interview Round: {{interviewRound}}\n\nPlease confirm your availability.\n\nBest regards,\nMagnus Copo Team',
  },
  {
    name: 'Follow-up Reminder',
    category: 'FOLLOW_UP',
    subject: 'Following Up: {{jobTitle}} Position - {{mmdId}}',
    body: 'Dear {{contactName}},\n\nI wanted to follow up on the {{jobTitle}} position ({{mmdId}}) we discussed.\n\nCould you please provide an update on:\n- The status of submitted candidates\n- Any feedback from the interviews\n- Next steps in the hiring process\n\nWe are committed to supporting your hiring needs.\n\nBest regards,\nMagnus Copo Team',
  },
]

let mmdIdCounter = 1

function generateMmdId(): string {
  const id = `MMD-${String(mmdIdCounter++).padStart(6, '0')}`
  return id
}

function getActivityOutcome(index: number): 'POSITIVE' | 'PENDING' | 'NEUTRAL' {
  const remainder = index % 3
  if (remainder === 0) return 'POSITIVE'
  if (remainder === 1) return 'PENDING'
  return 'NEUTRAL'
}

// Seed Users
async function seedUsers(): Promise<Record<string, string>> {
  const createdUsers: Record<string, string> = {}

  for (const userData of defaultUsers) {
    const user = await User.findOne({ email: userData.email })
    if (user) {
      console.log(`⏭️  User already exists: ${userData.email}`)
      createdUsers[userData.email] = user._id.toString()
      continue
    }

    const hashedPassword = await hash(userData.password, 12)
    const newUser = await User.create({
      email: userData.email,
      password: hashedPassword,
      name: userData.name,
      role: userData.role,
      assignedGroup: userData.assignedGroup,
      isActive: true,
    })
    console.log(`✅ Created ${userData.role.toLowerCase()} user: ${userData.email}`)
    createdUsers[userData.email] = newUser._id.toString()
  }

  return createdUsers
}

// Seed Companies
async function seedCompanies(adminId: string, rashmiId: string): Promise<string[]> {
  const createdCompanies: string[] = []

  console.log('\n📦 Creating sample companies...')
  for (const companyData of sampleCompanies) {
    const existing = await Company.findOne({ name: companyData.name })
    if (existing) {
      createdCompanies.push(existing._id.toString())
      continue
    }
    const company = await Company.create({
      ...companyData,
      assignedCoordinatorId: rashmiId,
      createdBy: adminId,
    })
    createdCompanies.push(company._id.toString())
    console.log(`✅ Created company: ${companyData.name}`)
  }

  return createdCompanies
}

// Seed Requirements
async function seedRequirements(
  createdCompanies: string[],
  priyaId: string,
  rahulId: string,
  adminId: string
): Promise<{ id: string; mmdId: string }[]> {
  const createdRequirements: { id: string; mmdId: string }[] = []

  console.log('\n📋 Creating sample requirements...')
  const recruiters = [priyaId, rahulId]
  const groups = ['RASHMI', 'MANJUNATH']

  for (let i = 0; i < sampleRequirements.length; i++) {
    const reqData = sampleRequirements[i]
    const companyId = createdCompanies[i % createdCompanies.length]
    const mmdId = generateMmdId()

    const existing = await Requirement.findOne({ mmdId })
    if (existing) {
      createdRequirements.push({ id: existing._id.toString(), mmdId: existing.mmdId })
      continue
    }

    const requirement = await Requirement.create({
      ...reqData,
      mmdId,
      companyId,
      accountOwnerId: recruiters[i % 2],
      group: groups[i % 2],
      createdBy: adminId,
      createdAt: subDays(new Date(), Math.floor(Math.random() * 30)),
    })
    createdRequirements.push({ id: requirement._id.toString(), mmdId: requirement.mmdId })
    console.log(`✅ Created requirement: ${mmdId} - ${reqData.jobTitle}`)
  }

  // Additional synthetic requirements for UAT breadth
  const extraStatuses = ['ACTIVE', 'SOURCING', 'INTERVIEWING', 'OFFER', 'ON_HOLD', 'CLOSED_HIRED', 'CLOSED_NOT_HIRED']
  for (let i = 0; i < 20; i++) {
    const mmdId = generateMmdId()
    const status = extraStatuses[i % extraStatuses.length]
    const companyId = createdCompanies[(i + 3) % createdCompanies.length]
    const ownerId = recruiters[i % recruiters.length]
    const title = `Synthetic Role ${i + 1}`

    const existing = await Requirement.findOne({ mmdId })
    if (existing) {
      createdRequirements.push({ id: existing._id.toString(), mmdId: existing.mmdId })
      continue
    }

    const createdAt = subDays(new Date(), Math.floor(Math.random() * 60))

    const requirement = await Requirement.create({
      mmdId,
      jobTitle: title,
      status,
      positions: 1 + (i % 4),
      skills: ['Skill A', 'Skill B', `Domain ${i % 5}`],
      fullDescription: 'Synthetic requirement generated for UAT coverage across statuses and stalls.',
      workMode: ['REMOTE', 'HYBRID', 'ONSITE'][i % 3],
      experienceMin: 2 + (i % 3),
      experienceMax: 6 + (i % 4),
      location: ['Bangalore', 'Mumbai', 'Chennai', 'Remote'][i % 4] + ', India',
      salaryMin: 900000 + i * 50000,
      salaryMax: 1500000 + i * 80000,
      companyId,
      accountOwnerId: ownerId,
      group: groups[i % groups.length],
      createdBy: adminId,
      createdAt,
    })

    createdRequirements.push({ id: requirement._id.toString(), mmdId: requirement.mmdId })
  }

  return createdRequirements
}

// Seed Candidates
async function seedCandidates(createdRequirements: { id: string; mmdId: string }[]): Promise<void> {
  const existingCandidates = await Candidate.countDocuments()

  if (existingCandidates >= 20) {
    console.log('⏭️  Candidates already exist')
    return
  }

  console.log('\n👥 Creating sample candidates...')
  for (let i = 0; i < sampleCandidates.length; i++) {
    const candData = sampleCandidates[i]
    const reqIndex = i % createdRequirements.length
    const requirementId = createdRequirements[reqIndex].id

    const existing = await Candidate.findOne({ email: candData.email, requirementId })
    if (existing) continue

    await Candidate.create({
      ...candData,
      requirementId,
      source: 'PORTAL',
      appliedAt: subDays(new Date(), Math.floor(Math.random() * 20)),
    })
    console.log(`✅ Created candidate: ${candData.name}`)
  }
}

// Seed Activities
async function seedActivities(
  createdRequirements: { id: string; mmdId: string }[],
  priyaId: string,
  rahulId: string
): Promise<void> {
  console.log('\n📝 Creating sample activities...')
  const activityTypes = ['CALL', 'EMAIL', 'MEETING', 'FOLLOW_UP', 'WHATSAPP']

  let counter = 0
  for (const req of createdRequirements) {
    for (let i = 0; i < 4; i++) {
      const userId = (counter + i) % 2 === 0 ? priyaId : rahulId
      const createdAt = subHours(new Date(), (counter + i) * 6 + (i % 3 === 0 ? 72 : 0))

      await Activity.create({
        type: activityTypes[(counter + i) % activityTypes.length],
        summary: `Synthetic activity ${counter + i + 1} for ${req.mmdId}`,
        outcome: getActivityOutcome(counter + i),
        requirementId: req.id,
        userId,
        nextFollowUpDate: i % 2 === 0 ? subHours(new Date(), -24) : null,
        isCompleted: i % 3 === 0,
        createdAt,
      })
    }
    counter += 4
  }
  console.log('✅ Created synthetic activities across requirements')
}

// Seed Leads
async function seedLeads(scraperId: string): Promise<void> {
  const existingLeads = await Lead.countDocuments()

  if (existingLeads >= 5) {
    console.log('⏭️  Leads already exist')
    return
  }

  console.log('\n🔍 Creating sample leads...')
  for (const leadData of sampleLeads) {
    const existing = await Lead.findOne({ companyName: leadData.companyName })
    if (existing) continue

    await Lead.create({
      ...leadData,
      assignedTo: scraperId,
      contactName: 'HR Manager',
      contactEmail: `hr@${leadData.companyName.toLowerCase().replaceAll(/\s/g, '')}.com`,
    })
    console.log(`✅ Created lead: ${leadData.companyName}`)
  }
}

// Seed Templates
async function seedTemplates(adminId: string): Promise<void> {
  const existingTemplates = await Template.countDocuments()

  if (existingTemplates >= 4) {
    console.log('⏭️  Templates already exist')
    return
  }

  console.log('\n📧 Creating sample templates...')
  for (const templateData of sampleTemplates) {
    const existing = await Template.findOne({ name: templateData.name })
    if (existing) continue

    await Template.create({
      ...templateData,
      createdBy: adminId,
      isPublic: true,
      variables: Array.from(templateData.body.matchAll(/\{\{(\w+)\}\}/g)).map((m) => m[1]),
    })
    console.log(`✅ Created template: ${templateData.name}`)
  }
}

// Print summary
function printSummary(): void {
  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Default Users:')
  console.log('  Admin:        admin@magnuscopo.com / Admin123!')
  console.log('  Coordinator:  rashmi@magnuscopo.com / Coordinator123!')
  console.log('  Coordinator:  manjunath@magnuscopo.com / Coordinator123!')
  console.log('  Recruiter:    priya@magnuscopo.com / Recruiter123!')
  console.log('  Recruiter:    rahul@magnuscopo.com / Recruiter123!')
  console.log('  Scraper:      scraper@magnuscopo.com / Scraper123!')
  console.log('\n📊 Sample Data:')
  console.log('  - 5 Companies')
  console.log('  - 10 Requirements')
  console.log('  - 20 Candidates')
  console.log('  - 15 Activities')
  console.log('  - 5 Leads')
  console.log('  - 4 Email Templates')
}

// Main seed function
async function seed(): Promise<void> {
  console.log('🌱 Seeding database...')
  await connectDB()

  const createdUsers = await seedUsers()

  const adminId = createdUsers['admin@magnuscopo.com']
  const rashmiId = createdUsers['rashmi@magnuscopo.com']
  const priyaId = createdUsers['priya@magnuscopo.com']
  const rahulId = createdUsers['rahul@magnuscopo.com']
  const scraperId = createdUsers['scraper@magnuscopo.com']

  const createdCompanies = await seedCompanies(adminId, rashmiId)
  const createdRequirements = await seedRequirements(createdCompanies, priyaId, rahulId, adminId)

  await seedCandidates(createdRequirements)
  await seedActivities(createdRequirements, priyaId, rahulId)
  await seedLeads(scraperId)
  await seedTemplates(adminId)

  printSummary()
}

// Entry point (avoid top-level await in CJS)
async function main() {
  try {
    await seed()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error seeding database:', error)
    if (error.errors) {
      console.error('Validation Errors:', JSON.stringify(error.errors, null, 2))
    }
    process.exit(1)
  }
}

void main()

