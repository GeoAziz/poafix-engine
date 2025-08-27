const mongoose = require('mongoose');
const Area = require('../models/Area');

const areas = [
    {
        name: "Living Room",
        iconUrl: "https://cdn-icons-png.flaticon.com/128/3030/3030335.png",
        color: "#FF9800",
        quantity: 1
    },
    {
        name: "Kitchen",
        iconUrl: "https://cdn-icons-png.flaticon.com/128/1245/1245264.png",
        color: "#4CAF50",
        quantity: 1
    },
    {
        name: "Bedroom",
        iconUrl: "https://cdn-icons-png.flaticon.com/128/3030/3030336.png",
        color: "#2196F3",
        quantity: 1
    },
    {
        name: "Bathroom",
        iconUrl: "https://cdn-icons-png.flaticon.com/128/3030/3030347.png",
        color: "#9C27B0",
        quantity: 1
    },
    {
        name: "Office",
        iconUrl: "https://cdn-icons-png.flaticon.com/128/3030/3030334.png",
        color: "#F44336",
        quantity: 1
    }
];

async function seedAreas() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/home_service_db');
        
        // Clear existing areas
        await Area.deleteMany({});
        
        // Insert new areas
        await Area.insertMany(areas);
        
        console.log('Areas seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding areas:', error);
        process.exit(1);
    }
}

seedAreas();
