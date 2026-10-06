import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  const email = 'admin@ignisia.tech';
  const password = 'IncubexAdmin2026!';
  
  console.log(`Attempting to sign up ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Success! User created.');
    console.log('User ID:', data?.user?.id);
    if (data.session === null) {
      console.log('\nNOTE: Email confirmation is enabled on your Supabase project.');
      console.log('To log in immediately, go to your Supabase Dashboard -> Authentication -> Users');
      console.log('and manually confirm the email address, or disable email confirmations.');
    }
  }
}

createAdmin();
