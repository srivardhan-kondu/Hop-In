import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { createUserProfile } from '../db/users';
import { createVanProfile } from '../db/vans';
import { encryptText } from '../../utils/security';
import { newChildRecord } from '../../utils/children';

export async function registerParent(payload) {
  const creds = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
  const children = payload.children.map((child) => newChildRecord(child));

  await createUserProfile(creds.user.uid, {
    email: payload.email,
    role: 'parent',
    name: payload.name,
    phone: payload.phone,
    children,
  });

  return creds.user;
}

export async function registerDriver(payload) {
  const creds = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
  const vanId = crypto.randomUUID();

  await createUserProfile(creds.user.uid, {
    email: payload.email,
    role: 'driver',
    name: payload.name,
    phone: payload.phone,
    aadhaarVerified: false,
    aadhaarNumber: await encryptText(payload.aadhaarNumber),
    aadhaarDocUrl: payload.aadhaarDocUrl ?? '',
    verificationStatus: 'pending',
    yearsOfExperience: Number(payload.yearsOfExperience),
    vanDetails: {
      vanId,
      photo: payload.vanPhoto ?? '',
      capacity: Number(payload.capacity),
      currentVacancy: Number(payload.capacity),
      pricePerMonth: Number(payload.pricePerMonth),
    },
    performanceScore: 0,
    overallRating: 0,
    totalReviews: 0,
  });

  await createVanProfile({
    vanId,
    driverId: creds.user.uid,
    driverName: payload.name,
    schoolId: payload.schoolId ?? '',
    capacity: Number(payload.capacity),
    currentVacancy: Number(payload.capacity),
    pricePerMonth: Number(payload.pricePerMonth),
    route: payload.route ?? [],
    pickupTime: payload.pickupTime ?? '',
    dropTime: payload.dropTime ?? '',
  });

  return creds.user;
}

export async function registerAdmin(payload) {
  const creds = await createUserWithEmailAndPassword(auth, payload.email, payload.password);

  await createUserProfile(creds.user.uid, {
    email: payload.email,
    role: 'admin',
    name: payload.name,
  });

  return creds.user;
}
