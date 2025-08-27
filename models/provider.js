import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const providerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    phoneNumber: {
        type: String,
        required: true
    },
    businessName: {
        type: String,
        required: true
    },
    serviceType: {
        type: String,
        required: true
    },
    address: String,
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
            validate: {
                validator: function(coords) {
                    return Array.isArray(coords) && 
                           coords.length === 2 && 
                           coords.every(coord => typeof coord === 'number');
                },
                message: 'Location coordinates must be an array of two numbers'
            }
        }
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    rating: {
        type: Number,
        default: 0
    },
    backupContact: String,
    preferredCommunication: {
        type: String,
        enum: ['SMS', 'Email', 'Both'],
        default: 'Both'
    },
    timezone: {
        type: String,
        default: 'UTC'
    }
}, {
    timestamps: true,
    collection: 'providers'
});

providerSchema.index({ location: '2dsphere' });
providerSchema.index({ email: 1 }, { unique: true });

const Provider = mongoose.models.Provider || mongoose.model('Provider', providerSchema);

export { Provider };
export default Provider;
