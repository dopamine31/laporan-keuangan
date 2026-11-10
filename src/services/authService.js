import { supabase } from '../config/supabase.js';

export const getSession = async () => (await supabase.auth.getSession()).data.session;

export const signIn = async (email, password) => {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

export const signOut = () => supabase.auth.signOut();