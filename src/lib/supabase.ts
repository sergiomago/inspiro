import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ksrcwjszmoywsofhlgmz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzcmN3anN6bW95d3NvZmhsZ216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MDg4OTYsImV4cCI6MjA0ODI4NDg5Nn0.1P1ttGsdBKFdFMcuBYL9GbUkBY6K4-JRZqwHag2DAA0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)