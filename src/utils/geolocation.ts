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
    const response = await fetch('https://api.ipapi.com/api/check?access_key=YOUR_API_KEY');
    const data = await response.json();
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