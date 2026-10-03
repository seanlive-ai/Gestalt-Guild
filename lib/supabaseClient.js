import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase = null;

try {
  if (url && key) {
    supabase = createClient(url, key);
  }
} catch (error) {
  console.warn('Failed to create Supabase client at build time:', error.message);
}

export { supabase };
