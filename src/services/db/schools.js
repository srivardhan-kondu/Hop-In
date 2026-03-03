import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export async function searchSchoolsByName(searchTerm) {
  const lower = searchTerm.toLowerCase();
  try {
    const q = query(collection(db, 'schools'), where('nameLower', '>=', lower), where('nameLower', '<=', `${lower}\uf8ff`));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    const snap = await getDocs(collection(db, 'schools'));
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((school) => school.name?.toLowerCase().includes(lower));
  }
}
