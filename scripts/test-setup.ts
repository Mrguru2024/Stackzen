import { _prisma } from '../lib/prisma.ts';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

async function testSetup() {
  console.log('🧪 Starting Prisma + Supabase integration tests...\n');

  try {
    // 1. Test Supabase Auth (Service Role)
    console.log('1️⃣ Testing Supabase Service Role...');
    const _supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const {
      data: { users },
      error: authError,
    } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw new Error(`Auth Error: ${authError.message}`);
    }
    console.log('✅ Supabase Service Role working, found users:', users.length, '\n');

    // 2. Create a test user if none exist
    let testUserId: string;
    if (users.length === 0) {
      console.log('2️⃣ Creating a test user in Supabase Auth...');
      const {
        data: { user },
        error: createUserError,
      } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'password123',
        email_confirm: true,
      });
      if (createUserError) {
        throw new Error(`Failed to create test user: ${createUserError.message}`);
      }
      testUserId = user.id;
      console.log('✅ Test user created in Supabase Auth:', testUserId, '\n');
    } else {
      testUserId = users[0].id;
      console.log('2️⃣ Using existing test user:', testUserId, '\n');
    }

    // 3. Ensure the test user exists in Prisma User table
    console.log('3️⃣ Ensuring test user exists in Prisma User table...');
    const _prismaUser = await prisma.user.upsert({
      where: { id: testUserId },
      update: {},
      create: {
        id: testUserId,
        email: 'test@example.com',
      },
    });
    console.log('✅ Prisma User table updated:', prismaUser, '\n');

    // 4. Test Prisma Connection
    console.log('4️⃣ Testing Prisma Connection...');
    await prisma.$connect();
    console.log('✅ Prisma Connection successful\n');

    // 5. Test Transaction Creation
    console.log('5️⃣ Testing Transaction Creation...');
    const _testTransaction = await prisma.transaction.create({
      data: {
        userId: testUserId,
        amount: 100,
        type: 'test',
        category: 'test',
        description: 'Test transaction',
      },
    });
    console.log('✅ Transaction created:', testTransaction);

    // 6. Test Transaction Retrieval
    console.log('\n6️⃣ Testing Transaction Retrieval...');
    const _transactions = await prisma.transaction.findMany({
      where: { userId: testUserId },
    });
    console.log('✅ Retrieved transactions:', transactions);

    // 7. Cleanup
    console.log('\n7️⃣ Cleaning up test data...');
    await prisma.transaction.deleteMany({
      where: { userId: testUserId, type: 'test' },
    });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All tests passed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testSetup();
