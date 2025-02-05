
export interface PricingTier {
  name: string;
  submissions: number;
  minAdds: number;
  maxAdds: number;
  price: number;
  discount: number;
  popular?: boolean;
  features: string[];
  vinylImage: string;
  priceId: string;
}

export interface SelectedTrack {
  title: string;
  artist: string;
  id: string;
  artistId: string;
  genre?: string;
  artworkUrl?: string;
}
