// DashboardService: Aggregates provider stats for dashboard
import Booking from '../models/Booking.js';
import Job from '../models/job.js';
import Review from '../models/Review.js';
import Client from '../models/Client.js';

export async function getProviderDashboardStats(providerId) {
  // Earnings: sum of completed jobs
  const earningsAgg = await Booking.aggregate([
    { $match: { providerId: providerId, status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const earnings = earningsAgg[0]?.total || 0;

  // Jobs Done: count of completed bookings
  const jobsDone = await Booking.countDocuments({ providerId, status: 'completed' });

  // Pending Jobs: count of pending bookings
  const pendingJobs = await Booking.countDocuments({ providerId, status: 'pending' });

  // Ratings: average from reviews
  const ratingsAgg = await Review.aggregate([
    { $match: { providerId: providerId } },
    { $group: { _id: null, avg: { $avg: '$rating' } } }
  ]);
  const ratings = ratingsAgg[0]?.avg || 0;

  // Clients: unique client count
  const clientsAgg = await Booking.aggregate([
    { $match: { providerId: providerId } },
    { $group: { _id: '$clientId' } },
    { $count: 'uniqueClients' }
  ]);
  const clients = clientsAgg[0]?.uniqueClients || 0;

  // Hours: sum of job durations (assume 'duration' field in hours)
  const hoursAgg = await Job.aggregate([
    { $match: { providerId: providerId } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);
  const hours = hoursAgg[0]?.total || 0;

  return { earnings, jobsDone, pendingJobs, ratings, clients, hours };
}
