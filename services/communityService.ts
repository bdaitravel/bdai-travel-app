
import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

export interface CommunityPost {
    id: string;
    city_slug: string;
    user_id: string;
    username: string;
    avatar: string;
    content: string;
    created_at: string;
    likes: number;
}

export const getCityPosts = async (citySlug: string): Promise<CommunityPost[]> => {
    const { data, error } = await supabase
        .from('city_community')
        .select('*')
        .eq('city_slug', citySlug)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching community posts:", error);
        return [];
    }
    return data || [];
};

export const createCityPost = async (citySlug: string, user: UserProfile, content: string): Promise<boolean> => {
    const { error } = await supabase
        .from('city_community')
        .insert({
            city_slug: citySlug,
            user_id: user.id,
            username: user.username,
            avatar: user.avatar,
            content: content,
            likes: 0
        });
    
    if (error) {
        console.error("Error creating post:", error);
        return false;
    }
    return true;
};
