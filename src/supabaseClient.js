import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ebbnmjqovpurqdlozqtg.supabase.co'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViYm5tanFvdnB1cnFkbG96cXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwODk2MTYsImV4cCI6MjA4ODY2NTYxNn0.DFqgVAJksguEn-Lop25gcWdfWwz9JlKestqtnVNQ58A'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

