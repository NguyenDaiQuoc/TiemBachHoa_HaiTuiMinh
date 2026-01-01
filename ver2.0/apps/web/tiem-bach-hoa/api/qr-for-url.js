// Returns a QR image URL for a given payment URL using Google Chart API
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const { url } = req.query || {};
    if (!url) return res.status(400).json({ error: 'Missing url' });
    const encoded = encodeURIComponent(String(url));
    // Google Chart API QR code
    const qr = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encoded}`;
    return res.status(200).json({ qr });
  } catch (err) {
    console.error('qr-for-url', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
