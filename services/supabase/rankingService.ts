import { LeaderboardEntry, TravelerRank, Badge } from '../../types';
import { supabase } from './client';

interface ProfileRankingRow {
    id: string;
    username: string;
    miles: number;
    avatar: string;
    country: string;
    badges: Badge[];
    rank: string;
}

export const calculateTravelerRank = (miles: number): TravelerRank => {
    if (miles <= 250) return 'ZERO';
    if (miles <= 1200) return 'SCOUT';
    if (miles <= 4000) return 'ROVER';
    if (miles <= 10000) return 'TITAN';
    return 'ZENITH';
};

export const getGlobalRanking = async (): Promise<LeaderboardEntry[]> => {
    try {
        const { data } = await supabase
            .from('profiles')
            .select('id, username, miles, avatar, country, badges, rank')
            .order('miles', { ascending: false })
            .limit(50);
        return (data || []).map((d: ProfileRankingRow, i: number) => ({
            ...d,
            rank: i + 1,
            name: d.username || 'Traveler',
            travelerRank: d.rank as TravelerRank
        }));
    } catch (e) { return []; }
};