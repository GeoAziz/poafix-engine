import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin with service account
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: "104008380765077052524",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

// Initialize Firebase
let bucket;
try {
  const app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET
  });
  bucket = getStorage(app).bucket();
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

// Helper function for local storage fallback
const saveLocally = async (base64Image, folder = 'profiles') => {
  try {
    const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const fileName = `${folder}_${uuidv4()}.jpg`;
    const filePath = `./uploads/${fileName}`;

    const fs = await import('fs/promises');
    await fs.mkdir('./uploads', { recursive: true });
    await fs.writeFile(filePath, buffer);

    return `${process.env.APP_URL}/uploads/${fileName}`;
  } catch (error) {
    console.error('Error saving file locally:', error);
    throw error;
  }
};

export const uploadImage = async (base64Image, folder = 'profiles') => {
  try {
    if (!bucket) {
      console.warn('Firebase storage not initialized, using local storage');
      return await saveLocally(base64Image, folder);
    }

    const buffer = Buffer.from(base64Image.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const filename = `${folder}/${uuidv4()}.jpg`;
    const file = bucket.file(filename);
    
    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
      }
    });

    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${filename}`;
  } catch (error) {
    console.error('Error uploading to Firebase:', error);
    return await saveLocally(base64Image, folder);
  }
};

export const deleteImage = async (imageUrl) => {
  try {
    if (!bucket) {
      const filename = imageUrl.split('/').pop();
      const fs = await import('fs/promises');
      await fs.unlink(path.join(process.env.UPLOAD_DIR, filename));
      return;
    }

    const filename = imageUrl.split('/').pop();
    const file = bucket.file(filename);
    await file.delete();
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};
