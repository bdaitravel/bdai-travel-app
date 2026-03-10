import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';
import { showToast } from '../services/errorService';

interface CommunityPost {
  id: string;
  user_email: string;
  username: string;
  avatar: string;
  city: string;
  stop_name: string;
  image_url?: string;
  caption: string;
  likes: number;
  liked_by: string[];
  created_at: string;
  rank?: string;
}

interface CommunityProps {
  user: UserProfile;
  language?: string;
}

const timeAgo = (date: string): string => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const RANK_COLORS: Record<string, string> = {
  ZERO: '#475569', WANDERER: '#6366f1', EXPLORER: '#8b5cf6',
  NOMAD: '#a855f7', VOYAGER: '#d946ef', PIONEER: '#f59e0b',
  LEGEND: '#f97316', ZENITH: '#eab308',
};

export const Community: React.FC<CommunityProps> = ({ user, language = 'es' }) => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [showNewPost, setShowNewPost] = useState(false);
  const [caption, setCaption] = useState('');
  const [city, setCity] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'global' | 'following'>('global');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
    // Real-time subscription
    const channel = supabase
      .channel('community_posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => {
        loadPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTab]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      showToast.error('Error cargando posts', 'Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast.warning('Imagen muy grande', 'Máximo 5MB.');
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!user.isLoggedIn) {
      showToast.warning('Inicia sesión', 'Necesitas una cuenta para publicar.');
      return;
    }
    if (!caption.trim() && !selectedImage) {
      showToast.warning('Post vacío', 'Escribe algo o añade una foto.');
      return;
    }

    setIsPosting(true);
    try {
      let imageUrl: string | undefined;

      if (selectedImage) {
        const ext = selectedImage.name.split('.').pop();
        const filename = `${user.id}_${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('community-photos')
          .upload(filename, selectedImage, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('community-photos')
          .getPublicUrl(filename);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('community_posts').insert({
        user_email: user.email,
        username: user.username || user.firstName || 'Traveler',
        avatar: user.avatar,
        city: city.trim() || 'Unknown City',
        stop_name: '',
        image_url: imageUrl,
        caption: caption.trim(),
        likes: 0,
        liked_by: [],
        rank: user.rank,
      });

      if (error) throw error;

      setCaption('');
      setCity('');
      setSelectedImage(null);
      setImagePreview(null);
      setShowNewPost(false);
      showToast.success('¡Publicado! ✈️', 'Tu momento ya está en el feed global.');
      await loadPosts();
    } catch (e) {
      showToast.error('Error publicando', 'Inténtalo de nuevo.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (post: CommunityPost) => {
    if (!user.isLoggedIn) {
      showToast.info('Inicia sesión para dar likes');
      return;
    }

    const liked = post.liked_by?.includes(user.email);
    const newLikedBy = liked
      ? post.liked_by.filter(e => e !== user.email)
      : [...(post.liked_by || []), user.email];
    const newLikes = liked ? post.likes - 1 : post.likes + 1;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === post.id ? { ...p, likes: newLikes, liked_by: newLikedBy } : p
    ));

    try {
      await supabase.from('community_posts')
        .update({ likes: newLikes, liked_by: newLikedBy })
        .eq('id', post.id);
    } catch {
      // Rollback
      setPosts(prev => prev.map(p =>
        p.id === post.id ? { ...p, likes: post.likes, liked_by: post.liked_by } : p
      ));
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#020617]">
      {/* Header */}
      <div className="pt-safe-iphone px-6 pb-4 sticky top-0 bg-[#020617]/95 backdrop-blur-xl z-20">
        <div className="flex items-center justify-between mb-4 pt-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">Community</h2>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Viajeros reales, lugares reales</p>
          </div>
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-90 transition-all"
          >
            <i className={`fas ${showNewPost ? 'fa-xmark' : 'fa-plus'} text-sm`}></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 rounded-2xl p-1">
          {(['global', 'following'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-purple-600 text-white' : 'text-slate-500'
              }`}
            >
              {tab === 'global' ? '🌍 Global' : '👥 Siguiendo'}
            </button>
          ))}
        </div>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="mx-6 mb-4 bg-white/[0.03] border border-white/10 rounded-3xl p-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-purple-500/30" />
            <div>
              <p className="text-white font-black text-[11px] uppercase">{user.username || 'Traveler'}</p>
              <p className="text-[9px] text-purple-400 uppercase tracking-widest">{user.rank}</p>
            </div>
          </div>

          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="¿En qué ciudad estás?"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none mb-3 placeholder-slate-600 focus:border-purple-500/40"
          />

          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Comparte tu descubrimiento con el mundo..."
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none resize-none mb-3 placeholder-slate-600 focus:border-purple-500/40"
          />

          {imagePreview && (
            <div className="relative mb-3">
              <img src={imagePreview} alt="preview" className="w-full h-48 object-cover rounded-2xl" />
              <button
                onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white"
              >
                <i className="fas fa-xmark text-xs"></i>
              </button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <i className="fas fa-image text-purple-400"></i> Foto
            </button>
            <button
              onClick={handlePost}
              disabled={isPosting || (!caption.trim() && !selectedImage)}
              className="flex-[2] h-12 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {isPosting ? <i className="fas fa-spinner fa-spin"></i> : <><i className="fas fa-paper-plane"></i> Publicar</>}
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-36 space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 rounded-3xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-white/10"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-white/10 rounded-full w-1/3"></div>
                  <div className="h-2 bg-white/10 rounded-full w-1/4"></div>
                </div>
              </div>
              <div className="h-40 bg-white/5 rounded-2xl mb-3"></div>
              <div className="h-2 bg-white/5 rounded-full w-3/4"></div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">✈️</div>
            <p className="text-white font-black uppercase text-sm">Sé el primero</p>
            <p className="text-slate-500 text-[10px] mt-1">Comparte tu primer descubrimiento</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden">
              {/* Post header */}
              <div className="flex items-center gap-3 p-4 pb-3">
                <img src={post.avatar} alt="" className="w-10 h-10 rounded-full border-2"
                  style={{ borderColor: RANK_COLORS[post.rank || 'ZERO'] + '60' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-black text-[11px] uppercase truncate">{post.username}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-widest"
                      style={{ color: RANK_COLORS[post.rank || 'ZERO'] }}>{post.rank}</span>
                    <span className="text-slate-600 text-[8px]">·</span>
                    <span className="text-slate-500 text-[9px]">📍 {post.city}</span>
                  </div>
                </div>
                <span className="text-[9px] text-slate-600">{timeAgo(post.created_at)}</span>
              </div>

              {/* Image */}
              {post.image_url && (
                <img src={post.image_url} alt={post.city} className="w-full h-56 object-cover" />
              )}

              {/* Caption */}
              {post.caption && (
                <p className="px-4 py-3 text-slate-300 text-[12px] leading-relaxed">{post.caption}</p>
              )}

              {/* Actions */}
              <div className="px-4 pb-4 flex items-center gap-4">
                <button
                  onClick={() => handleLike(post)}
                  className={`flex items-center gap-2 transition-all active:scale-90 ${
                    post.liked_by?.includes(user.email) ? 'text-red-400' : 'text-slate-500'
                  }`}
                >
                  <i className={`fas fa-heart text-sm ${post.liked_by?.includes(user.email) ? 'text-red-400' : ''}`}></i>
                  <span className="text-[10px] font-black">{post.likes || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-slate-600">
                  <i className="fas fa-map-pin text-xs"></i>
                  <span className="text-[9px]">{post.city}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
