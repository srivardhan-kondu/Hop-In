import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}
