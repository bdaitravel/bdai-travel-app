
import { createClient } from '@supabase/supabase-js';

// Valores proporcionados por el usuario
const supabaseUrl = 'https://slldavgsoxunkphqeamx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRhdmdzb3h1bmtwaHFlYW14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTU2NjEsImV4cCI6MjA4MDEzMTY2MX0.MBOwOjdp4Lgo5i2X2LNvTEonm_CLg9KWo-WcLPDGqXo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isDbReady = () => !!supabase;
