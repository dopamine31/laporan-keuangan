import { supabase } from '../config/supabase.js';

// Akun tunggal. PIN 6 angka = password akun ini di Supabase.
// Ubah EMAIL kalau akunmu memakai email lain.
const EMAIL = 'email@email.com';

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const signInPin = async (pin) => {
  const { error } = await supabase.auth.signInWithPassword({ email: EMAIL, password: pin });
  if (error) throw error;
};

export const signOut = () => supabase.auth.signOut();
