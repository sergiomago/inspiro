import { createClient } from '@supabase/supabase-js'

// Use the actual Supabase project URL and anon key
const supabaseUrl = 'https://ksrcwjszmoywsofhlgmz.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)