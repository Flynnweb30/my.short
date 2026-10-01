import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db =
  firebaseConfig.firestoreDatabaseId &&
  firebaseConfig.firestoreDatabaseId !== '(default)' &&
  firebaseConfig.firestoreDatabaseId.trim() !== ''
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);

export const auth = getAuth(app);

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Call test connection on startup
testConnection();
