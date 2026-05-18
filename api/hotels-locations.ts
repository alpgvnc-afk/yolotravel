// Vercel Serverless Function: şehir/lokasyon arama
// Frontend'den çağrılır, RapidAPI'ye proxy yapar
export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { name } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'name parametresi gerekli' });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key yapılandırılmamış' });
  }

  try {
    const url = `https://booking-com.p.rapidapi.com/v1/hotels/locations?name=${encodeURIComponent(String(name))}&locale=en-gb`;
    const response = await fetch(url, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'booking-com.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    // Sadece şehir tipindekileri ön plana çıkar
    const simplified = (Array.isArray(data) ? data : []).slice(0, 5).map((loc: any) => ({
      dest_id: loc.dest_id,
      dest_type: loc.dest_type,
      name: loc.name,
      city_name: loc.city_name,
      country: loc.country,
      label: loc.label,
      latitude: loc.latitude,
      longitude: loc.longitude,
      nr_hotels: loc.nr_hotels,
      image_url: loc.image_url
    }));

    return res.status(200).json({ locations: simplified });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Bilinmeyen hata' });
  }
}
