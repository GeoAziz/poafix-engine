import mongoose from 'mongoose';

const electricalServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return v.startsWith('https://img.icons8.com/');
            },
            message: 'Image URL must be from Icons8'
        }
    },
    basePrice: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        default: '#2196F3' // default blue color
    },
    allowMultiple: {
        type: Boolean,
        default: false
    }
});

export const ElectricalService = mongoose.model('ElectricalService', electricalServiceSchema);
