export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/images/search?query=...
// Searches for images using Unsplash API (or fallback)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');

    if (!query || !query.trim()) {
      return NextResponse.json({ message: 'Query is required' }, { status: 400 });
    }

    const searchTerm = encodeURIComponent(query.trim());
    
    // Try Unsplash API first (if API key is available)
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (unsplashAccessKey) {
      try {
        const unsplashRes = await fetch(
          `https://api.unsplash.com/search/photos?query=${searchTerm}&per_page=12&orientation=landscape`,
          {
            headers: {
              'Authorization': `Client-ID ${unsplashAccessKey}`,
            },
          }
        );

        if (unsplashRes.ok) {
          const unsplashData = await unsplashRes.json();
          const results = unsplashData.results?.map((photo: any, index: number) => ({
            id: photo.id || `unsplash-${index}`,
            url: photo.urls?.regular || photo.urls?.full,
            thumbnail: photo.urls?.thumb || photo.urls?.small,
            description: photo.description || photo.alt_description,
          })) || [];
          
          if (results.length > 0) {
            return NextResponse.json({ images: results }, { status: 200 });
          }
        }
      } catch (err) {
        console.warn('Unsplash API error, using fallback:', err);
      }
    }

    // Fallback: Use Pexels API (if API key is available)
    const pexelsApiKey = process.env.PEXELS_API_KEY;
    
    if (pexelsApiKey) {
      try {
        const pexelsRes = await fetch(
          `https://api.pexels.com/v1/search?query=${searchTerm}&per_page=12&orientation=landscape`,
          {
            headers: {
              'Authorization': pexelsApiKey,
            },
          }
        );

        if (pexelsRes.ok) {
          const pexelsData = await pexelsRes.json();
          const results = pexelsData.photos?.map((photo: any, index: number) => ({
            id: photo.id?.toString() || `pexels-${index}`,
            url: photo.src?.large || photo.src?.original,
            thumbnail: photo.src?.medium || photo.src?.small,
            description: photo.alt || '',
          })) || [];
          
          if (results.length > 0) {
            return NextResponse.json({ images: results }, { status: 200 });
          }
        }
      } catch (err) {
        console.warn('Pexels API error, using fallback:', err);
      }
    }

    // Fallback: Try Pixabay API (free, no key needed for basic usage, but limited)
    // Note: Pixabay requires API key for production, but we can try without it first
    try {
      const pixabayKey = process.env.PIXABAY_API_KEY;
      if (pixabayKey) {
        const pixabayRes = await fetch(
          `https://pixabay.com/api/?key=${pixabayKey}&q=${searchTerm}&image_type=photo&category=food&per_page=12&safesearch=true`
        );
        
        if (pixabayRes.ok) {
          const pixabayData = await pixabayRes.json();
          if (pixabayData.hits && pixabayData.hits.length > 0) {
            const results = pixabayData.hits.map((hit: any, index: number) => ({
              id: hit.id?.toString() || `pixabay-${index}`,
              url: hit.largeImageURL || hit.webformatURL,
              thumbnail: hit.previewURL || hit.webformatURL,
              description: hit.tags || '',
            }));
            return NextResponse.json({ images: results }, { status: 200 });
          }
        }
      }
    } catch (err) {
      console.warn('Pixabay API error, using final fallback:', err);
    }

    // Final fallback: Use Unsplash source URLs with better randomization
    // Translate Hebrew food terms to English for better results
    const translations: Record<string, string> = {
      'פיצה': 'pizza',
      'המבורגר': 'burger',
      'סלט': 'salad',
      'פסטה': 'pasta',
      'סושי': 'sushi',
      'סטייק': 'steak',
      'דג': 'fish',
      'עוף': 'chicken',
      'בשר': 'meat',
      'מנה': 'dish',
      'אוכל': 'food',
    };
    
    let searchQuery = query.trim().toLowerCase();
    // Try to translate Hebrew to English
    for (const [hebrew, english] of Object.entries(translations)) {
      if (searchQuery.includes(hebrew)) {
        searchQuery = searchQuery.replace(hebrew, english);
        break;
      }
    }
    
    const encodedQuery = encodeURIComponent(searchQuery);
    const fallbackResults = Array.from({ length: 12 }, (_, i) => {
      // Use timestamp and index for better randomization
      const timestamp = Date.now();
      const url = `https://source.unsplash.com/800x600/?${encodedQuery}&sig=${timestamp}-${i}`;
      
      return {
        id: `fallback-${i}`,
        url: url,
        thumbnail: url.replace('800x600', '300x200'),
        description: '',
      };
    });

    return NextResponse.json({ images: fallbackResults }, { status: 200 });
  } catch (error: any) {
    console.error('Error searching images', error);
    return NextResponse.json(
      { message: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}

