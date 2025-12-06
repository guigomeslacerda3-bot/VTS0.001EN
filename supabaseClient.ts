import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yzqfyorvccdhurhibunx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6cWZ5b3J2Y2NkaHVyaGlidW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NzUxNzAsImV4cCI6MjA4MDQ1MTE3MH0.onY649nt6vdD5Vbqir9E1kRek10QwkuchQXY91KUte0';

export const supabase = createClient(supabaseUrl, supabaseKey);
