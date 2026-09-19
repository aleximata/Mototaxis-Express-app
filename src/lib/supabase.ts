import { createClient } from '@supabase/supabase-js'

// Credenciales fijas de respaldo para que Netlify y local nunca fallen
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zgjkbxmfqiyzymgqidpt.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pDWyAwvgpMKZ76V9m4pFlA_uRj3mWTa'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)