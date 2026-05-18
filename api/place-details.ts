// Vercel Serverless Function: Google Places API ile mekan detayı çek
// Query: name (örn. "Eiffel Tower"), lat, lng
// Döner: fotoğraf URL, puan, review sayısı, adres, google maps URL
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { name, lat, lng } = req.query;
  if (!name) {
    return res.status(400).json({ error: 'name parametresi gerekli' });
  }

  const apiKey = process.env.GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_KEY tanımlı değil' });
  }

  try {
    // 1. Text Search ile place bul (location bias varsa kullan)
    const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
    const searchBody: any = {
      textQuery: String(name),
      maxResultCount: 1
    };
    if (lat && lng) {
      searchBody.locationBias = {
        circle: {
          center: { latitude: parseFloat(String(lat)), longitude: parseFloat(String(lng)) },
          radius: 5000
        }
      };
    }

    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos,places.googleMapsUri,places.priceLevel,places.editorialSummary,places.types'
      },
      body: JSON.stringify(searchBody)
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      return res.status(searchRes.status).json({ error: err });
    }

    const data = await searchRes.json();
    const place = data.places?.[0];

    if (!place) {
      return res.status(200).json({ place: null });
    }

    // İlk fotoğraftan media URL oluştur
    let photoUrl: string | null = null;
    if (place.photos && place.photos.length > 0) {
      const photoName = place.photos[0].name;
      // Photo media URL - returns redirect to image
      photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`;
    }

    return res.status(200).json({
      place: {
        id: place.id,
        name: place.displayName?.text || name,
        address: place.formattedAddress,
        rating: place.rating || null,
        reviewCount: place.userRatingCount || 0,
        priceLevel: place.priceLevel || null,
        photoUrl,
        googleMapsUrl: place.googleMapsUri,
        summary: place.editorialSummary?.text || null,
        types: place.types || []
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Bilinmeyen hata' });
  }
}
