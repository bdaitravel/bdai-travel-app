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
    // Ampliación (ago-2026) — ver AGENTS.md "Mapa de descubrimiento de tours".
    // Mantener en sincronía con scripts/backfill_city_locations.sql,
    // scripts/fix_city_locations_countries.sql y sync-city-location.md.
    ghana:        { name: 'Ghana',          code: 'GH' },
    ethiopia:     { name: 'Ethiopia',       code: 'ET' },
    kazakhstan:   { name: 'Kazakhstan',     code: 'KZ' },
    iraq:         { name: 'Iraq',           code: 'IQ' },
    lebanon:      { name: 'Lebanon',        code: 'LB' },
    philippines:  { name: 'Philippines',    code: 'PH' },
    senegal:      { name: 'Senegal',        code: 'SN' },
    tanzania:     { name: 'Tanzania',       code: 'TZ' },
    qatar:        { name: 'Qatar',          code: 'QA' },
    ecuador:      { name: 'Ecuador',        code: 'EC' },
    cuba:         { name: 'Cuba',           code: 'CU' },
    nepal:        { name: 'Nepal',          code: 'NP' },
    rwanda:       { name: 'Rwanda',         code: 'RW' },
    jamaica:      { name: 'Jamaica',        code: 'JM' },
    malaysia:     { name: 'Malaysia',       code: 'MY' },
    bolivia:      { name: 'Bolivia',        code: 'BO' },
    maldives:     { name: 'Maldives',       code: 'MV' },
    monaco:       { name: 'Monaco',         code: 'MC' },
    uruguay:      { name: 'Uruguay',        code: 'UY' },
    oman:         { name: 'Oman',           code: 'OM' },
    fiji:         { name: 'Fiji',           code: 'FJ' },
    kenya:        { name: 'Kenya',          code: 'KE' },
    bahamas:      { name: 'Bahamas',        code: 'BS' },
    aruba:        { name: 'Aruba',          code: 'AW' },
    panama:       { name: 'Panama',         code: 'PA' },
    cambodia:     { name: 'Cambodia',       code: 'KH' },
    iceland:      { name: 'Iceland',        code: 'IS' },
    latvia:       { name: 'Latvia',         code: 'LV' },
    taiwan:       { name: 'Taiwan',         code: 'TW' },
    estonia:      { name: 'Estonia',        code: 'EE' },
    uzbekistan:   { name: 'Uzbekistan',     code: 'UZ' },
    tunisia:      { name: 'Tunisia',        code: 'TN' },
    zimbabwe:     { name: 'Zimbabwe',       code: 'ZW' },
    lithuania:    { name: 'Lithuania',      code: 'LT' },
    myanmar:      { name: 'Myanmar',        code: 'MM' },
    laos:         { name: 'Laos',           code: 'LA' },
    south_africa: { name: 'South Africa',   code: 'ZA' },
    sri_lanka:    { name: 'Sri Lanka',      code: 'LK' },
    new_zealand:  { name: 'New Zealand',    code: 'NZ' },
    united_states: { name: 'USA',           code: 'US' },
    united_kingdom: { name: 'United Kingdom', code: 'GB' },
    saudi_arabia: { name: 'Saudi Arabia',   code: 'SA' },
    new_caledonia: { name: 'New Caledonia', code: 'NC' },
    czech_republic: { name: 'Czech Republic', code: 'CZ' },
    dominican_republic: { name: 'Dominican Republic', code: 'DO' },
    costa_rica:   { name: 'Costa Rica',     code: 'CR' },
    puerto_rico:  { name: 'Puerto Rico',    code: 'PR' },
    vatican_city: { name: 'Vatican City',   code: 'VA' },
    french_polynesia: { name: 'French Polynesia', code: 'PF' },
    united_arab_emirates: { name: 'UAE',    code: 'AE' },
    papua_new_guinea: { name: 'Papua New Guinea', code: 'PG' },
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
