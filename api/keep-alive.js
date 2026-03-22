export default async function handler(req, res) {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return res.status(500).json({ error: 'Missing environment variables' });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/platform_settings?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to ping Supabase: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return res.status(200).json({ success: true, timestamp: new Date().toISOString(), data });
  } catch (error) {
    console.error('Keep-alive error:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
