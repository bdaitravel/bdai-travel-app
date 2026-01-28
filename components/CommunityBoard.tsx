
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getCommunityPosts, addCommunityPost } from '../services/supabaseClient';
import { moderateContent } from '../services/geminiService';

const UI_TEXTS: any = {
    en: { placeholder: "Share a secret tip...", boardTitle: "Traveler Intelligence", anonymous: "Explorer", postBtn: "Transmit", members: "Travelers nearby", loading: "Accessing intel...", loginToPost: "Login to share", reply: "Reply", toxicAlert: "Rejected: inappropriate content." },
    es: { placeholder: "Comparte un secreto...", boardTitle: "Inteligencia Viajera", anonymous: "Explorador", postBtn: "Transmitir", members: "Exploradores activos", loading: "Accediendo al muro...", loginToPost: "Inicia sesión para compartir", reply: "Responder", toxicAlert: "Mensaje rechazado: contenido no apto." },
    ca: { placeholder: "Comparteix un secret...", boardTitle: "Intel·ligència Viatgera", anonymous: "Explorador", postBtn: "Transmetre", members: "Exploradors actius", loading: "Accedint al mur...", loginToPost: "Inicia sessió", reply: "Respondre", toxicAlert: "Contingut no apte." },
    eu: { placeholder: "Sekretua partekatu...", boardTitle: "Bidaia Inteligentzia", anonymous: "Esploratzailea", postBtn: "Bidali", members: "Esploratzaile aktiboak", loading: "Mura atzitzen...", loginToPost: "Hasi saioa partekatzeko", reply: "Erantzun", toxicAlert: "Edukia ez da egokia." },
    fr: { placeholder: "Partager un secret...", boardTitle: "Intelligence Voyageur", anonymous: "Explorateur", postBtn: "Transmettre", members: "Voyageurs actifs", loading: "Accès au mur...", loginToPost: "Connectez-vous pour partager", reply: "Répondre", toxicAlert: "Contenu inapproprié." },
    de: { placeholder: "Geheimtipp teilen...", boardTitle: "Reise-Intelligenz", anonymous: "Entdecker", postBtn: "Senden", members: "Aktive Entdecker", loading: "Lade Pinnwand...", loginToPost: "Einloggen zum Teilen", reply: "Antworten", toxicAlert: "Inhalt abgelehnt." },
    ja: { placeholder: "秘密のチップを共有...", boardTitle: "旅行者の知恵", anonymous: "エクスプローラー", postBtn: "送信", members: "アクティブな旅行者", loading: "ロード中...", loginToPost: "ログインして共有", reply: "返信", toxicAlert: "不適切なコンテンツ。" },
    zh: { placeholder: "分享秘诀...", boardTitle: "旅行者情报", anonymous: "探险家", postBtn: "发送", members: "活跃探险家", loading: "加载中...", loginToPost: "登录后分享", reply: "回复", toxicAlert: "内容不当。" },
    ar: { placeholder: "شارك سراً...", boardTitle: "ذكاء المسافر", anonymous: "مستكشف", postBtn: "إرسال", members: "مستكشفون نشطون", loading: "جاري التحميل...", loginToPost: "سجل الدخول للمشاركة", reply: "رد", toxicAlert: "محتوى غير لائق." }
};

export const CommunityBoard: React.FC<any> = ({ city, language, user }) => {
    const t = UI_TEXTS[language] || UI_TEXTS['es'];
    const [posts, setPosts] = useState<any[]>([]);
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);
    const fetchPosts = async () => { setLoading(true); const data = await getCommunityPosts(city); setPosts(data); setLoading(false); };
    useEffect(() => { fetchPosts(); }, [city, user.id]);
    const handlePost = async () => {
        if (!newPost.trim() || !user.isLoggedIn || isPosting) return;
        setIsPosting(true);
        if (!(await moderateContent(newPost))) { alert(t.toxicAlert); setIsPosting(false); return; }
        await addCommunityPost({ city, userId: user.id, user: user.firstName || t.anonymous, avatar: user.avatar, content: newPost, type: 'comment' });
        setNewPost(''); setIsPosting(false); fetchPosts(); 
    };
    return (
        <div className="flex flex-col gap-8 animate-fade-in pb-20">
            <header className="flex items-center justify-between"><h4 className="text-white font-black text-2xl uppercase italic">{t.boardTitle}</h4><button onClick={fetchPosts} className="w-10 h-10 rounded-full bg-white/5 text-slate-500"><i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i></button></header>
            {user.isLoggedIn ? (
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 focus-within:border-purple-500 transition-all">
                    <div className="flex gap-4">
                        <img src={user.avatar} className="w-12 h-12 rounded-2xl border border-white/10 object-cover" />
                        <textarea disabled={isPosting} value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder={t.placeholder} className="flex-1 bg-transparent border-none text-white text-sm outline-none resize-none pt-2 min-h-[80px]" />
                    </div>
                    <div className="flex justify-end mt-4 pt-4 border-t border-white/5"><button onClick={handlePost} disabled={!newPost.trim() || isPosting} className="bg-purple-600 disabled:bg-slate-800 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest">{isPosting ? <i className="fas fa-spinner fa-spin"></i> : t.postBtn}</button></div>
                </div>
            ) : <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-center"><p className="text-[10px] font-black text-slate-500 uppercase">{t.loginToPost}</p></div>}
            <div className="space-y-6">
                {posts.map((post, idx) => (
                    <div key={post.id} className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] hover:bg-white/10 transition-all animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <div className="flex gap-4">
                            <img src={post.avatar} className="w-12 h-12 rounded-2xl border border-white/10 object-cover" />
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-2"><h5 className="text-white font-black text-sm">{post.user}</h5><span className="text-[8px] text-slate-500 font-black uppercase">{post.time}</span></div>
                                <p className="text-slate-300 text-sm leading-relaxed mb-4">{post.content}</p>
                                <div className="flex items-center gap-6"><button className="flex items-center gap-2 text-slate-500 hover:text-red-500"><i className="far fa-heart text-xs"></i><span className="text-[9px] font-black">{post.likes || ''}</span></button><button className="flex items-center gap-2 text-slate-500 hover:text-purple-400"><i className="far fa-comment text-xs"></i><span className="text-[9px] font-black">{t.reply}</span></button></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
