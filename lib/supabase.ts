import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Menghapus sessionStorage agar Supabase kembali menggunakan localStorage (Default: Sesi Permanen)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);