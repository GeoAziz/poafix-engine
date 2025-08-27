import mongoose from 'mongoose';

const paintingServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    iconUrl: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return v.startsWith('https://img.icons8.com/');
            },
            message: 'Icon URL must be from Icons8'
        }
    },
    color: {
        type: String,
        default: '#2196F3'
    },
    basePrice: {
        type: Number,
        required: true
    },
    paintTypes: {
        type: [String],
        default: ['Glossy', 'Matte', 'Satin']
    }
});

export const PaintingService = mongoose.model('PaintingService', paintingServiceSchema);
