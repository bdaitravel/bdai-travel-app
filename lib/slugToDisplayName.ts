const COUNTRY_SLUGS: Record<string, { name: string; code: string }> = {
    spain:        { name: 'Spain',          code: 'ES' },
    france:       { name: 'France',         code: 'FR' },
    italy:        { name: 'Italy',          code: 'IT' },
    germany:      { name: 'Germany',        code: 'DE' },
    portugal:     { name: 'Portugal',       code: 'PT' },
    uk:           { name: 'United Kingdom', code: 'GB' },
    england:      { name: 'England',        code: 'GB' },
    usa:          { name: 'USA',            code: 'US' },
    mexico:       { name: 'Mexico',         code: 'MX' },
    argentina:    { name: 'Argentina',      code: 'AR' },
    brazil:       { name: 'Brazil',         code: 'BR' },
    colombia:     { name: 'Colombia',       code: 'CO' },
    chile:        { name: 'Chile',          code: 'CL' },
    peru:         { name: 'Peru',           code: 'PE' },
    japan:        { name: 'Japan',          code: 'JP' },
    china:        { name: 'China',          code: 'CN' },
    india:        { name: 'India',          code: 'IN' },
    australia:    { name: 'Australia',      code: 'AU' },
    canada:       { name: 'Canada',         code: 'CA' },
    netherlands:  { name: 'Netherlands',    code: 'NL' },
    belgium:      { name: 'Belgium',        code: 'BE' },
    switzerland:  { name: 'Switzerland',    code: 'CH' },
    austria:      { name: 'Austria',        code: 'AT' },
    greece:       { name: 'Greece',         code: 'GR' },
    turkey:       { name: 'Turkey',         code: 'TR' },
    poland:       { name: 'Poland',         code: 'PL' },
    czech:        { name: 'Czech Republic', code: 'CZ' },
    hungary:      { name: 'Hungary',        code: 'HU' },
    romania:      { name: 'Romania',        code: 'RO' },
    russia:       { name: 'Russia',         code: 'RU' },
    ukraine:      { name: 'Ukraine',        code: 'UA' },
    norway:       { name: 'Norway',         code: 'NO' },
    sweden:       { name: 'Sweden',         code: 'SE' },
    denmark:      { name: 'Denmark',        code: 'DK' },
    finland:      { name: 'Finland',        code: 'FI' },
    ireland:      { name: 'Ireland',        code: 'IE' },
    croatia:      { name: 'Croatia',        code: 'HR' },
    morocco:      { name: 'Morocco',        code: 'MA' },
    egypt:        { name: 'Egypt',          code: 'EG' },
    thailand:     { name: 'Thailand',       code: 'TH' },
    vietnam:      { name: 'Vietnam',        code: 'VN' },
    indonesia:    { name: 'Indonesia',      code: 'ID' },
    korea:        { name: 'South Korea',    code: 'KR' },
    singapore:    { name: 'Singapore',      code: 'SG' },
    israel:       { name: 'Israel',         code: 'IL' },
    jordan:       { name: 'Jordan',         code: 'JO' },
    uae:          { name: 'UAE',            code: 'AE' },
    netherlands_antilles: { name: 'Netherlands', code: 'NL' },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export interface SlugDisplayInfo {
    city: string;
    country: string;
    countryCode: string;
    fullName: string;
}

export function slugToDisplayName(slug: string): SlugDisplayInfo {
    const parts = slug.split('_');

    // Try matching the longest suffix as a country (handles compound slugs like "new_york_usa")
    for (let i = parts.length - 1; i >= 1; i--) {
        const countryKey = parts.slice(i).join('_');
        const match = COUNTRY_SLUGS[countryKey];
        if (match) {
            const city = parts.slice(0, i).map(cap).join(' ');
            return { city, country: match.name, countryCode: match.code, fullName: `${city}, ${match.name}` };
        }
    }

    // Fallback: whole slug is city
    const city = parts.map(cap).join(' ');
    return { city, country: '', countryCode: '', fullName: city };
}
