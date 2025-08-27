import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://localhost:27017/poafix';

const transactionSchema = new mongoose.Schema({
  id: String,
  amount: Number,
  clientName: String,
  serviceType: String,
  timestamp: Date,
  status: String,
  paymentMethod: String,
  mpesaReference: String,
  description: String
});

const Transaction = mongoose.model('Transaction', transactionSchema);

const sampleTransactions = [
  {
    id: 'TX001',
    amount: 2500,
    clientName: 'John Doe',
    serviceType: 'Plumbing',
    timestamp: new Date('2024-02-27T09:30:00Z'),
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123456',
    description: 'Kitchen sink repair'
  },
  {
    id: 'TX002',
    amount: 3500,
    clientName: 'Jane Smith',
    serviceType: 'Electrical',
    timestamp: new Date('2024-02-27T11:15:00Z'),
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123457',
    description: 'Wiring installation'
  },
  {
    id: 'TX003',
    amount: 1800,
    clientName: 'Mike Johnson',
    serviceType: 'Plumbing',
    timestamp: new Date('2024-02-27T13:45:00Z'),
    status: 'pending',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123458',
    description: 'Bathroom leak repair'
  },
  {
    id: 'TX004',
    amount: 4200,
    clientName: 'Sarah Williams',
    serviceType: 'Electrical',
    timestamp: new Date('2024-02-27T15:20:00Z'),
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123459',
    description: 'Circuit breaker installation'
  },
  {
    id: 'TX005',
    amount: 2800,
    clientName: 'Robert Brown',
    serviceType: 'Plumbing',
    timestamp: new Date('2024-02-27T16:45:00Z'),
    status: 'pending',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123460',
    description: 'Water heater repair'
  },
  {
    id: 'TX006',
    amount: 3200,
    clientName: 'Emma Wilson',
    serviceType: 'Plumbing',
    timestamp: new Date('2024-02-28T09:15:00Z'),
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123461',
    description: 'Drainage system repair'
  },
  {
    id: 'TX007',
    amount: 5000,
    clientName: 'David Lee',
    serviceType: 'Electrical',
    timestamp: new Date('2024-02-28T10:30:00Z'),
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123462',
    description: 'Full house wiring check'
  },
  {
    id: 'TX008',
    amount: 2100,
    clientName: 'Lisa Anderson',
    serviceType: 'Plumbing',
    timestamp: new Date('2024-02-28T13:20:00Z'),
    status: 'pending',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123463',
    description: 'Faucet replacement'
  },
  {
    id: 'TX009',
    amount: 4500,
    clientName: 'James Miller',
    serviceType: 'Electrical',
    timestamp: new Date('2024-02-28T15:45:00Z'),
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123464',
    description: 'Security light installation'
  },
  {
    id: 'TX010',
    amount: 3800,
    clientName: 'Sophie Clark',
    serviceType: 'Plumbing',
    timestamp: new Date('2024-02-28T17:00:00Z'),
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReference: 'MPE123465',
    description: 'Pipe leak repair'
  }
];

async function seedTransactions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing transactions
    await Transaction.deleteMany({});
    console.log('Cleared existing transactions');

    // Insert new transactions
    await Transaction.insertMany(sampleTransactions);
    console.log('Added sample transactions');

    const count = await Transaction.countDocuments();
    console.log(`Total transactions in database: ${count}`);

  } catch (error) {
    console.error('Error seeding transactions:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
seedTransactions();
