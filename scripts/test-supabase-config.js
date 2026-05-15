const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testSupabaseConfig() {
  console.log('🔧 Testing Supabase Configuration...\n');

  // Check environment variables
  const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const _supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const _anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('📋 Environment Variables:');
  console.log(`✅ Supabase URL: ${supabaseUrl ? 'Set' : '❌ Missing'}`);
  console.log(`✅ Service Role Key: ${supabaseKey ? 'Set' : '❌ Missing'}`);
  console.log(`✅ Anon Key: ${anonKey ? 'Set' : '❌ Missing'}`);
  console.log(
    `✅ Database Choice: ${process.env.USE_SUPABASE_FOR_SMART_SAVING === 'true' ? 'Supabase' : 'Prisma'}\n`
  );

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing required Supabase environment variables');
    return;
  }

  try {
    // Test Supabase connection
    const _supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔌 Testing Supabase Connection...');

    // Test a simple query
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      console.log('❌ Supabase connection failed:', error.message);

      if (error.message.includes('relation "users" does not exist')) {
        console.log(
          "\n💡 The users table doesn't exist yet. This is normal if you haven't set up the Supabase tables."
        );
        console.log(
          '📚 You can create the tables using Prisma migrations or manually in Supabase.'
        );
      }
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('✅ Database is accessible');
    }
  } catch (error) {
    console.log('❌ Failed to connect to Supabase:', error.message);
  }

  console.log('\n🎯 Configuration Summary:');
  console.log(`- Development: ${process.env.NODE_ENV === 'development' ? 'Prisma' : 'Supabase'}`);
  console.log(
    `- Smart Saving: ${process.env.USE_SUPABASE_FOR_SMART_SAVING === 'true' ? 'Supabase' : 'Prisma'}`
  );
  console.log(`- Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Missing'}`);
}

testSupabaseConfig().catch(console.error);
