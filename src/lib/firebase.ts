import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  FirestoreError,
} from 'firebase/firestore';

import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Firebase application
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication
 */
export const auth = getAuth(app);

/**
 * Firestore
 *
 * firebase-applet-config.json specifies:
 * "firestoreDatabaseId": "(default)"
 *
 * This connects to the default Firestore database.
 */
export const db = getFirestore(
  app,
  firebaseConfig.firestoreDatabaseId || '(default)'
);

/**
 * Optional Firestore connectivity test.
 *
 * This function is NOT automatically executed.
 * Call it manually when you actually need to test Firebase.
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(
      doc(db, '__system', 'connection-test')
    );

    console.info('Firebase Firestore connection successful.');
    return true;
  } catch (error) {
    const firebaseError = error as FirestoreError;

    if (firebaseError?.code === 'not-found') {
      console.error(
        'Firestore database not found. Make sure the "(default)" Firestore database has been created in Firebase Console.'
      );
    } else if (
      firebaseError?.code === 'permission-denied'
    ) {
      console.error(
        'Firestore connection reached Firebase, but the request was denied by Firestore Security Rules.'
      );
    } else if (
      firebaseError?.code === 'unavailable'
    ) {
      console.error(
        'Firestore is temporarily unavailable or the browser is offline.'
      );
    } else {
      console.error(
        'Firestore connection test failed:',
        error
      );
    }

    return false;
  }
}

/**
 * Export the Firebase application in case another
 * module needs it.
 */
export { app };