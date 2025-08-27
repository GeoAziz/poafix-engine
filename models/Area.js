import mongoose from 'mongoose';

const areaSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    iconUrl: {
        type: String,
        required: true
    },
    color: {
        type: String,
        default: '#2196F3'
    },
    allowMultiple: {
        type: Boolean,
        default: true
    }
});

export const Area = mongoose.model('Area', areaSchema);
