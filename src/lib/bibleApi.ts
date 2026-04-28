/**
 * bibleApi.ts
 * Helper functions to fetch verses from api.bible.
 * The API key is sourced from VITE_BIBLE_API_KEY environment variable.
 */

export async function fetchBibleText(query: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_BIBLE_API_KEY;
  if (!apiKey) {
    console.warn('VITE_BIBLE_API_KEY not found. Please add it to .env.local');
    return null;
  }
  
  try {
    const defaultBibleId = '9879dbb7cfe39e4d-01'; // WEB
    const savedBibleId = localStorage.getItem('preferredBibleId');
    const bibleId = savedBibleId || defaultBibleId; 
    
    const url = `https://rest.api.bible/v1/bibles/${bibleId}/search?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: {
        'api-key': apiKey
      }
    });
    
    if (!res.ok) {
      console.warn('api.bible error', res.statusText);
      return null;
    }
    
    const data = await res.json();
    if (data.data?.passages?.length > 0) {
      return data.data.passages[0].content; // The content is typically HTML
    } else if (data.data?.verses?.length > 0) {
      return `<p>${data.data.verses.map((v: any) => v.text).join(' ')}</p>`;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch bible verse:', err);
    return null;
  }
}

