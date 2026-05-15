// FinGPT API provider for StackZen
// Update the API_URL and API_KEY with your FinGPT deployment details

export async function callFinGPT(prompt: string): Promise<string> {
  const API_URL =
    process.env.FINGPT_API_URL || 'https://your-fingpt-endpoint.com/v1/chat/completions';
  const API_KEY = process.env.FINGPT_API_KEY || 'YOUR_FINGPT_API_KEY';

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'fingpt-4', // or your deployed model name
      messages: [
        { role: 'system', content: 'You are a financial expert AI.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    throw new Error(`FinGPT API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  // Adjust this depending on your FinGPT API response format
  return data.choices?.[0]?.message?.content || '';
}
