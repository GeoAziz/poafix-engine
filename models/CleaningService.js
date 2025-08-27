import mongoose from 'mongoose';

const cleaningServiceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    iconUrl: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#000000'
    },
    basePrice: {
        type: Number,
        required: true
    },
    allowMultiple: {
        type: Boolean,
        default: false
    }
});

export const CleaningService = mongoose.model('CleaningService', cleaningServiceSchema);
