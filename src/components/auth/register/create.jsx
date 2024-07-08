import { auth, firestore } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const doCreateUserWithEmailAndPassword = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(firestore, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    balance: 100 // Initial balance
  });

  return user;
};

export { doCreateUserWithEmailAndPassword };
