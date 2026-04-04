import { useState, useEffect } from 'react';
import { db } from './firebase';
import { 
  collection, doc, setDoc, getDoc, updateDoc, deleteDoc, 
  query, where, orderBy, onSnapshot, serverTimestamp, 
  Timestamp, addDoc
} from 'firebase/firestore';
import { useAuth } from '../components/auth/AuthProvider';
import type { Note, UserProfile } from './types';

// Convert Firestore timestamps to Dates
export const mapNote = (docSnap: any): Note => {
  const data = docSnap.data();
  // Firestore serverTimestamp resolves to null locally until synced, which causes .toDate() to crash
  const getSafeDate = (field: any) => {
    if (!field) return new Date();
    if (typeof field.toDate === 'function') return field.toDate();
    if (field.seconds) return new Date(field.seconds * 1000);
    return new Date(field);
  };

  return {
    ...data,
    docId: docSnap.id,
    sermonDate: getSafeDate(data.sermonDate),
    updatedAt: getSafeDate(data.updatedAt)
  } as Note;
};

export function usePublicNotes() {
  const [publicNotes, setPublicNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notes'),
      where('isPublic', '==', true),
      orderBy('sermonDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPublicNotes(snapshot.docs.map(mapNote));
      setLoading(false);
    }, (err) => {
      console.error("Error fetching public notes:", err);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const likeNote = async (docId: string, currentHearts: number) => {
    const ref = doc(db, 'notes', docId);
    await updateDoc(ref, { heartCount: currentHearts + 1 });
  };

  return { publicNotes, loading, likeNote };
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.uid),
      orderBy('sermonDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNotes = snapshot.docs.map(mapNote);
      setNotes(fetchedNotes);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching notes:", err);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addNote = async (note: Omit<Note, 'docId' | 'userId' | 'updatedAt' | 'heartCount'>) => {
    if (!user) throw new Error("Must be logged in");
    
    // Attempt saving preacher to known list automatically
    if (note.preacher) {
      savePreacherToProfile(user.uid, note.preacher).catch(console.error);
    }
    
    return await addDoc(collection(db, 'notes'), {
      ...note,
      userId: user.uid,
      heartCount: 0,
      updatedAt: serverTimestamp(),
      sermonDate: Timestamp.fromDate(note.sermonDate)
    });
  };

  const updateNote = async (docId: string, updates: Partial<Note>) => {
    if (!user) throw new Error("Must be logged in");
    const ref = doc(db, 'notes', docId);
    
    if (updates.preacher) {
      savePreacherToProfile(user.uid, updates.preacher).catch(console.error);
    }
    
    const payload: any = { ...updates, updatedAt: serverTimestamp() };
    if (updates.sermonDate) {
      payload.sermonDate = Timestamp.fromDate(updates.sermonDate as Date);
    }
    
    return await updateDoc(ref, payload);
  };

  const removeNote = async (docId: string) => {
    if (!user) throw new Error("Must be logged in");
    return await deleteDoc(doc(db, 'notes', docId));
  };

  return { notes, loading, addNote, updateNote, removeNote };
}

export const savePreacherToProfile = async (userId: string, preacherName: string) => {
  if (!preacherName || !preacherName.trim()) return;
  const ref = doc(db, 'userProfiles', userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    const known = data.knownPreachers || [];
    if (!known.includes(preacherName)) {
      await updateDoc(ref, {
        knownPreachers: [...known, preacherName]
      });
    }
  } else {
    // create profile initially if missing
    await setDoc(ref, {
      userId,
      displayName: "User",
      knownPreachers: [preacherName],
      themePreference: "auto"
    });
  }
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'userProfiles', userId));
  return snap.exists() ? (snap.data() as UserProfile) : null;
};
