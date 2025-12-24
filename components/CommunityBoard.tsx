
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface Post {
    id: string;
    user: string;
    avatar: string;
    content: string;
    time: string;
    likes: number;
    type: 'comment' | 'tip' | 'photo';
    imageUrl?: string;
}

const MOCK_COMMENTS: Record<string, Post[]> = {
    'Madrid': [
        { id: '1', user: 'Carlos G.', avatar: 'https://i.pravatar.cc/150?u=carlos', content: 'No os perdáis el bocata de calamares en El Brillante al terminar la ruta. ¡Un clásico!', time: '2h ago', likes: 12, type: 'tip' },
        { id: '2', user: 'Ana Explorer', avatar: 'https://i.pravatar.cc/150?u=ana', content: 'La vista desde el Templo de Debod al atardecer es increíble.', time: '5h ago', likes: 25, type: 'photo', imageUrl: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=400&q=80' },
        { id: '3', user: 'Luis V.', avatar: 'https://i.pravatar.cc/150?u=luis', content: '¿Alguien sabe si el Palacio Real abre hoy gratis?', time: '1d ago', likes: 4, type: 'comment' },
    ],
    'Sevilla': [
        { id: 's1', user: 'Elena S.', avatar: 'https://i.pravatar.cc/150?u=elena', content: 'La Plaza de España es de otro planeta. Id temprano para evitar el calor.', time: '1h ago', likes: 45, type: 'tip' },
        { id: 's2', user: 'Javi Travel', avatar: 'https://i.pravatar.cc/150?u=javi', content: 'Comiendo las mejores tapas en Triana ahora mismo.', time: '3h ago', likes: 18, type: 'comment' },
    ]
};

const UI_TEXTS: any = {
    en: { placeholder: "Share a tip or experience...", boardTitle: "Community Board", anonymous: "Explorer", postBtn: "Post", members: "Members online", joinChat: "Join Live Chat" },
    es: { placeholder: "Comparte un consejo o experiencia...", boardTitle: "Muro de la Comunidad", anonymous: "Explorador", postBtn: "Publicar", members: "Exploradores activos", joinChat: "Unirse al Chat Vivo" },
    ca: { placeholder: "Comparteix un consell o experiència...", boardTitle: "Mur de la Comunitat", anonymous: "Explorador", postBtn: "Publicar", members: "Exploradors actius", joinChat: "Unir-se al Xat Viu" },
    eu: { placeholder: "Partekatu aholku edo esperientzia bat...", boardTitle: "Komunitatearen Harresia", anonymous: "Esploratzailea", postBtn: "Argitaratu", members: "Esploratzaile aktiboak", joinChat: "Zuzeneko Txatean sartu" },
    fr: { placeholder: "Partagez un conseil ou une expérience...", boardTitle: "Mur de la Communauté", anonymous: "Explorateur", postBtn: "Publier", members: "Explorateurs en ligne", joinChat: "Rejoindre le Chat Live" }
};

export const CommunityBoard: React.FC<{ city: string, language: string, user: UserProfile }> = ({ city, language, user }) => {
    const t = UI_TEXTS[language] || UI_TEXTS['es'];
    const [posts, setPosts] = useState<Post[]>(MOCK_COMMENTS[city] || [
        { id: 'default', user: 'bdai Bot', avatar: 'https://i.pravatar.cc/150?u=bot', content: `¡Bienvenido al muro de ${city}! Sé el primero en compartir algo.`, time: 'now', likes: 0, type: 'comment' }
    ]);
    const [newPost, setNewPost] = useState('');

    const handlePost = () => {
        if (!newPost.trim()) return;
        const post: Post = {
            id: Date.now().toString(),
            user: user.firstName || t.anonymous,
            avatar: user.avatar,
            content: newPost,
            time: 'just now',
            likes: 0,
            type: 'comment'
        };
        setPosts([post, ...posts]);
        setNewPost('');
    };

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-20">
            {/* Community Header Stats */}
            <div className="bg-gradient-to-br from-purple-900/40 to-slate-900 border border-white/10 p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
                <div>
                    <h4 className="text-white font-black text-xl mb-1">{t.boardTitle}</h4>
                    <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        {Math.floor(Math.random() * 50) + 10} {t.members}
                    </p>
                </div>
                <button className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-all">
                    <i className="fas fa-comments text-white text-xl"></i>
                </button>
            </div>

            {/* Input Box */}
            <div className="bg-white/5 border border-white/10 rounded-[2rem] p-4 flex gap-3 shadow-xl focus-within:border-purple-500/50 transition-all">
                <img src={user.avatar} className="w-10 h-10 rounded-full border border-white/20 object-cover" />
                <div className="flex-1 flex flex-col gap-3">
                    <textarea 
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder={t.placeholder}
                        className="bg-transparent border-none text-white text-sm outline-none resize-none min-h-[60px] pt-2"
                    />
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                        <div className="flex gap-4 text-slate-500 text-sm">
                            <button className="hover:text-purple-400"><i className="fas fa-camera"></i></button>
                            <button className="hover:text-purple-400"><i className="fas fa-map-pin"></i></button>
                            <button className="hover:text-purple-400"><i className="fas fa-at"></i></button>
                        </div>
                        <button 
                            onClick={handlePost}
                            disabled={!newPost.trim()}
                            className="bg-purple-600 disabled:opacity-30 text-white px-5 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all"
                        >
                            {t.postBtn}
                        </button>
                    </div>
                </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
                {posts.map(post => (
                    <div key={post.id} className="bg-white/5 border border-white/5 p-5 rounded-[2rem] hover:bg-white/10 transition-all animate-slide-up relative group">
                        {post.type === 'tip' && (
                            <div className="absolute top-4 right-6 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-widest">Insider Tip</div>
                        )}
                        <div className="flex gap-4 mb-4">
                            <img src={post.avatar} className="w-10 h-10 rounded-2xl border border-white/10 shadow-md" />
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

                        {post.imageUrl && (
                            <div className="rounded-2xl overflow-hidden mb-4 border border-white/10 shadow-inner">
                                <img src={post.imageUrl} className="w-full h-40 object-cover grayscale-[0.2] hover:grayscale-0 transition-all duration-700" />
                            </div>
                        )}

                        <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                            <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors">
                                <i className="far fa-heart"></i>
                                <span className="text-[10px] font-black">{post.likes > 0 ? post.likes : ''}</span>
                            </button>
                            <button className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition-colors">
                                <i className="far fa-comment"></i>
                                <span className="text-[10px] font-black">Reply</span>
                            </button>
                            <button className="ml-auto text-slate-500 hover:text-white transition-colors">
                                <i className="fas fa-share-alt"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chat Banner */}
            <button className="w-full bg-white/5 border border-purple-500/20 py-5 rounded-[2rem] flex items-center justify-center gap-4 group hover:bg-white/10 transition-all">
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                    <i className="fas fa-bolt text-xs"></i>
                </div>
                <span className="text-[11px] font-black text-white uppercase tracking-widest">{t.joinChat}</span>
            </button>
        </div>
    );
};
