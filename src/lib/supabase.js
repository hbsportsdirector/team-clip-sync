// src/lib/supabase.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hsvfdsgfmvhigwditkpn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdmZkc2dmbXZoaWd3ZGl0a3BuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NTY1NDYsImV4cCI6MjA2MTUzMjU0Nn0.I8C-NLAjw7GBHLOoew0-ZHlXOhFEAISJnpoCoL_AzpEPUBLIC_ANON_KEY'; // Replace this with your actual anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
