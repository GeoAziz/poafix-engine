export const formatProviderProfile = (provider) => {
  return {
    ...provider,
    serviceAreas: provider.serviceAreas.map(area => ({
      ...area,
      radiusInKm: (area.radius / 1000).toFixed(1),
      formattedAddress: `${area.area} (${(area.radius / 1000).toFixed(1)}km radius)`
    })),
    
    availability: formatAvailability(provider.availability),
    
    certifications: provider.certifications.map(cert => ({
      ...cert,
      isExpired: new Date(cert.expiryDate) < new Date(),
      daysUntilExpiry: Math.ceil(
        (new Date(cert.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
      )
    })),
    
    reviews: {
      recent: provider.reviews.slice(0, 5),
      summary: {
        average: provider.rating,
        total: provider.reviews.length,
        distribution: calculateRatingDistribution(provider.reviews)
      }
    }
  };
};

function formatAvailability(availability) {
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return availability
    .sort((a, b) => daysOrder.indexOf(a.weekDay) - daysOrder.indexOf(b.weekDay))
    .map(day => ({
      ...day,
      slots: day.slots.map(slot => ({
        ...slot,
        formattedTime: `${slot.startTime} - ${slot.endTime}`
      }))
    }));
}

function calculateRatingDistribution(reviews) {
  const distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0};
  reviews.forEach(review => {
    distribution[review.rating]++;
  });
  return distribution;
}
