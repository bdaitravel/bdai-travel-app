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

const COMMUNITY_TEXTS: Record<string, any> = {
    es: { title: "Comunidad", placeholder: "Comparte un secreto, curiosidad o sugerencia sobre esta ciudad...", autoApproved: "Auto-aprobado", needsModeration: "Requiere moderación", sending: "Enviando...", publish: "Publicar", pending: "Pendiente", beFirst: "Sé el primero en comentar", approve: "Aprobar", delete: "Eliminar" },
    en: { title: "Community", placeholder: "Share a secret, curiosity or suggestion about this city...", autoApproved: "Auto-approved", needsModeration: "Needs moderation", sending: "Sending...", publish: "Publish", pending: "Pending", beFirst: "Be the first to comment", approve: "Approve", delete: "Delete" },
    fr: { title: "Communauté", placeholder: "Partagez un secret, une curiosité ou une suggestion sur cette ville...", autoApproved: "Auto-approuvé", needsModeration: "Nécessite modération", sending: "Envoi...", publish: "Publier", pending: "En attente", beFirst: "Soyez le premier à commenter", approve: "Approuver", delete: "Supprimer" },
    de: { title: "Gemeinschaft", placeholder: "Teilen Sie ein Geheimnis, eine Kuriosität oder einen Vorschlag über diese Stadt...", autoApproved: "Auto-genehmigt", needsModeration: "Benötigt Moderation", sending: "Senden...", publish: "Veröffentlichen", pending: "Ausstehend", beFirst: "Sei der Erste, der kommentiert", approve: "Genehmigen", delete: "Löschen" },
    it: { title: "Comunità", placeholder: "Condividi un segreto, una curiosità o un suggerimento su questa città...", autoApproved: "Auto-approvato", needsModeration: "Richiede moderazione", sending: "Invio...", publish: "Pubblica", pending: "In attesa", beFirst: "Sii il primo a commentare", approve: "Approva", delete: "Elimina" },
    pt: { title: "Comunidade", placeholder: "Partilhe um segredo, curiosidade ou sugestão sobre esta cidade...", autoApproved: "Auto-aprovado", needsModeration: "Requer moderação", sending: "Enviando...", publish: "Publicar", pending: "Pendente", beFirst: "Seja o primeiro a comentar", approve: "Aprovar", delete: "Eliminar" },
    ru: { title: "Сообщество", placeholder: "Поделитесь секретом, любопытством или предложением об этом городе...", autoApproved: "Авто-одобрено", needsModeration: "Требует модерации", sending: "Отправка...", publish: "Опубликовать", pending: "Ожидание", beFirst: "Будьте первым, кто прокомментирует", approve: "Одобрить", delete: "Удалить" },
    zh: { title: "社区", placeholder: "分享关于这座城市的秘密、好奇心或建议...", autoApproved: "自动批准", needsModeration: "需要审核", sending: "发送中...", publish: "发布", pending: "待审核", beFirst: "成为第一个评论者", approve: "批准", delete: "删除" },
    ja: { title: "コミュニティ", placeholder: "この街の秘密、豆知識、提案をシェアしてください...", autoApproved: "自動承認", needsModeration: "モデレーションが必要", sending: "送信中...", publish: "投稿", pending: "保留中", beFirst: "最初のコメントを投稿しよう", approve: "承認", delete: "削除" },
    ar: { title: "المجتمع", placeholder: "شارك سراً أو فضولاً أو اقتراحاً عن هذه المدينة...", autoApproved: "موافق تلقائياً", needsModeration: "يحتاج مراجعة", sending: "جارٍ الإرسال...", publish: "نشر", pending: "معلّق", beFirst: "كن أول من يعلّق", approve: "موافقة", delete: "حذف" },
    ca: { title: "Comunitat", placeholder: "Comparteix un secret, curiositat o suggeriment sobre aquesta ciutat...", autoApproved: "Auto-aprovat", needsModeration: "Requereix moderació", sending: "Enviant...", publish: "Publicar", pending: "Pendent", beFirst: "Sigues el primer a comentar", approve: "Aprovar", delete: "Eliminar" },
    eu: { title: "Komunitatea", placeholder: "Partekatu hiri honi buruzko sekretu, jakingarri edo iradokizun bat...", autoApproved: "Auto-onartua", needsModeration: "Moderazioa behar du", sending: "Bidaltzen...", publish: "Argitaratu", pending: "Zain", beFirst: "Iruzkin lehena egin", approve: "Onartu", delete: "Ezabatu" },
    ro: { title: "Comunitate", placeholder: "Împărtășește un secret, o curiozitate sau o sugestie despre acest oraș...", autoApproved: "Auto-aprobat", needsModeration: "Necesită moderare", sending: "Se trimite...", publish: "Publică", pending: "În așteptare", beFirst: "Fii primul care comentează", approve: "Aprobă", delete: "Șterge" },
    nl: { title: "Gemeenschap", placeholder: "Deel een geheim, weetje of suggestie over deze stad...", autoApproved: "Auto-goedgekeurd", needsModeration: "Moderatie vereist", sending: "Verzenden...", publish: "Publiceren", pending: "In behandeling", beFirst: "Wees de eerste die reageert", approve: "Goedkeuren", delete: "Verwijderen" },
    pl: { title: "Społeczność", placeholder: "Podziel się sekretem, ciekawostką lub sugestią na temat tego miasta...", autoApproved: "Auto-zatwierdzone", needsModeration: "Wymaga moderacji", sending: "Wysyłanie...", publish: "Opublikuj", pending: "Oczekujące", beFirst: "Bądź pierwszy, który skomentuje", approve: "Zatwierdź", delete: "Usuń" },
    hi: { title: "समुदाय", placeholder: "इस शहर के बारे में एक रहस्य, जिज्ञासा या सुझाव साझा करें...", autoApproved: "स्वतः-अनुमोदित", needsModeration: "मॉडरेशन की आवश्यकता है", sending: "भेज रहे हैं...", publish: "प्रकाशित करें", pending: "लंबित", beFirst: "टिप्पणी करने वाले पहले बनें", approve: "अनुमोदित करें", delete: "हटाएं" },
    ko: { title: "커뮤니티", placeholder: "이 도시에 대한 비밀, 궁금증 또는 제안을 공유하세요...", autoApproved: "자동 승인", needsModeration: "검토 필요", sending: "전송 중...", publish: "게시", pending: "대기 중", beFirst: "첫 번째 댓글을 작성하세요", approve: "승인", delete: "삭제" },
    tr: { title: "Topluluk", placeholder: "Bu şehir hakkında bir sır, merak veya öneri paylaşın...", autoApproved: "Otomatik onaylı", needsModeration: "Moderasyon gerekli", sending: "Gönderiliyor...", publish: "Yayınla", pending: "Beklemede", beFirst: "İlk yorum yapan siz olun", approve: "Onayla", delete: "Sil" },
    vi: { title: "Cộng đồng", placeholder: "Chia sẻ bí mật, điều thú vị hoặc gợi ý về thành phố này...", autoApproved: "Tự động duyệt", needsModeration: "Cần kiểm duyệt", sending: "Đang gửi...", publish: "Đăng", pending: "Chờ duyệt", beFirst: "Hãy là người đầu tiên bình luận", approve: "Duyệt", delete: "Xóa" },
    th: { title: "ชุมชน", placeholder: "แบ่งปันความลับ ความอยากรู้ หรือคำแนะนำเกี่ยวกับเมืองนี้...", autoApproved: "อนุมัติอัตโนมัติ", needsModeration: "ต้องการการตรวจสอบ", sending: "กำลังส่ง...", publish: "โพสต์", pending: "รอดำเนินการ", beFirst: "เป็นคนแรกที่แสดงความคิดเห็น", approve: "อนุมัติ", delete: "ลบ" },
};

const getT = (language: string) => COMMUNITY_TEXTS[language] || COMMUNITY_TEXTS.en;

export const CityCommunity: React.FC<CityCommunityProps> = ({ citySlug, user }) => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [newPost, setNewPost] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdmin = user.email === 'travelbdai@gmail.com' || user.isAdmin;
    const t = getT(user.language || 'es');

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
            status: isAdmin ? 'approved' : 'pending'
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
                <h3 className="text-white font-black uppercase tracking-widest text-sm">{t.title}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 mb-6 backdrop-blur-md">
                <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder={t.placeholder}
                    className="w-full bg-transparent text-white text-xs placeholder:text-slate-500 resize-none outline-none min-h-[80px]"
                />
                <div className="flex justify-between items-center mt-2 border-t border-white/10 pt-3">
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest">
                        {isAdmin ? t.autoApproved : t.needsModeration}
                    </span>
                    <button
                        onClick={handlePost}
                        disabled={isSubmitting || !newPost.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-purple-500 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? t.sending : t.publish}
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
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest">{t.beFirst}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {visiblePosts.map(post => (
                        <div key={post.id} className="bg-slate-900 border border-white/10 rounded-3xl p-4 relative overflow-hidden">
                            {post.status === 'pending' && (
                                <div className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl border-b border-l border-yellow-500/30">
                                    {t.pending}
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
                                        {new Date(post.timestamp).toLocaleDateString(user.language || 'es')}
                                    </p>
                                </div>
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed">{post.content}</p>

                            {isAdmin && (
                                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                                    {post.status === 'pending' && (
                                        <button
                                            onClick={() => handleAction(post.id, 'approve')}
                                            className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500/30 transition-colors"
                                        >
                                            <i className="fas fa-check mr-1"></i> {t.approve}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleAction(post.id, 'delete')}
                                        className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-500/30 transition-colors"
                                    >
                                        <i className="fas fa-trash-alt mr-1"></i> {t.delete}
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

