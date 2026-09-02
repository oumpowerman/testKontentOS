import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://xgsvxgsrasznszvpysat.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase URL or Key");
  process.exit(1);
}

// Create client using the standard anon key (will be authenticated once signed in)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tempEmail = 'seed-helper-temp@juijui-app.com';
const tempPassword = 'TemporarySeedPassword123!';

const items = [
  { type: 'WORK_CONFIG', key: 'ENABLE_FOUR_STAGE_LATE', label: 'true', color: '', is_active: true, sort_order: 15 },
  { type: 'WORK_CONFIG', key: 'LATE_STAGE1_MAX', label: '5', color: '', is_active: true, sort_order: 16 },
  { type: 'WORK_CONFIG', key: 'LATE_STAGE2_MAX', label: '30', color: '', is_active: true, sort_order: 17 },
  { type: 'WORK_CONFIG', key: 'LATE_STAGE3_MAX', label: '60', color: '', is_active: true, sort_order: 18 },
  { type: 'WORK_CONFIG', key: 'LATE_STAGE4_BASE_HP', label: '300', color: '', is_active: true, sort_order: 19 },
  { type: 'WORK_CONFIG', key: 'LATE_HP_PER_MINUTE', label: '1', color: '', is_active: true, sort_order: 20 },
];

async function run() {
  console.log(`🔑 Attempting to sign in with temporary user: ${tempEmail}`);
  
  let { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: tempEmail,
    password: tempPassword,
  });

  if (authError) {
    console.log(`⚠️ Sign-in failed (possibly user doesn't exist yet). Attempting to sign up...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: tempEmail,
      password: tempPassword,
      options: {
        data: {
          full_name: 'Database Seeder Bot',
          position: 'ADMIN',
        }
      }
    });

    if (signUpError) {
      console.error("❌ Sign-up failed:", signUpError);
      process.exit(1);
    }

    console.log("✅ Sign-up successful. Attempting to sign in again...");
    const retryAuth = await supabase.auth.signInWithPassword({
      email: tempEmail,
      password: tempPassword,
    });

    if (retryAuth.error) {
      console.error("❌ Retry sign-in failed:", retryAuth.error);
      process.exit(1);
    }
    
    authData = retryAuth.data;
  }

  console.log("✅ Authenticated successfully! User ID:", authData.user?.id);

  console.log("🌱 Seeding 4-Stage Late Rules into master_options...");
  for (const item of items) {
    const { data, error } = await supabase
      .from('master_options')
      .upsert(item, { onConflict: 'type,key' })
      .select();
    if (error) {
      console.error(`❌ Error inserting/updating ${item.key}:`, error);
    } else {
      console.log(`✅ Successfully seeded ${item.key}:`, data);
    }
  }

  console.log("🏁 Seeding process finished. Signing out...");
  await supabase.auth.signOut();
}

run();
