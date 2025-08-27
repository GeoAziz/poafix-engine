import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';
const PROVIDER_ID = '67c7df4f234d217f6cb0e359';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3YzdkZjRmMjM0ZDIxN2Y2Y2IwZTM1OSIsInVzZXJUeXBlIjoicHJvdmlkZXIiLCJpYXQiOjE3NDE0NDIzODQsImV4cCI6MTc0MTUyODc4NH0.Ce55F3JNpjiuPkDsO3Ft8wZoo7tF8q2h5hvscp35_EE';

const sampleTransactions = [
  {
    id: 'TX001',
    providerId: PROVIDER_ID,
    amount: 3500,
    clientName: 'John Kamau',
    serviceType: 'moving',
    timestamp: new Date('2024-03-08T09:30:00Z'),
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReference: 'QKM123456',
    description: 'House moving - Umoja to Donholm'
  },
  {
    id: 'TX002',
    providerId: PROVIDER_ID,
    amount: 4500,
    clientName: 'Mary Wambui',
    serviceType: 'moving',
    timestamp: new Date('2024-03-08T14:15:00Z'),
    status: 'completed',
    paymentMethod: 'mpesa',
    mpesaReference: 'QKM123457',
    description: 'Office relocation - CBD to Westlands'
  },
  {
    id: 'TX003',
    providerId: PROVIDER_ID,
    amount: 2800,
    clientName: 'Peter Ochieng',
    serviceType: 'moving',
    timestamp: new Date('2024-03-09T11:30:00Z'),
    status: 'pending',
    paymentMethod: 'mpesa',
    mpesaReference: 'QKM123458',
    description: 'Furniture moving - Kilimani'
  }
];

async function addTransactions() {
  for (const transaction of sampleTransactions) {
    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify(transaction)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Added transaction ${transaction.id}:`, data);
    } catch (error) {
      console.error(`Failed to add transaction ${transaction.id}:`, error.message);
    }
  }
}

addTransactions();
