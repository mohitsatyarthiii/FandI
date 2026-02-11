import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Entry from '../models/Entry.js';
import Task from '../models/Task.js';
import connectDB from '../config/database.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    await connectDB();
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Entry.deleteMany({});
    await Task.deleteMany({});
    
    // ============ CREATE ADMIN ============
    console.log('👑 Creating admin user...');
    const adminPassword = 'admin123';
    const admin = await User.create({
      name: 'Mohit Satyarthi',
      email: 'mohitsatyarthi@outlook.com',
      password: adminPassword,
      role: 'admin',
      location: 'all',
      phone: '9876543210',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Admin created:', admin.email);

    // ============ CREATE MANAGERS ============
    console.log('👨‍💼 Creating managers...');
    
    // Mathura Manager
    const mathuraManager = await User.create({
      name: 'Ravi Sharma',
      email: 'manager.mathura@company.com',
      password: 'mathura123',
      role: 'manager',
      location: 'mathura',
      phone: '9876543211',
      createdBy: admin._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Mathura Manager created');

    // Agra Manager
    const agraManager = await User.create({
      name: 'Priya Gupta',
      email: 'manager.agra@company.com',
      password: 'agra123',
      role: 'manager',
      location: 'agra',
      phone: '9876543212',
      createdBy: admin._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Agra Manager created');

    // Noida Manager
    const noidaManager = await User.create({
      name: 'Amit Verma',
      email: 'manager.noida@company.com',
      password: 'noida123',
      role: 'manager',
      location: 'noida',
      phone: '9876543213',
      createdBy: admin._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Noida Manager created');

    // ============ CREATE STAFF ============
    console.log('👷 Creating staff members...');

    // Mathura Staff
    const mathuraStaff1 = await User.create({
      name: 'Rahul Yadav',
      email: 'staff1.mathura@company.com',
      password: 'staff1123',
      role: 'staff',
      location: 'mathura',
      phone: '9876543214',
      createdBy: mathuraManager._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const mathuraStaff2 = await User.create({
      name: 'Neha Singh',
      email: 'staff2.mathura@company.com',
      password: 'staff2123',
      role: 'staff',
      location: 'mathura',
      phone: '9876543215',
      createdBy: mathuraManager._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Mathura staff created');

    // Agra Staff
    const agraStaff1 = await User.create({
      name: 'Vikas Kumar',
      email: 'staff1.agra@company.com',
      password: 'staff1123',
      role: 'staff',
      location: 'agra',
      phone: '9876543216',
      createdBy: agraManager._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const agraStaff2 = await User.create({
      name: 'Pooja Jain',
      email: 'staff2.agra@company.com',
      password: 'staff2123',
      role: 'staff',
      location: 'agra',
      phone: '9876543217',
      createdBy: agraManager._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Agra staff created');

    // Noida Staff
    const noidaStaff1 = await User.create({
      name: 'Sachin Tyagi',
      email: 'staff1.noida@company.com',
      password: 'staff1123',
      role: 'staff',
      location: 'noida',
      phone: '9876543218',
      createdBy: noidaManager._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const noidaStaff2 = await User.create({
      name: 'Kavita Rani',
      email: 'staff2.noida@company.com',
      password: 'staff2123',
      role: 'staff',
      location: 'noida',
      phone: '9876543219',
      createdBy: noidaManager._id,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Noida staff created');

    // ============ CREATE ENTRIES ============
    console.log('📝 Creating form entries...');

    // Entry 1: Mathura - Service Enquiry
    const entry1 = await Entry.create({
      enquiryType: 'service',
      clientName: 'Rajesh Electronics',
      clientPhone: '9898989898',
      clientEmail: 'rajesh.electronics@gmail.com',
      clientAddress: '28, Gokul Vihar, Near Krishna Janmabhoomi',
      clientCity: 'Mathura',
      location: 'mathura',
      enquiryDescription: 'Need AMC service for 5 CCTV cameras. System installed in 2023. Looking for quarterly maintenance contract.',
      priority: 'high',
      status: 'assigned',
      assignedTo: mathuraStaff1._id,
      assignedBy: mathuraManager._id,
      assignedAt: new Date('2026-02-10T10:30:00'),
      notes: [
        {
          text: 'Client preferred morning slot for service',
          addedBy: mathuraManager._id,
          addedAt: new Date('2026-02-10T10:35:00')
        }
      ],
      createdAt: new Date('2026-02-10T10:30:00'),
      updatedAt: new Date('2026-02-10T10:35:00')
    });
    console.log('✅ Entry 1 created - Mathura');

    // Entry 2: Agra - Product Enquiry
    const entry2 = await Entry.create({
      enquiryType: 'product',
      clientName: 'Taj Wedding Palace',
      clientPhone: '9876543210',
      clientEmail: 'events@tajpalace.com',
      clientAddress: '15, Fatehabad Road, Tajganj',
      clientCity: 'Agra',
      location: 'agra',
      enquiryDescription: 'Require 10 high-resolution security cameras with night vision for wedding hall. Budget around 50,000. Need quotation and demo.',
      priority: 'medium',
      status: 'new',
      assignedTo: null,
      assignedBy: null,
      assignedAt: null,
      notes: [],
      createdAt: new Date('2026-02-11T09:15:00'),
      updatedAt: new Date('2026-02-11T09:15:00')
    });
    console.log('✅ Entry 2 created - Agra');

    // Entry 3: Noida - Complaint
    const entry3 = await Entry.create({
      enquiryType: 'complaint',
      clientName: 'DLF Cyber City',
      clientPhone: '9812345678',
      clientEmail: 'facility@dlfcybercity.in',
      clientAddress: 'Tower C, DLF Cyber City, Sector 62',
      clientCity: 'Noida',
      location: 'noida',
      enquiryDescription: 'Main gate biometric system not working since yesterday. 500+ employees facing attendance issues. Urgent repair needed.',
      priority: 'urgent',
      status: 'in-progress',
      assignedTo: noidaStaff1._id,
      assignedBy: noidaManager._id,
      assignedAt: new Date('2026-02-11T11:00:00'),
      notes: [
        {
          text: 'Technician dispatched to site',
          addedBy: noidaManager._id,
          addedAt: new Date('2026-02-11T11:30:00')
        },
        {
          text: 'Issue identified - power supply failure. Replacing unit.',
          addedBy: noidaStaff1._id,
          addedAt: new Date('2026-02-11T13:45:00')
        }
      ],
      createdAt: new Date('2026-02-11T10:00:00'),
      updatedAt: new Date('2026-02-11T13:45:00')
    });
    console.log('✅ Entry 3 created - Noida');

    // Entry 4: Mathura - General Enquiry
    const entry4 = await Entry.create({
      enquiryType: 'general',
      clientName: 'Krishna Janmasthan Temple Trust',
      clientPhone: '9922334455',
      clientEmail: 'admin@janmasthan.org',
      clientAddress: 'Janmasthan Complex, Deeg Gate',
      clientCity: 'Mathura',
      location: 'mathura',
      enquiryDescription: 'Looking for integrated security solution for temple premises. Need CCTV, access control, and fire alarm system. Will take quotation for complete project.',
      priority: 'high',
      status: 'new',
      assignedTo: null,
      assignedBy: null,
      assignedAt: null,
      notes: [],
      createdAt: new Date('2026-02-11T14:20:00'),
      updatedAt: new Date('2026-02-11T14:20:00')
    });
    console.log('✅ Entry 4 created - Mathura');

    // ============ CREATE TASK ============
    console.log('✅ Creating task...');

    // Task from Entry 1 (Mathura - CCTV AMC)
    const task1 = await Task.create({
      title: 'CCTV AMC Service - Rajesh Electronics',
      description: `Perform quarterly maintenance for 5 CCTV cameras.
      
Client Details:
- Name: Rajesh Electronics
- Address: 28, Gokul Vihar, Near Krishna Janmabhoomi, Mathura
- Phone: 9898989898
- Email: rajesh.electronics@gmail.com

Service Requirements:
- Clean all camera lenses
- Check DVR functionality
- Verify recording retention (minimum 30 days)
- Test remote viewing access
- Provide service report`,
      entryId: entry1._id,
      location: 'mathura',
      assignedTo: mathuraStaff1._id,
      assignedBy: mathuraManager._id,
      priority: 'high',
      status: 'in-progress',
      dueDate: new Date('2026-02-15T18:00:00'),
      startDate: new Date('2026-02-11T09:00:00'),
      progress: 30,
      category: 'site-visit',
      updates: [
        {
          text: 'Started work at site. Cleaning cameras.',
          status: 'in-progress',
          updatedBy: mathuraStaff1._id,
          updatedAt: new Date('2026-02-11T09:00:00')
        },
        {
          text: '2 cameras cleaned, checking DVR settings',
          status: 'in-progress',
          updatedBy: mathuraStaff1._id,
          updatedAt: new Date('2026-02-11T10:30:00')
        }
      ],
      createdAt: new Date('2026-02-10T11:00:00'),
      updatedAt: new Date('2026-02-11T10:30:00')
    });
    console.log('✅ Task created - CCTV AMC Service');

    // ============ SUMMARY ============
    console.log('\n📊 ===== SEEDING COMPLETED SUCCESSFULLY! =====');
    console.log('==========================================');
    console.log(`👥 Total Users: ${await User.countDocuments()}`);
    console.log(`   ├─ Admin: 1`);
    console.log(`   ├─ Managers: 3 (Mathura, Agra, Noida)`);
    console.log(`   └─ Staff: 6 (2 per location)`);
    console.log(`📋 Total Entries: ${await Entry.countDocuments()}`);
    console.log(`   ├─ Mathura: 2 entries`);
    console.log(`   ├─ Agra: 1 entry`);
    console.log(`   └─ Noida: 1 entry`);
    console.log(`✅ Total Tasks: ${await Task.countDocuments()}`);
    console.log(`   └─ 1 active task in Mathura`);
    console.log('==========================================');
    
    console.log('\n🔑 ===== LOGIN CREDENTIALS =====');
    console.log('==========================================');
    console.log('👑 ADMIN:');
    console.log(`   Email: mohitsatyarthi@outlook.com`);
    console.log(`   Password: admin123`);
    console.log('\n👨‍💼 MANAGERS:');
    console.log(`   Mathura: manager.mathura@company.com / mathura123`);
    console.log(`   Agra: manager.agra@company.com / agra123`);
    console.log(`   Noida: manager.noida@company.com / noida123`);
    console.log('\n👷 STAFF:');
    console.log(`   Mathura: staff1.mathura@company.com / staff1123`);
    console.log(`   Mathura: staff2.mathura@company.com / staff2123`);
    console.log(`   Agra: staff1.agra@company.com / staff1123`);
    console.log(`   Agra: staff2.agra@company.com / staff2123`);
    console.log(`   Noida: staff1.noida@company.com / staff1123`);
    console.log(`   Noida: staff2.noida@company.com / staff2123`);
    console.log('==========================================');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();