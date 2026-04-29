// Serverless function to fetch Adafruit IO data securely
// This keeps your API key secure on the server side

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get credentials from environment variables
  const AIO_USERNAME = process.env.ADAFRUIT_IO_USERNAME;
  const AIO_KEY = process.env.ADAFRUIT_IO_KEY;

  if (!AIO_USERNAME || !AIO_KEY) {
    return res.status(500).json({ 
      error: 'Adafruit IO credentials not configured' 
    });
  }

  // Get feed name from query parameter
  const { feed } = req.query;

  if (!feed) {
    return res.status(400).json({ 
      error: 'Feed name is required. Use ?feed=feedname' 
    });
  }

  try {
    // Fetch data from Adafruit IO
    const response = await fetch(
      `https://io.adafruit.com/api/v2/${AIO_USERNAME}/feeds/${feed}/data/last`,
      {
        headers: {
          'X-AIO-Key': AIO_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Adafruit IO returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Return the data
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching from Adafruit IO:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data from Adafruit IO',
      message: error.message 
    });
  }
}
