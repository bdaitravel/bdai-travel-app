
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { CommunityPost, getCityPosts, createCityPost } from '../services/communityService';

interface CityCommunityProps {
    citySlug: string;
    user: UserProfile;
    language: string;
}

export const CityCommunity: React.FC<CityCommunityProps> = ({ citySlug, user, language }) => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [newPost, setNewPost] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPosts = async () => {
        setIsLoading(true);
        const data = await getCityPosts(citySlug);
        setPosts(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, [citySlug]);

    const handlePost = async () => {
        if (!newPost.trim()) return;
        setIsPosting(true);
        const success = await createCityPost(citySlug, user, newPost);
        if (success) {
            setNewPost('');
            fetchPosts();
        }
        setIsPosting(false);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md">
                <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-4">Comparte un secreto o rincón oculto</p>
                <textarea 
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="¿Has descubierto algo increíble en esta ciudad? Cuéntaselo a la comunidad..."
                    className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-white text-xs font-medium outline-none focus:border-purple-500/40 transition-all resize-none h-24"
                />
                <button 
                    onClick={handlePost}
                    disabled={isPosting || !newPost.trim()}
                    className="w-full mt-4 py-4 bg-purple-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    {isPosting ? 'Publicando...' : 'Publicar Secreto'}
                </button>
            </div>

            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-2">Secretos de la Comunidad</h3>
                {isLoading ? (
                    <div className="space-y-4">
                        {[1,2,3].map(i => <div key={i} className="h-32 bg-white/5 rounded-[2rem] animate-pulse"></div>)}
                    </div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <img src={post.avatar} className="w-8 h-8 rounded-full border border-white/10" alt={post.username} />
                                <div>
                                    <p className="text-white font-black text-[10px] uppercase">@{post.username}</p>
                                    <p className="text-[7px] text-slate-500 font-bold uppercase">{new Date(post.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-xs font-medium leading-relaxed italic">
                                "{post.content}"
                            </p>
                            <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                <button className="flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-colors">
                                    <i className="far fa-heart text-[10px]"></i>
                                    <span className="text-[9px] font-black">{post.likes}</span>
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors">
                                    <i className="far fa-comment text-[10px]"></i>
                                    <span className="text-[9px] font-black">Responder</span>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-12 bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem]">
                        <i className="fas fa-ghost text-slate-800 text-3xl mb-4"></i>
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">Aún no hay secretos aquí...</p>
                        <p className="text-slate-700 text-[8px] font-bold uppercase mt-2">¡Sé el primero en compartir uno!</p>
                    </div>
                )}
            </div>
        </div>
    );
};
