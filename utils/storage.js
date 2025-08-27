
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(path.join(process.cwd(), 'config', 'poafix-firebase-adminsdk-nx2ao-7a5ae76734.json')),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'poafix.appspot.com',
  });
}

const bucket = admin.storage().bucket();

export const uploadToStorage = async (file) => {
  try {
    const fileName = `${uuidv4()}-${file.originalname}`;
    const fileUpload = bucket.file(fileName);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
      resumable: false,
    });

    return new Promise((resolve, reject) => {
      stream.on('error', (error) => reject(error));
      stream.on('finish', async () => {
        // Make file public
        await fileUpload.makePublic();
        const publicUrl = fileUpload.publicUrl();
        resolve(publicUrl);
      });
      stream.end(file.buffer);
    });
  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error);
    throw error;
  }
};

export const validateDocument = (file) => {
  const maxSize = process.env.MAX_DOCUMENT_SIZE || 10485760; // 10MB default
  const allowedTypes = (process.env.ALLOWED_DOCUMENT_TYPES || 'application/pdf,image/jpeg,image/png').split(',');

  if (file.size > maxSize) {
    throw new Error('File size exceeds maximum limit');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('File type not allowed');
  }

  return true;
};
