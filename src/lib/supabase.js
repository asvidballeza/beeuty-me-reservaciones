import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const llaveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configurado = Boolean(url && llaveAnonima);
export const supabase = configurado ? createClient(url, llaveAnonima) : null;
