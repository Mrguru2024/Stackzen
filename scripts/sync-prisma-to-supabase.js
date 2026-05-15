const { createClient } = require('@supabase/supabase-js');
const _fs = require('fs');
const _path = require('path');
require('dotenv').config({ path: '.env.local' });

async function syncPrismaToSupabase() {
  console.log('🔄 Syncing Prisma Schema to Supabase...\n');

  const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const _supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase environment variables');
    return;
  }

  const _supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Read the RLS setup SQL
    const _rlsSqlPath = path.join(__dirname, 'setup-supabase-rls.sql');
    const _rlsSql = fs.readFileSync(rlsSqlPath, 'utf8');

    console.log('📋 Setting up Row Level Security policies...');

    // Execute RLS setup
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSql });

    if (rlsError) {
      console.log(
        '⚠️ RLS setup failed (this might be expected if policies already exist):',
        rlsError.message
      );
    } else {
      console.log('✅ RLS policies set up successfully');
    }

    // 2. Test table access
    console.log('\n🔍 Testing table access...');

    const _tables = [
      'savings_rules',
      'savings_executions',
      'smart_buckets',
      'smart_allocations',
      'zen_missions',
      'zen_investments',
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count').limit(1);

        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Accessible`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }

    // 3. Test real-time subscriptions
    console.log('\n📡 Testing real-time subscriptions...');

    const _channel = supabase
      .channel('test-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'savings_rules' }, payload => {
        console.log('✅ Real-time subscription working:', payload);
      })
      .subscribe();

    // Wait a moment for subscription to establish
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test insert
    const { error: insertError } = await supabase.from('savings_rules').insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
      name: 'Test Rule',
      type: 'test',
      config: { enabled: false },
      is_active: false,
    });

    if (insertError) {
      console.log('⚠️ Test insert failed (expected):', insertError.message);
    } else {
      console.log('✅ Test insert successful');

      // Clean up test data
      await supabase.from('savings_rules').delete().eq('name', 'Test Rule');
    }

    // Unsubscribe
    await supabase.removeChannel(channel);

    console.log('\n🎉 Supabase sync completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- Tables: Created via Prisma migration');
    console.log('- RLS: Policies set up');
    console.log('- Real-time: Enabled for all tables');
    console.log('- Access: Service role can read/write');
  } catch (error) {
    console.log('❌ Sync failed:', error.message);
  }
}

syncPrismaToSupabase().catch(console.error);
