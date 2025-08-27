import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { 
  UserModel as User, 
  ServiceProviderModel as ServiceProvider, 
  AdminModel as Admin, 
  BookingModel as Booking, 
  JobModel as Job,
  NotificationModel as Notification,
  Transaction,
  ServiceRequest,
  Payment,
  Review,
  Rating,
  ClientModel as Client,
  Suspension,
  BlockedClient,
  ProviderDocument
} from '../models/index.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/home_service_db';

async function seedCompleteDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      ServiceProvider.deleteMany({}),
      Admin.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Booking.deleteMany({}),
      Job.deleteMany({}),
      Transaction.deleteMany({}),
      Notification.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({}),
      Rating.deleteMany({})
    ]);

    // 1. Create Admin Users
    console.log('👑 Creating admin users...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admins = await Admin.insertMany([
      {
        name: 'Super Admin',
        email: 'admin@poafix.com',
        password: adminPassword,
        role: 'super_admin',
        permissions: [
          'users', 'providers', 'reports', 'settings', 
          'suspensions', 'verifications', 'payments', 
          'analytics', 'system_config'
        ],
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date()
      },
      {
        name: 'John Admin',
        email: 'john@poafix.com', 
        password: adminPassword,
        role: 'admin',
        permissions: [
          'users', 'providers', 'reports', 
          'suspensions', 'verifications'
        ],
        isActive: true,
        lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      },
      {
        name: 'Sarah Admin',
        email: 'sarah@poafix.com',
        password: adminPassword,
        role: 'admin',
        permissions: ['users', 'providers', 'reports'],
        isActive: true,
        lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        createdAt: new Date()
      }
    ]);

    // 2. Create Client Users
    console.log('👥 Creating client users...');
    const clientPassword = await bcrypt.hash('password123', 12);
    const clients = await User.insertMany([
      {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        password: clientPassword,
        phoneNumber: '+254701234567',
        role: 'client',
        address: 'Westlands, Nairobi',
        location: {
          type: 'Point',
          coordinates: [36.8095, -1.2676]
        },
        isActive: true,
        isBlocked: false,
        profileImage: '',
        dateOfBirth: new Date('1985-06-15'),
        gender: 'female',
        emergencyContact: {
          name: 'Bob Johnson',
          phone: '+254701234590'
        },
        preferences: {
          notifications: true,
          emailUpdates: true,
          smsUpdates: false
        },
        stats: {
          totalBookings: 5,
          completedBookings: 3,
          cancelledBookings: 1,
          totalSpent: 15000
        },
        createdAt: new Date()
      },
      {
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: clientPassword,
        phoneNumber: '+254701234568',
        role: 'client', 
        address: 'Karen, Nairobi',
        location: {
          type: 'Point',
          coordinates: [36.6856, -1.3194]
        },
        isActive: true,
        isBlocked: false,
        profileImage: '',
        dateOfBirth: new Date('1990-03-22'),
        gender: 'male',
        emergencyContact: {
          name: 'Mary Smith',
          phone: '+254701234591'
        },
        preferences: {
          notifications: true,
          emailUpdates: true,
          smsUpdates: true
        },
        stats: {
          totalBookings: 8,
          completedBookings: 6,
          cancelledBookings: 1,
          totalSpent: 25000
        },
        createdAt: new Date()
      },
      {
        name: 'Carol Williams',
        email: 'carol@example.com',
        password: clientPassword,
        phoneNumber: '+254701234569',
        role: 'client',
        address: 'Kilimani, Nairobi',
        location: {
          type: 'Point',
          coordinates: [36.7819, -1.2921]
        },
        isActive: false,
        isBlocked: true,
        blockReason: 'Multiple spam complaints and inappropriate behavior',
        blockedAt: new Date(),
        blockedBy: admins[0]._id,
        profileImage: '',
        dateOfBirth: new Date('1988-11-08'),
        gender: 'female',
        stats: {
          totalBookings: 12,
          completedBookings: 4,
          cancelledBookings: 6,
          totalSpent: 8000
        },
        createdAt: new Date()
      }
    ]);

    // 3. Create Service Providers
    console.log('🔧 Creating service providers...');
    const providerPassword = await bcrypt.hash('provider123', 12);
    const providers = await ServiceProvider.insertMany([
      {
        name: 'David Plumber',
        businessName: 'David Plumber',
        email: 'david.plumber@example.com',
        password: providerPassword,
        phoneNumber: '+254700000001',
        businessAddress: 'Westlands, Nairobi',
        serviceType: 'plumbing',
        serviceOffered: [
          {
            name: 'Plumbing',
            description: 'All types of plumbing repairs and installations.',
            price: '3500',
            duration: '2 hours'
          }
        ],
        experience: 5,
        isAvailable: true,
        isVerified: true,
        status: 'verified',
        rating: 4.7,
        reviewCount: 12,
        location: {
          type: 'Point',
          coordinates: [36.8392, -1.3057],
        },
        createdAt: new Date(),
      },
      {
        name: 'Emma Electrician',
        businessName: "Emma's Electrical Solutions",
        email: 'emma@electrical.com',
        password: providerPassword,
        phoneNumber: '+254701234571',
        businessAddress: 'Eastlands, Nairobi',
        serviceType: 'electrical',
        serviceOffered: [
          {
            name: 'Electrical',
            description: 'Licensed electrician specializing in residential and commercial electrical work.',
            price: '2000',
            duration: '4 hours'
          }
        ],
        experience: 7,
        isAvailable: true,
        isVerified: true,
        status: 'verified',
        rating: 4.8,
        totalRatings: 31,
        location: {
          type: 'Point',
          coordinates: [36.8919, -1.2734]
        },
        verifiedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        verifiedBy: admins[1]._id,
        profileImage: 'emma_profile.jpg',
        portfolio: ['electrical1.jpg', 'electrical2.jpg', 'electrical3.jpg'],
        hourlyRate: 2000,
        description: 'Licensed electrician specializing in residential and commercial electrical work.',
        services: [
          'Wiring installation', 'Circuit repairs', 'Panel upgrades', 
          'Lighting installation', 'Outlet installation', 'Electrical troubleshooting'
        ],
        businessLicense: 'EL54321',
        insurance: 'INS09876',
        stats: {
          totalJobs: 67,
          completedJobs: 63,
          cancelledJobs: 1,
          totalEarnings: 185000
        },
        createdAt: new Date()
      },
      {
        name: 'Frank Painter',
        businessName: "Frank's Premium Painting Works",
        email: 'frank@painting.com',
        password: providerPassword,
        phoneNumber: '+254701234572',
        businessAddress: 'Kasarani, Nairobi',
        serviceType: 'painting',
        serviceOffered: [
          {
            name: 'Painting',
            description: 'Professional painter with expertise in interior and exterior painting.',
            price: '1200',
            duration: '8 hours'
          }
        ],
        experience: 3,
        isAvailable: true,
        isVerified: false,
        status: 'pending',
        rating: 4.2,
        totalRatings: 18,
        location: {
          type: 'Point',
          coordinates: [36.8969, -1.2297]
        },
        profileImage: 'frank_profile.jpg',
        portfolio: ['painting1.jpg', 'painting2.jpg'],
        hourlyRate: 1200,
        description: 'Professional painter with expertise in interior and exterior painting.',
        services: [
          'Interior painting', 'Exterior painting', 'Wall preparation', 
          'Color consultation', 'Texture application'
        ],
        businessLicense: 'PT98765',
        stats: {
          totalJobs: 28,
          completedJobs: 25,
          cancelledJobs: 2,
          totalEarnings: 85000
        },
        createdAt: new Date()
      },
      {
        name: 'Grace Cleaner',
        businessName: "Grace's Premium Cleaning Services",
        email: 'grace@cleaning.com',
        password: providerPassword,
        phoneNumber: '+254701234573',
        businessAddress: 'Kileleshwa, Nairobi',
        serviceType: 'cleaning',
        serviceOffered: [
          {
            name: 'Cleaning',
            description: 'Professional cleaning service with eco-friendly products.',
            price: '800',
            duration: '3 hours'
          }
        ],
        experience: 4,
        isAvailable: false,
        isVerified: true,
        status: 'suspended',
        rating: 4.7,
        totalRatings: 42,
        location: {
          type: 'Point',
          coordinates: [36.7689, -1.2674]
        },
        verifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        verifiedBy: admins[0]._id,
        profileImage: 'grace_profile.jpg',
        portfolio: ['cleaning1.jpg', 'cleaning2.jpg', 'cleaning3.jpg'],
        hourlyRate: 800,
        description: 'Professional cleaning service with eco-friendly products.',
        services: [
          'House cleaning', 'Office cleaning', 'Deep cleaning', 
          'Move-in/out cleaning', 'Post-construction cleanup'
        ],
        suspendedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        suspensionReason: 'Multiple customer complaints - under review',
        suspendedBy: admins[1]._id,
        businessLicense: 'CL11223',
        stats: {
          totalJobs: 89,
          completedJobs: 81,
          cancelledJobs: 5,
          totalEarnings: 145000
        },
        createdAt: new Date()
      }
    ]);

    // Add after providers are created
    // 3b. Create Provider Documents
    console.log('📄 Creating provider documents...');
    const providerDocs = [
      {
        providerId: providers[0]._id,
        type: 'BUSINESS_LICENSE',
        category: 'Certifications',
        documentNumber: 'BL123456',
        status: 'verified',
        documentUrl: 'uploads/david_plumber_license.pdf',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        providerId: providers[0]._id,
        type: 'ID_DOCUMENT',
        category: 'Identity',
        documentNumber: 'ID987654',
        status: 'verified',
        documentUrl: 'uploads/david_plumber_id.pdf',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        providerId: providers[1]._id,
        type: 'BUSINESS_LICENSE',
        category: 'Certifications',
        documentNumber: 'BL654321',
        status: 'pending',
        documentUrl: 'uploads/emma_electrician_license.pdf',
        expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      },
      {
        providerId: providers[2]._id,
        type: 'ID_DOCUMENT',
        category: 'Identity',
        documentNumber: 'ID112233',
        status: 'verified',
        documentUrl: 'uploads/frank_painter_cert.pdf',
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        providerId: providers[3]._id,
  type: 'INSURANCE_POLICY',
  category: 'Insurance',
  documentNumber: 'INS998877',
  status: 'rejected',
  documentUrl: 'uploads/grace_cleaner_insurance.pdf',
  expiryDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      }
    ];
    await ProviderDocument.insertMany(providerDocs);
    console.log('✅ Provider documents seeded');


  console.log('✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`- Admins: ${admins.length} (Full admin dashboard access)`);
  console.log(`- Clients: ${clients.length}`);
  console.log(`- Providers: ${providers.length}`);

  console.log('\n🔑 Login Credentials:');
  console.log('📱 ADMIN DASHBOARD ACCESS:');
  console.log('  Super Admin: admin@poafix.com / admin123');
  console.log('  Admin: john@poafix.com / admin123');
  console.log('  Admin: sarah@poafix.com / admin123');

  console.log('\n👤 CLIENT ACCESS:');
  console.log('  Alice (Active): alice@example.com / password123');
  console.log('  Bob (Active): bob@example.com / password123');
  console.log('  Carol (Blocked): carol@example.com / password123');

  console.log('\n🔧 PROVIDER ACCESS:');
  console.log('  David (Verified): david@plumbing.com / provider123');
  console.log('  Emma (Verified): emma@electrical.com / provider123');
  console.log('  Frank (Pending): frank@painting.com / provider123');
  console.log('  Grace (Suspended): grace@cleaning.com / provider123');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedCompleteDatabase();