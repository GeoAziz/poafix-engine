import { Job } from '../models/index.js';
import { ServiceProvider } from '../models/ServiceProvider.js';
import { Client } from '../models/Client.js';
import { WebSocketService } from '../services/websocket.service.js';
import { Booking } from '../models/booking.model.js';
import mongoose from 'mongoose';

export const createJob = async (req, res) => {
  try {
    const jobData = req.body;
    const newJob = new Job(jobData);
    await newJob.save();

    // Populate client and provider details
    const job = await Job.findById(newJob._id)
      .populate('clientId', 'name phoneNumber email')
      .populate('providerId', 'businessName phoneNumber');

    // Notify provider about new job
    global.webSocketService.notifyProvider(job.providerId, {
      type: 'new_job',
      message: 'New job request received',
      job: job
    });

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message
    });
  }
};

export const updateJobStatus = async (req, res) => {
  const { jobId } = req.params;
  const { status } = req.body;
  const providerId = req.user.userId;
  console.log('DEBUG updateJobStatus: jobId (raw):', jobId, 'providerId (raw):', providerId);
  console.log('DEBUG updateJobStatus: jobId (type):', typeof jobId, 'providerId (type):', typeof providerId);
  const queryProviderId = mongoose.Types.ObjectId.isValid(providerId) ? new mongoose.Types.ObjectId(providerId) : providerId;
  const queryJobId = mongoose.Types.ObjectId.isValid(jobId) ? new mongoose.Types.ObjectId(jobId) : jobId;
  console.log('DEBUG updateJobStatus: queryJobId:', queryJobId, 'queryProviderId:', queryProviderId);
  console.log('DEBUG updateJobStatus: queryJobId (type):', typeof queryJobId, 'queryProviderId (type):', typeof queryProviderId);
  try {
    const { jobId } = req.params;
    const { status } = req.body;
  const providerId = req.user && req.user.userId ? req.user.userId : undefined;
    const queryProviderId = mongoose.Types.ObjectId.isValid(providerId) ? new mongoose.Types.ObjectId(providerId) : providerId;
    const queryJobId = mongoose.Types.ObjectId.isValid(jobId) ? new mongoose.Types.ObjectId(jobId) : jobId;

    const updatedJob = await Job.findOneAndUpdate(
      { _id: queryJobId, providerId: queryProviderId },
      { status: status },
      { new: true }
    ).populate('clientId', 'name phoneNumber email');

    if (!updatedJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Also update the related booking status
    if (updatedJob.bookingId) {
      await Booking.findByIdAndUpdate(updatedJob.bookingId, { status: status });
    }

    // Notify both provider and client about status update
    WebSocketService.notifyUser(updatedJob.providerId.toString(), {
      type: 'JOB_UPDATE',
      data: updatedJob
    });

    res.json({
      success: true,
      message: 'Job status updated successfully',
      job: updatedJob
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating job status',
      error: error.message
    });
  }
};

export const getProviderJobs = async (req, res) => {
  try {
    const providerId = req.user.userId;
    console.log('DEBUG getProviderJobs: providerId from auth:', providerId);
    // Ensure providerId is ObjectId for query
    const mongoose = require('mongoose');
    const queryProviderId = mongoose.Types.ObjectId.isValid(providerId) ? mongoose.Types.ObjectId(providerId) : providerId;
    const jobs = await Job.find({ providerId: queryProviderId })
      .populate('clientId', 'name phoneNumber email')
      .sort({ createdAt: -1 });
    console.log('DEBUG getProviderJobs: jobs found:', jobs.length);
    res.json({
      success: true,
      jobs: jobs
    });
  } catch (error) {
    console.error('DEBUG getProviderJobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message
    });
  }
};
