import { createClient } from '@supabase/supabase-js'

// Clean possible extra quotes the user added in .env
const rawUrl = process.env.SUPABASE_URL || ''
const supabaseUrl = rawUrl.replace(/['"]/g, '')
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars missing: SUPABASE_URL or SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
})

export const LETTERS_BUCKET = 'files'
