import { _prisma } from '../lib/prisma.ts';

async function testGigsAPI() {
  try {
    console.log('🧪 Testing Gigs API...\n');

    // 1. Test GET request
    console.log('📥 Testing GET /api/gigs...');
    const _getResponse = await fetch('http://localhost:3000/api/gigs');
    const _getData = await getResponse.json();
    console.log('GET Response:', JSON.stringify(getData, null, 2), '\n');

    // 2. Test POST request
    console.log('📝 Testing POST /api/gigs...');
    const _newGig = {
      title: 'Test Gig',
      description: 'This is a test gig',
      category: 'Web Development',
      duration: '1 week',
      budget: 1000,
      rating: 4.5,
      postedBy: 'test-user',
      skills: ['JavaScript', 'React'],
      isProOnly: false,
    };

    const _postResponse = await fetch('http://localhost:3000/api/gigs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGig),
    });
    const _postData = await postResponse.json();
    console.log('POST Response:', JSON.stringify(postData, null, 2), '\n');

    // 3. Test PUT request
    if (postData.id) {
      console.log('🔄 Testing PUT /api/gigs...');
      const _updatedGig = {
        ...newGig,
        id: postData.id,
        title: 'Updated Test Gig',
        budget: 1500,
      };

      const _putResponse = await fetch('http://localhost:3000/api/gigs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGig),
      });
      const _putData = await putResponse.json();
      console.log('PUT Response:', JSON.stringify(putData, null, 2), '\n');

      // 4. Test DELETE request
      console.log('🗑️ Testing DELETE /api/gigs...');
      const _deleteResponse = await fetch('http://localhost:3000/api/gigs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postData.id }),
      });
      const _deleteData = await deleteResponse.json();
      console.log('DELETE Response:', JSON.stringify(deleteData, null, 2), '\n');
    }

    // 5. Test GET with filters
    console.log('🔍 Testing GET /api/gigs with filters...');
    const _filteredResponse = await fetch(
      'http://localhost:3000/api/gigs?category=Web%20Development&minBudget=500&maxBudget=2000'
    );
    const _filteredData = await filteredResponse.json();
    console.log('Filtered GET Response:', JSON.stringify(filteredData, null, 2), '\n');
  } catch (error) {
    console.error('❌ Error testing Gigs API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGigsAPI();
