// Vercel Serverless Function: gerçek otel arama
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const {
    dest_id,
    dest_type = 'city',
    checkin_date,
    checkout_date,
    adults_number = '2',
    room_number = '1',
    children_number,
    children_ages,
    currency = 'USD',
    order_by = 'popularity',
    max_price
  } = req.query;

  if (!dest_id || !checkin_date || !checkout_date) {
    return res.status(400).json({
      error: 'dest_id, checkin_date ve checkout_date zorunlu'
    });
  }

  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key yapılandırılmamış' });
  }

  try {
    const params = new URLSearchParams({
      dest_id: String(dest_id),
      dest_type: String(dest_type),
      checkin_date: String(checkin_date),
      checkout_date: String(checkout_date),
      adults_number: String(adults_number),
      room_number: String(room_number),
      filter_by_currency: String(currency),
      order_by: String(order_by),
      locale: 'en-gb',
      units: 'metric',
      include_adjacency: 'true'
    });

    if (children_number) params.append('children_number', String(children_number));
    if (children_ages) params.append('children_ages', String(children_ages));

    const url = `https://booking-com.p.rapidapi.com/v1/hotels/search?${params.toString()}`;
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
    let results = data.result || [];

    // Max fiyat filtresi (client-side, API'de yok)
    if (max_price) {
      const maxP = parseFloat(String(max_price));
      results = results.filter((h: any) => h.min_total_price <= maxP);
    }

    // İlk 10 sonucu sadeleştir
    const simplified = results.slice(0, 10).map((h: any) => ({
      hotel_id: h.hotel_id,
      name: h.hotel_name,
      address: h.address,
      city: h.city,
      country: h.country_trans,
      district: h.district,
      stars: h.class,
      review_score: h.review_score,
      review_score_word: h.review_score_word,
      review_nr: h.review_nr,
      price_total: h.min_total_price,
      price_per_night: h.composite_price_breakdown?.gross_amount_per_night?.value,
      currency: h.currencycode,
      image: h.max_1440_photo_url || h.main_photo_url,
      type: h.accommodation_type_name,
      room_msg: h.urgency_room_msg,
      distance_to_center: h.distance_to_cc_formatted,
      latitude: h.latitude,
      longitude: h.longitude,
      booking_url: h.url,
      free_cancellation: h.is_free_cancellable === 1,
      breakfast_included: h.hotel_include_breakfast === 1
    }));

    return res.status(200).json({
      total_count: data.count || 0,
      hotels: simplified
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Bilinmeyen hata' });
  }
}
