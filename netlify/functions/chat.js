exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let userMessage;
  try {
    userMessage = JSON.parse(event.body).message;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!userMessage) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No message provided' }) };
  }

  const SYSTEM_PROMPT = `You are a friendly and knowledgeable assistant for Brodin Construction, a local general contracting company based in Colorado Springs, Colorado.

About Brodin Construction:
- We are a general contractor — we do NOT do full custom home builds from the ground up, and we do NOT do roofing
- Services: Remodels & renovations (kitchens, bathrooms, basements, additions), concrete work (driveways, patios, walkways, retaining walls), decks & fences (wood, composite, vinyl), and pergolas
- Over 15 years experience in Colorado
- Service area: Colorado Springs and surrounding Colorado communities
- Free estimates available
- Phone: (720) 736-6855
- Email: info@brodinconstruction.com
- Hours: Mon–Fri 7am–6pm, Sat 8am–2pm

Your job is to:
1. Answer questions about our services, pricing ranges, timelines, and process
2. Politely let people know we don't do roofing or custom home builds if asked
3. Help qualify leads by asking about their project
4. Encourage them to request a free quote or call us
5. Be friendly, professional, and concise (2-4 sentences max per reply)

For pricing, give honest general ranges (e.g., kitchen remodels $20,000–$80,000+; bathroom remodels $8,000–$30,000+; concrete driveways $3,000–$15,000; decks $8,000–$35,000+).

Always end with a helpful follow-up question or offer to help them start a quote request.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'API error', reply: null })
      };
    }

    const reply = data.content && data.content[0] ? data.content[0].text : null;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message, reply: null })
    };
  }
};
