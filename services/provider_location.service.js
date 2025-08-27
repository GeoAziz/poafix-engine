import { ServiceProvider } from '../models/ServiceProvider.js';

class ProviderLocationService {
  static async updateLocation(providerId, coordinates, isAvailable = true) {
    try {
      console.log('Updating provider location:', {
        providerId,
        coordinates,
        isAvailable
      });

      const provider = await ServiceProvider.findByIdAndUpdate(
        providerId,
        {
          $set: {
            'location.coordinates': coordinates,
            isAvailable: isAvailable,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!provider) {
        throw new Error('Provider not found');
      }

      return provider;
    } catch (error) {
      console.error('Location update error:', error);
      throw error;
    }
  }
}

export default ProviderLocationService;
