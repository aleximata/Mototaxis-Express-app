import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zgjkbxmfqiyzymgqidpt.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_pDWyAwvgpMKZ76V9m4pFlA_uRj3mWTa'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Faltan las credenciales de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)