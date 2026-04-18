import { LeaderboardEntry, TravelerRank } from '../../types';
import { supabase } from './client';

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
    return (data || []).map((d: any, i: number) => ({ 
      ...d, 
      rank: i + 1, 
      name: d.username || 'Traveler',
      travelerRank: d.rank as TravelerRank
    }));
  } catch (e) { return []; }
};
