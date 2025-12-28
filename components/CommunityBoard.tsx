
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
    en: { placeholder: "Share a tip or experience...", boardTitle: "Community Board", anonymous: "Explorer", postBtn: "Post", members: "Members online", joinChat: "Join Live Chat", loading: "Loading community...", loginToPost: "Login to share your experience", pending: "Under review", approved: "Verified Tip", reply: "Reply", toxicAlert: "Your message contains inappropriate language and won't be published." },
    es: { placeholder: "Comparte un consejo o experiencia...", boardTitle: "Muro Social", anonymous: "Explorador", postBtn: "Publicar", members: "Exploradores activos", joinChat: "Unirse al Chat Vivo", loading: "Cargando comunidad...", loginToPost: "Inicia sesión para compartir", pending: "En revisión", approved: "Consejo Verificado", reply: "Responder", toxicAlert: "Tu mensaje contiene lenguaje no apto y no será publicado." },
    ca: { placeholder: "Comparteix un consell o experiència...", boardTitle: "Mur Social", anonymous: "Explorador", postBtn: "Publicar", members: "Exploradors actius", joinChat: "Unir-se al Chat", loading: "Carregant comunitat...", loginToPost: "Inicia sessió per compartir", pending: "En revisió", approved: "Consell Verificat", reply: "Respondre", toxicAlert: "El teu missatge conté llenguatge no apte i no serà publicat." },
    eu: { placeholder: "Aholku edo esperientzia bat partekatu...", boardTitle: "Muru Soziala", anonymous: "Esploratzailea", postBtn: "Argitaratu", members: "Esploratzaile aktiboak", joinChat: "Chat-era sartu", loading: "Komunitatea kargatzen...", loginToPost: "Hasi saioa partekatzeko", pending: "Berrikusten", approved: "Egiaztatutako aholkua", reply: "Erantzun", toxicAlert: "Zure mezuak ez du hizkuntza egokia eta ez da argitaratuko." },
    fr: { placeholder: "Partagez un conseil ou une expérience...", boardTitle: "Mur Social", anonymous: "Explorateur", postBtn: "Publier", members: "Explorateurs en ligne", joinChat: "Rejoindre le chat", loading: "Chargement de la communauté...", loginToPost: "Connectez-vous pour partager", pending: "En révision", approved: "Conseil vérifié", reply: "Répondre", toxicAlert: "Votre message contient un langage inapproprié et ne sera pas publié." }
};

export const CommunityBoard: React.FC<{ city: string, language: string, user: UserProfile }> = ({ city, language, user }) => {
    const t = UI_TEXTS[language] || UI_TEXTS['es'];
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        const data = await getCommunityPosts(city, user.isLoggedIn ? user.id : undefined);
        setPosts(data as Post[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, [city, user.id]);

    const handlePost = async () => {
        if (!newPost.trim() || !user.isLoggedIn || isPosting) return;
        
        setIsPosting(true);
        
        // --- CAPA DE MODERACIÓN IA ---
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
        <div className="flex flex-col gap-6 animate-fade-in pb-20">
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                    <h4 className="text-white font-black text-xl mb-1">{t.boardTitle}</h4>
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {Math.floor(Math.random() * 50) + 10} {t.members}
                    </p>
                </div>
                <button onClick={fetchPosts} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all relative z-10">
                    <i className="fas fa-sync-alt text-white text-sm"></i>
                </button>
            </div>

            <div className={`bg-white/5 border border-white/10 rounded-[2rem] p-4 flex gap-3 shadow-xl transition-all ${!user.isLoggedIn ? 'opacity-60 grayscale cursor-not-allowed' : 'focus-within:border-purple-500/50'}`}>
                <img src={user.avatar} className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                <div className="flex-1 flex flex-col gap-3">
                    <textarea 
                        disabled={!user.isLoggedIn || isPosting}
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder={user.isLoggedIn ? t.placeholder : t.loginToPost}
                        className="bg-transparent border-none text-white text-sm outline-none resize-none min-h-[60px] pt-2 disabled:placeholder-slate-500"
                    />
                    {user.isLoggedIn && (
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <div className="flex gap-4 text-slate-500 text-sm">
                                <button className="hover:text-purple-400"><i className="fas fa-camera"></i></button>
                                <button className="hover:text-purple-400"><i className="fas fa-map-pin"></i></button>
                            </div>
                            <button 
                                onClick={handlePost}
                                disabled={!newPost.trim() || isPosting}
                                className="bg-purple-600 disabled:opacity-30 text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
                            >
                                {isPosting ? <i className="fas fa-spinner fa-spin"></i> : t.postBtn}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="py-10 text-center text-slate-500">
                        <i className="fas fa-spinner fa-spin mb-2"></i>
                        <p className="text-[10px] font-black uppercase tracking-widest">{t.loading}</p>
                    </div>
                ) : posts.length > 0 ? (
                    posts.map(post => (
                        <div key={post.id} className={`bg-white/5 border border-white/5 p-5 rounded-[2rem] hover:bg-white/10 transition-all animate-slide-up relative group ${post.status === 'pending' ? 'border-orange-500/30' : ''}`}>
                            <div className="flex gap-4 mb-4">
                                <img src={post.avatar} className="w-10 h-10 rounded-2xl border border-white/10 shadow-md object-cover" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <h5 className="text-white font-black text-sm">{post.user}</h5>
                                        <span className="text-[9px] text-slate-500 font-medium uppercase">{post.time}</span>
                                    </div>
                                    <p className="text-slate-300 text-xs leading-relaxed font-medium">
                                        {post.content}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors">
                                    <i className="far fa-heart"></i>
                                    <span className="text-[10px] font-black">{post.likes > 0 ? post.likes : ''}</span>
                                </button>
                                <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors">
                                    <i className="far fa-comment"></i>
                                    <span className="text-[10px] font-black">{t.reply}</span>
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-10 text-center opacity-30 italic text-xs">Be the first to share something about {city}!</div>
                )}
            </div>
        </div>
    );
};
