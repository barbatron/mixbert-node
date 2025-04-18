import { TidalApiClient, TidalTrackSearchResult } from '../types';

export async function searchTidalTrack(client: TidalApiClient, query: string): Promise<TidalTrackSearchResult[]> {
  const { data, error } = await client.GET('/searchresults/{id}', {
    params: {
      path: { id: query },
      query: { countryCode: 'SE', include: ['tracks'], limit: 1000 },
    },
  });
  
  console.log("Tidal search response:", {data, error});

  if (error) {
    console.error('Error searching Tidal', error);
    throw new Error(`Error searching Tidal: ${error}`);
  }
  const tracks = (data?.included?.filter(i => i.type == 'TRACK') || []) as TidalTrackSearchResult[];
  return tracks;
}
