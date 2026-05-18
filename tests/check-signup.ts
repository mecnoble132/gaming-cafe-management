import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
  const email = `check_${Date.now()}@test.com`;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'TestPassword123!',
  });
  console.log('SignUp Result:', { 
    user: data.user ? { id: data.user.id, email: data.user.email, confirmed_at: data.user.confirmed_at } : null, 
    session: data.session ? 'session present' : 'no session',
    error 
  });
}
run();
