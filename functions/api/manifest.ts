export const onRequestGet: PagesFunction = async () => {
  try {
    // Try to fetch from CDN first
    const response = await fetch('https://gf.cdn.gufolabs.com/latest/manifest.json');
    if (response.ok) {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
    throw new Error(`CDN returned ${response.status}`);
  } catch (error) {
    console.warn('Failed to fetch manifest from CDN, falling back to local:', error);
    
    // Fallback to local file
    try {
      const localResponse = await fetch(new URL('/manifest.json', 'https://placeholder.local'));
      if (localResponse.ok) {
        const data = await localResponse.json();
        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    } catch (fallbackError) {
      console.error('Failed to load local manifest:', fallbackError);
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to load manifest from both CDN and local storage' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
