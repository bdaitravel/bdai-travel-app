import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';

interface CommunityPost {
    id: string;
    userId: string;
    userName: string;
    userAvatar: string;
    content: string;
    timestamp: number;
    status: 'pending' | 'approved';
}

interface CityCommunityProps {
    citySlug: string;
    user: UserProfile;
}

export const CityCommunity: React.FC<CityCommunityProps> = ({ citySlug, user }) => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [newPost, setNewPost] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdmin = user.email === 'travelbdai@gmail.com' || user.isAdmin;

    useEffect(() => {
        fetchPosts();
    }, [citySlug]);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('tours_cache')
                .select('data')
                .eq('city', citySlug)
                .eq('language', 'community')
                .maybeSingle();

            if (!error && data && data.data) {
                setPosts(data.data as CommunityPost[]);
            } else {
                setPosts([]);
            }
        } catch (e) {
            console.error("Error fetching community posts:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePost = async () => {
        if (!newPost.trim()) return;
        setIsSubmitting(true);

        const post: CommunityPost = {
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.username || user.firstName || 'Traveler',
            userAvatar: user.avatar || '',
            content: newPost.trim(),
            timestamp: Date.now(),
            status: isAdmin ? 'approved' : 'pending' // Admins auto-approve
        };

        const updatedPosts = [post, ...posts];

        try {
            await supabase.from('tours_cache').upsert({
                city: citySlug,
                language: 'community',
                data: updatedPosts
            }, { onConflict: 'city,language' });

            setPosts(updatedPosts);
            setNewPost('');
        } catch (e) {
            console.error("Error posting:", e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAction = async (postId: string, action: 'approve' | 'delete') => {
        let updatedPosts = [...posts];
        if (action === 'delete') {
            updatedPosts = updatedPosts.filter(p => p.id !== postId);
        } else if (action === 'approve') {
            updatedPosts = updatedPosts.map(p => p.id === postId ? { ...p, status: 'approved' } : p);
        }

        try {
            await supabase.from('tours_cache').upsert({
                city: citySlug,
                language: 'community',
                data: updatedPosts
            }, { onConflict: 'city,language' });

            setPosts(updatedPosts);
        } catch (e) {
            console.error("Error updating post:", e);
        }
    };

    const visiblePosts = posts.filter(p => p.status === 'approved' || p.userId === user.id || isAdmin);

    return (
        <div className="w-full mt-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                    <i className="fas fa-users text-purple-400 text-xs"></i>
                </div>
                <h3 className="text-white font-black uppercase tracking-widest text-sm">Comunidad</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-6 backdrop-blur-md">
                <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Comparte un secreto, curiosidad o sugerencia sobre esta ciudad..."
                    className="w-full bg-transparent text-white text-xs placeholder:text-slate-500 resize-none outline-none min-h-[80px]"
                />
                <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-3">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest">
                        {isAdmin ? 'Auto-aprobado' : 'Requiere moderación'}
                    </span>
                    <button
                        onClick={handlePost}
                        disabled={isSubmitting || !newPost.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-purple-500 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Enviando...' : 'Publicar'}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : visiblePosts.length === 0 ? (
                <div className="text-center py-8 bg-white/5 border border-white/10 rounded-3xl">
                    <i className="fas fa-comment-slash text-slate-600 text-2xl mb-3"></i>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest">Sé el primero en comentar</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {visiblePosts.map(post => (
                        <div key={post.id} className="bg-slate-900 border border-white/10 rounded-3xl p-4 relative overflow-hidden">
                            {post.status === 'pending' && (
                                <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl border-b border-l border-yellow-500/30">
                                    Pendiente
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-3">
                                {post.userAvatar ? (
                                    <img src={post.userAvatar} alt={post.userName} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                                        <i className="fas fa-user text-purple-400 text-[10px]"></i>
                                    </div>
                                )}
                                <div>
                                    <p className="text-white font-bold text-[11px]">{post.userName}</p>
                                    <p className="text-slate-500 text-[8px] uppercase tracking-widest">
                                        {new Date(post.timestamp).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                {post.content}
                            </p>
                            
                            {isAdmin && (
                                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                                    {post.status === 'pending' && (
                                        <button 
                                            onClick={() => handleAction(post.id, 'approve')}
                                            className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-colors"
                                        >
                                            <i className="fas fa-check mr-1"></i> Aprobar
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleAction(post.id, 'delete')}
                                        className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-colors"
                                    >
                                        <i className="fas fa-trash-alt mr-1"></i> Eliminar
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
