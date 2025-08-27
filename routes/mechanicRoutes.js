import express from 'express';
const router = express.Router();

// Default mechanic services data
const mechanicServices = [
  {
    _id: '1',
    name: 'Engine Repair',
    description: 'Complete engine diagnostic and repair service',
    iconUrl: 'https://img.icons8.com/color/96/engine.png',
    basePrice: 150.00,
    color: '#FF5722',
    allowMultiple: false
  },
  {
    _id: '2',
    name: 'Brake Service',
    description: 'Brake inspection, repair and replacement',
    iconUrl: 'https://img.icons8.com/color/96/brake-disc.png',
    basePrice: 80.00,
    color: '#2196F3',
    allowMultiple: false
  },
  {
    _id: '3',
    name: 'Oil Change',
    description: 'Full service oil and filter change',
    iconUrl: 'https://img.icons8.com/color/96/motor-oil.png',
    basePrice: 45.00,
    color: '#4CAF50',
    allowMultiple: false
  },
  {
    _id: '4',
    name: 'Tire Service',
    description: 'Tire rotation, balancing and replacement',
    iconUrl: 'https://img.icons8.com/color/96/tire.png',
    basePrice: 60.00,
    color: '#9C27B0',
    allowMultiple: true
  }
];

// GET /api/mechanic-services
router.get('/', (req, res) => {
  try {
    res.json(mechanicServices);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mechanic services' });
  }
});

export const mechanicRoutes = router;
