// Vercel Serverless Function: Google Places (v1) photo proxy.
//
// Streams the photo bytes from Google through our own origin so:
//   1. GOOGLE_MAPS_KEY never reaches the browser.
//   2. The request is server-to-server, so referrer / domain restrictions
//      on the API key don't break image loading.
//
// Frontend uses:  /api/place-photo?name=<photoName>&w=800
// Where <photoName> is exactly the `photos[].name` returned by
// places.googleapis.com (e.g. "places/ChIJ.../photos/AeY...").

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const photoName = String(req.query.name || '');
  const widthRaw  = Number(req.query.w || 800);
  const width     = Number.isFinite(widthRaw) ? Math.min(Math.max(widthRaw, 64), 1600) : 800;

  if (!photoName || !photoName.startsWith('places/')) {
    return res.status(400).json({ error: 'name (photo resource name) required' });
  }

  const apiKey = process.env.GOOGLE_MAPS_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_MAPS_KEY not configured' });
  }

  try {
    const upstream = `https://places.googleapis.com/v1/${encodeURI(photoName)}/media?maxWidthPx=${width}&key=${apiKey}&skipHttpRedirect=false`;
    const r = await fetch(upstream);

    if (!r.ok) {
      const body = await r.text();
      return res
        .status(r.status)
        .json({ error: `upstream ${r.status}`, detail: body.slice(0, 400) });
    }

    const ct = r.headers.get('content-type') || 'image/jpeg';
    const buf = Buffer.from(await r.arrayBuffer());

    // Cache for a day at the CDN, 5 minutes in the browser.
    res.setHeader('Content-Type', ct);
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(buf);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'unknown' });
  }
}
