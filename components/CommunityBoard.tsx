
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getCommunityPosts, addCommunityPost } from '../services/supabaseClient';
import { moderateContent } from '../services/geminiService';

interface Post {
    id: string;
    user: string;
    avatar: string;
    content: string;
    time: string;
    likes: number;
    type: 'comment' | 'tip' | 'photo';
    status: 'pending' | 'approved' | 'rejected';
    userId: string;
}

const UI_TEXTS: any = {
    en: { placeholder: "Share a secret tip...", boardTitle: "Traveler Intelligence", anonymous: "Explorer", postBtn: "Transmit", members: "Travelers nearby", loading: "Accessing intel...", loginToPost: "Login to share", approved: "Verified Intel", reply: "Reply", toxicAlert: "Message rejected: inappropriate content." },
    es: { placeholder: "Comparte un secreto o consejo...", boardTitle: "Inteligencia Viajera", anonymous: "Explorador", postBtn: "Transmitir", members: "Exploradores activos", loading: "Accediendo al muro...", loginToPost: "Inicia sesión para compartir", approved: "Intel Verificado", reply: "Responder", toxicAlert: "Mensaje rechazado: contenido no apto." },
    ca: { placeholder: "Comparteix un secret...", boardTitle: "Intel·ligència Viatgera", anonymous: "Explorador", postBtn: "Transmetre", members: "Exploradors actius", loading: "Accedint al mur...", loginToPost: "Inicia sessió", approved: "Intel Verificat", reply: "Respondre", toxicAlert: "Contingut no apte." }
};

export const CommunityBoard: React.FC<{ city: string, language: string, user: UserProfile }> = ({ city, language, user }) => {
    const t = UI_TEXTS[language] || UI_TEXTS['es'];
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        const data = await getCommunityPosts(city);
        setPosts(data as Post[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, [city, user.id]);

    const handlePost = async () => {
        if (!newPost.trim() || !user.isLoggedIn || isPosting) return;
        setIsPosting(true);
        
        const isSafe = await moderateContent(newPost);
        if (!isSafe) {
            alert(t.toxicAlert);
            setIsPosting(false);
            return;
        }

        const postData = {
            city,
            userId: user.id,
            user: user.firstName || t.anonymous,
            avatar: user.avatar,
            content: newPost,
            type: 'comment' as const,
        };

        await addCommunityPost(postData);
        setNewPost('');
        setIsPosting(false);
        fetchPosts(); 
    };

    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-20">
            <header className="px-1">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-black text-2xl tracking-tighter uppercase italic">{t.boardTitle}</h4>
                    <button onClick={fetchPosts} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-500 hover:text-purple-400 transition-colors">
                        <i className={`fas fa-sync-alt ${loading ? 'animate-spin text-purple-500' : ''}`}></i>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.members}</p>
                </div>
            </header>

            {user.isLoggedIn ? (
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl focus-within:border-purple-500/50 transition-all">
                    <div className="flex gap-4">
                        <img src={user.avatar} className="w-12 h-12 rounded-2xl border border-white/10 object-cover shadow-lg" />
                        <textarea 
                            disabled={isPosting}
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder={t.placeholder}
                            className="flex-1 bg-transparent border-none text-white text-sm outline-none resize-none pt-2 placeholder:text-slate-600 font-medium min-h-[80px]"
                        />
                    </div>
                    <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
                        <button 
                            onClick={handlePost}
                            disabled={!newPost.trim() || isPosting}
                            className="bg-purple-600 disabled:bg-slate-800 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
                        >
                            {isPosting ? <i className="fas fa-spinner fa-spin"></i> : t.postBtn}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center border-dashed">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.loginToPost}</p>
                </div>
            )}

            <div className="space-y-6">
                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{t.loading}</p>
                    </div>
                ) : posts.map((post, idx) => (
                    <div 
                        key={post.id} 
                        className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] hover:bg-white/10 transition-all animate-slide-up relative overflow-hidden group"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <i className="fas fa-quote-right text-4xl text-purple-500"></i>
                        </div>
                        <div className="flex gap-4 relative z-10">
                            <img src={post.avatar} className="w-12 h-12 rounded-2xl border border-white/10 shadow-xl object-cover" />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="text-white font-black text-sm tracking-tight">{post.user}</h5>
                                    <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{post.time}</span>
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed font-medium mb-4 pr-4">
                                    {post.content}
                                </p>
                                <div className="flex items-center gap-6">
                                    <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors">
                                        <i className="far fa-heart text-xs"></i>
                                        <span className="text-[9px] font-black tracking-widest">{post.likes || ''}</span>
                                    </button>
                                    <button className="flex items-center gap-2 text-slate-500 hover:text-purple-400 transition-colors">
                                        <i className="far fa-comment text-xs"></i>
                                        <span className="text-[9px] font-black tracking-widest">{t.reply}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
