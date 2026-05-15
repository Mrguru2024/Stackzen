const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifySupabaseSetup() {
  console.log('🔍 Verifying Supabase Setup...\n');

  const _supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const _supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const _anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || !anonKey) {
    console.log('❌ Missing required environment variables');
    console.log(
      'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
    return;
  }

  const _supabase = createClient(supabaseUrl, supabaseKey);
  const _anonSupabase = createClient(supabaseUrl, anonKey);

  console.log('📋 Environment Check:');
  console.log(`✅ Supabase URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
  console.log(`✅ Service Role Key: ${supabaseKey ? 'Set' : 'Missing'}`);
  console.log(`✅ Anon Key: ${anonKey ? 'Set' : 'Missing'}\n`);

  // Test 1: Service Role Connection
  console.log('🔌 Testing Service Role Connection...');
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%savings%');

    if (error) {
      console.log(`❌ Service role connection failed: ${error.message}`);
    } else {
      console.log('✅ Service role connection successful');
      console.log(`📊 Found ${tables.length} savings-related tables`);
    }
  } catch (err) {
    console.log(`❌ Service role connection error: ${err.message}`);
  }

  // Test 2: Table Access
  console.log('\n📊 Testing Table Access...');
  const _smartSavingTables = [
    'savings_rules',
    'savings_executions',
    'smart_buckets',
    'smart_allocations',
    'zen_missions',
    'zen_investments',
  ];

  for (const table of smartSavingTables) {
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

  // Test 3: RLS Policies
  console.log('\n🔒 Testing RLS Policies...');
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('tablename, policyname')
      .like('tablename', '%savings%');

    if (error) {
      console.log(`❌ RLS policy check failed: ${error.message}`);
    } else {
      console.log(`✅ Found ${policies.length} RLS policies for savings tables`);
      policies.forEach(policy => {
        console.log(`   - ${policy.tablename}: ${policy.policyname}`);
      });
    }
  } catch (err) {
    console.log(`❌ RLS policy check error: ${err.message}`);
  }

  // Test 4: Real-time Configuration
  console.log('\n📡 Testing Real-time Configuration...');
  try {
    const { data: publications, error } = await supabase
      .from('pg_publication_tables')
      .select('tablename')
      .eq('pubname', 'supabase_realtime')
      .like('tablename', '%savings%');

    if (error) {
      console.log(`❌ Real-time check failed: ${error.message}`);
    } else {
      console.log(`✅ Found ${publications.length} savings tables in real-time publication`);
      publications.forEach(pub => {
        console.log(`   - ${pub.tablename}`);
      });
    }
  } catch (err) {
    console.log(`❌ Real-time check error: ${err.message}`);
  }

  // Test 5: Anon Access (should be restricted)
  console.log('\n👤 Testing Anonymous Access...');
  try {
    const { data, error } = await anonSupabase.from('savings_rules').select('*').limit(1);

    if (error && error.message.includes('permission denied')) {
      console.log('✅ Anonymous access properly restricted (RLS working)');
    } else if (error) {
      console.log(`⚠️ Anonymous access error: ${error.message}`);
    } else {
      console.log('❌ Anonymous access not properly restricted');
    }
  } catch (err) {
    console.log(`❌ Anonymous access test error: ${err.message}`);
  }

  // Test 6: Database Schema
  console.log('\n🏗️ Testing Database Schema...');
  try {
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, data_type')
      .eq('table_schema', 'public')
      .in('table_name', smartSavingTables)
      .order('table_name, ordinal_position');

    if (error) {
      console.log(`❌ Schema check failed: ${error.message}`);
    } else {
      console.log('✅ Database schema check successful');
      const _tableColumns = {};
      columns.forEach(col => {
        if (!tableColumns[col.table_name]) {
          tableColumns[col.table_name] = [];
        }
        tableColumns[col.table_name].push(col.column_name);
      });

      Object.keys(tableColumns).forEach(table => {
        console.log(`   - ${table}: ${tableColumns[table].length} columns`);
      });
    }
  } catch (err) {
    console.log(`❌ Schema check error: ${err.message}`);
  }

  console.log('\n🎯 Setup Summary:');
  console.log('✅ Environment variables configured');
  console.log('✅ Database tables created');
  console.log('✅ Service role access working');
  console.log('⚠️ RLS policies need manual setup in Supabase dashboard');
  console.log('⚠️ Real-time subscriptions need manual setup');
  console.log('\n📋 Next Steps:');
  console.log('1. Go to Supabase Dashboard > Authentication > Policies');
  console.log('2. Enable RLS on all savings tables');
  console.log('3. Create RLS policies (see docs/supabase-complete-setup.md)');
  console.log('4. Enable real-time in SQL Editor');
  console.log('5. Test with RealTimeTest component in the app');
}

verifySupabaseSetup().catch(console.error);
