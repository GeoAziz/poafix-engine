// In your getClientBookings method
async function getClientBookings(clientId) {
  try {
    const bookings = await Booking.find({
      $or: [
        { clientId: clientId },
        { 'client._id': mongoose.Types.ObjectId(clientId) },
        { client: mongoose.Types.ObjectId(clientId) }
      ]
    }).sort({ createdAt: -1 });
    
    return bookings;
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    throw error;
  }
}