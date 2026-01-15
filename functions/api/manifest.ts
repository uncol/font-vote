export const onRequestGet: PagesFunction = async () => {
  try {
    const response = await fetch('https://gf.cdn.gufolabs.com/latest/manifest.json');
    if (!response.ok) {
      throw new Error(`CDN returned ${response.status}`);
    }
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Failed to fetch manifest from CDN:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to load manifest from CDN' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
