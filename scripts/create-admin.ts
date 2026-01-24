import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'cesafi.webops@gmail.com';
  const password = 'CesafiAdmin2025!';
  const role = 'admin';
  const displayName = 'WebOps Admin';

  console.log(`Checking if user ${email} exists...`);

  // Check if user exists first to avoid error
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const existingUser = users.users.find(u => u.email === email);

  if (existingUser) {
    console.log(`User ${email} already exists (ID: ${existingUser.id}). Updating role...`);
    
    // Update existing user
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        user_metadata: { display_name: displayName },
        app_metadata: { role: role },
        password: password, // Update password to match request
        email_confirm: true
      }
    );

    if (updateError) {
      console.error('Error updating user:', updateError);
    } else {
      console.log('User updated successfully:', updateData.user.id);
      console.log('Role set to:', updateData.user.app_metadata.role);
    }
  } else {
    console.log(`Creating new user ${email}...`);
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName
      },
      app_metadata: {
        role: role
      }
    });

    if (error) {
      console.error('Error creating user:', error);
    } else {
      console.log('User created successfully:', data.user.id);
      console.log('Role set to:', data.user.app_metadata.role);
    }
  }
}

createAdmin().catch(console.error);
