/**
 * Script to create a demo account for App Store reviewers
 * Run with: node scripts/create-demo-account.js
 * 
 * Requires environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config({ path: require('path').join(__dirname, '../backend/.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://wqvevludffkemgicrfos.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.error('Please set it in backend/.env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoAccount() {
  const email = 'appreview@focuscircle.app';
  const password = 'Reviewer123!';
  const name = 'App Reviewer';
  
  console.log('🔐 Creating demo account for App Store reviewers...');
  console.log(`Email: ${email}`);
  
  try {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);
    
    if (existingUser) {
      console.log('⚠️  User already exists. Updating password...');
      
      // Update password
      const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password: password,
          user_metadata: {
            name: name
          }
        }
      );
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError);
        return;
      }
      
      console.log('✅ Demo account password updated successfully!');
      console.log(`User ID: ${existingUser.id}`);
      return;
    }
    
    // Create new user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name
      }
    });

    if (authError) {
      console.error('❌ Error creating user:', authError);
      return;
    }

    console.log('✅ Demo account created successfully!');
    console.log(`User ID: ${authData.user.id}`);
    console.log(`Email: ${authData.user.email}`);
    
    // Add sample data (optional)
    console.log('\n📝 Adding sample data...');
    await addSampleData(authData.user.id);
    
    console.log('\n✅ Demo account setup complete!');
    console.log('\n📋 Credentials for App Store Connect:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log('\nAdd these credentials to App Store Connect → App Information → App Review Information → Demo Account');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function addSampleData(userId) {
  try {
    // Add sample ideas
    const { error: ideasError } = await supabase
      .from('ideas')
      .insert([
        {
          user_id: userId,
          text: 'Sample idea 1: This is a test idea for App Store reviewers to explore the app features.',
          created_at: new Date().toISOString()
        },
        {
          user_id: userId,
          text: 'Sample idea 2: Another test idea to demonstrate the categorization feature.',
          created_at: new Date().toISOString()
        },
        {
          user_id: userId,
          text: 'Sample idea 3: Testing semantic search functionality with this example.',
          created_at: new Date().toISOString()
        }
      ]);

    if (ideasError) {
      console.log('⚠️  Could not add sample ideas:', ideasError.message);
    } else {
      console.log('✅ Added 3 sample ideas');
    }

    // Add sample todos
    const today = new Date().toISOString().split('T')[0];
    const { error: todosError } = await supabase
      .from('todos')
      .insert([
        {
          user_id: userId,
          text: 'Sample todo 1: Review app features',
          completed: false,
          date: today,
          created_at: new Date().toISOString()
        },
        {
          user_id: userId,
          text: 'Sample todo 2: Test voice recording',
          completed: false,
          date: today,
          created_at: new Date().toISOString()
        }
      ]);

    if (todosError) {
      console.log('⚠️  Could not add sample todos:', todosError.message);
    } else {
      console.log('✅ Added 2 sample todos');
    }

  } catch (error) {
    console.log('⚠️  Error adding sample data:', error.message);
  }
}

// Run the script
createDemoAccount()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

