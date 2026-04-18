import { UserProfile, APP_BADGES, Badge } from '../../types';
import { supabase } from './client';
import { calculateTravelerRank } from './rankingService';

export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').ilike('email', email).maybeSingle();
    if (error) {
      console.error("Error fetching profile from Supabase:", error);
      throw error;
    }
    if (!data) return null;
    return {
      id: data.id, email: data.email, username: data.username || email.split('@')[0],
      firstName: data.first_name || '', lastName: data.last_name || '',
      name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      avatar: data.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
      miles: data.miles || 0, language: data.language || 'es', rank: data.rank || 'Turist',
      isLoggedIn: true, culturePoints: data.culture_points || 0, foodPoints: data.food_points || 0,
      photoPoints: data.photo_points || 0, historyPoints: data.history_points || 0,
      naturePoints: data.nature_points || 0, artPoints: data.art_points || 0,
      archPoints: data.arch_points || 0, interests: data.interests || [],
      accessibility: data.accessibility || 'standard', isPublic: data.is_public ?? false,
      bio: data.bio || '', age: data.age || 25, birthday: data.birthday,
      city: data.city || '', country: data.country || '',
      stats: data.stats || { photosTaken: 0, guidesBought: 0, sessionsStarted: 1, referralsCount: 0, streakDays: 1 },
      visitedCities: data.visited_cities || [], completedTours: data.completed_tours || [],
      badges: data.badges || [], stamps: data.stamps || [], capturedMoments: data.captured_moments || [],
      audioSpeed: data.audio_speed || 1.0,
      isAdmin: data.is_admin || false
    };
  } catch (e) { 
    console.error("Critical error in getUserProfileByEmail:", e);
    throw e; 
  }
};

export const checkBadges = (profile: UserProfile): Badge[] => {
  const earnedBadges = [...(profile.badges || [])];
  const badgeIds = new Set(earnedBadges.map(b => b.id));

  if (!badgeIds.has('debutante') && (profile.stats.photosTaken > 0 || profile.completedTours.length > 0)) {
     const b = APP_BADGES.find(x => x.id === 'debutante');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('onfire') && profile.stats.streakDays >= 3) {
     const b = APP_BADGES.find(x => x.id === 'onfire');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('historiador') && profile.historyPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'historiador');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('foodie') && profile.foodPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'foodie');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('culture_master') && profile.culturePoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'culture_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('nature_master') && profile.naturePoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'nature_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('art_master') && profile.artPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'art_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('arch_master') && profile.archPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'arch_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }
  if (!badgeIds.has('photo_master') && profile.photoPoints >= 10) {
     const b = APP_BADGES.find(x => x.id === 'photo_master');
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  const currentRank = calculateTravelerRank(profile.miles);
  const rankBadgeId = `rank_${currentRank.toLowerCase()}`;
  if (!badgeIds.has(rankBadgeId)) {
     const b = APP_BADGES.find(x => x.id === rankBadgeId);
     if (b) earnedBadges.push({...b, earnedAt: new Date().toISOString()});
  }

  return earnedBadges;
};

export const completeTourBonus = (profile: UserProfile, cityId: string): UserProfile => {
    const updatedCities = Array.from(new Set([...(profile.visitedCities || []), cityId]));
    const updatedProfile = {
        ...profile,
        miles: profile.miles + 50,
        visitedCities: updatedCities
    };
    updatedProfile.rank = calculateTravelerRank(updatedProfile.miles);
    updatedProfile.badges = checkBadges(updatedProfile);
    return updatedProfile;
};

export const syncUserProfile = async (profile: UserProfile) => {
  if (!profile || !profile.email) return;
  try {
    const payload = {
      id: profile.id, email: profile.email, username: profile.username,
      first_name: profile.firstName, last_name: profile.lastName,
      name: profile.name || `${profile.firstName} ${profile.lastName}`.trim(),
      miles: profile.miles, language: profile.language, avatar: profile.avatar, rank: profile.rank,
      culture_points: profile.culturePoints, food_points: profile.foodPoints,
      photo_points: profile.photoPoints, history_points: profile.historyPoints,
      nature_points: profile.naturePoints, art_points: profile.artPoints,
      arch_points: profile.archPoints, interests: profile.interests,
      accessibility: profile.accessibility, is_public: profile.isPublic,
      bio: profile.bio, age: profile.age, birthday: profile.birthday,
      city: profile.city, country: profile.country, stats: profile.stats,
      visited_cities: profile.visitedCities, completed_tours: profile.completedTours,
      badges: profile.badges, stamps: profile.stamps, captured_moments: profile.capturedMoments,
      audio_speed: profile.audioSpeed || 1.0,
      updated_at: new Date().toISOString()
    };
    await supabase.rpc('upsert_profile_rpc', { p_payload: payload });
  } catch (e) { console.error("❌ Sync Error:", e); }
};
