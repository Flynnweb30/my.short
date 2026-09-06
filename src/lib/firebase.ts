import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCMlfbCNIWm-sp0ROB35A7ASDJm14idQpc",
  authDomain: "my-shortener-v2.firebaseapp.com",
  projectId: "my-shortener-v2",
  storageBucket: "my-shortener-v2.firebasestorage.app",
  messagingSenderId: "714255205377",
  appId: "1:714255205377:web:a19537d8b396da51a8ec00",
  measurementId: "G-MEVXZBGMQ8"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection successful.');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.toLowerCase().includes('client is offline')) {
        console.error(
          'Firebase client is offline. Check your Firebase configuration and network connection.'
        );
      } else {
        console.error('Firebase connection test failed:', error);
      }
    } else {
      console.error('Firebase connection test failed:', error);
    }
  }
}

testConnection();