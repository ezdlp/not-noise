
interface LocationInfo {
  isEU: boolean;
  country?: string;
}

const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

export const getUserLocation = async (): Promise<LocationInfo> => {
  try {
    // Use our Supabase edge function instead of external API
    const { data, error } = await fetch('/api/get-location').then(res => res.json());
    
    if (error) throw new Error(error.message);
    
    return {
      isEU: EU_COUNTRIES.includes(data.country_code),
      country: data.country_code
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    // Default to showing EU consent (safer option)
    return {
      isEU: true
    };
  }
};
