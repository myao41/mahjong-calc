import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vqokeeuzfbnfmbjdeeou.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxb2tlZXV6ZmJuZm1iamRlZW91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTMzMDksImV4cCI6MjA5NTM2OTMwOX0.7dFYBjN7VIYkYVI_oTycFCDzzeQmOj65v-T_FAmLTao';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
