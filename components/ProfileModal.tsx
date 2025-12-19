
import React, { useState, useRef, useMemo } from 'react';
import { UserProfile, LeaderboardEntry, LANGUAGES, TravelerRank } from '../types';
import { FlagIcon } from '../App';

interface ProfileModalProps {
  user: UserProfile | LeaderboardEntry;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  language?: string;
}

const UI_TEXT: any = {
    en: { passport: "Passport", surname: "Surname", givenNames: "Given Names", rank: "Rank", miles: "Total Miles", bio: "Bio", badges: "Badges", stamps: "Visa Stamps", edit: "Edit", save: "Save Passport", langLabel: "Language", username: "Username", expedition: "Date of Issue", passportNo: "Passport No.", socials: "Social Networks", nextBadge: "Next Milestone", albumTitle: "AI Travel Album", albumSub: "Generated from your latest adventures", community: "Community Info", off: "OFF", guides: "Excl. Guides", wallpapers: "Wallpapers", export: "Export Album for Socials", wall: "Explorer Wall", wallSub: "What other travelers say about your destinations" },
    es: { passport: "Pasaporte", surname: "Apellidos", givenNames: "Nombres", rank: "Rango", miles: "Millas Totales", bio: "Biografía", badges: "Insignias", stamps: "Sellos Visa", edit: "Editar", save: "Guardar", langLabel: "Idioma", username: "Usuario", expedition: "Fecha Expedición", passportNo: "Nº Pasaporte", socials: "Redes Sociales", nextBadge: "Siguiente Logro", albumTitle: "Álbum de Viaje IA", albumSub: "Generado de tus últimas aventuras", community: "Info Comunidad", off: "DTO", guides: "Guías Excl.", wallpapers: "Wallpapers", export: "Exportar Álbum para Redes", wall: "Muro del Explorador", wallSub: "Lo que dicen otros viajeros sobre tus destinos" },
    eu: { passport: "Pasaportea", surname: "Abizenak", givenNames: "Izenak", rank: "Maila", miles: "Miliak Guztira", bio: "Biografia", badges: "Intsigniak", stamps: "Visa zigiluak", edit: "Editatu", save: "Gorde", langLabel: "Hizkuntza", username: "Erabiltzailea", expedition: "Jaulkipen Data", passportNo: "Pasaporte Zbk.", socials: "Sare Sozialak", nextBadge: "Hurrengo Mugarria", albumTitle: "IA Bidaia Albuma", albumSub: "Zure abenturekin sortua", community: "Komunitate Info", off: "DESK", guides: "Gida Bereziak", wallpapers: "Horma-irudiak", export: "Esportatu Albuma Sareetarako", wall: "Esploratzaile Harresia", wallSub: "Beste bidaiari batzuek zure helburuei buruz diotena" },
    ca: { passport: "Passaport", surname: "Cognoms", givenNames: "Noms", rank: "Rang", miles: "Milles Totals", bio: "Biografia", badges: "Insignies", stamps: "Segells Visa", edit: "Editar", save: "Desar", langLabel: "Idioma", username: "Usuari", expedition: "Data Expedició", passportNo: "Núm. Passaport", socials: "Xarxes Socials", nextBadge: "Següent Fita", albumTitle: "Àlbum de Viatge IA", albumSub: "Generat de les teves últimes aventures", community: "Info Comunitat", off: "DCTE", guides: "Guies Excl.", wallpapers: "Wallpapers", export: "Exportar Àlbum per a Xarxes", wall: "Mur de l'Explorador", wallSub: "El que diuen altres viatgers sobre els teus destins" },
    fr: { passport: "Passeport", surname: "Nom", givenNames: "Prénoms", rank: "Rang", miles: "Miles Totaux", bio: "Bio", badges: "Badges", stamps: "Tampons Visa", edit: "Modifier", save: "Enregistrer", langLabel: "Langue", username: "Utilisateur", expedition: "Date d'émission", passportNo: "N° Passeport", socials: "Réseaux Sociaux", nextBadge: "Prochain Objectif", albumTitle: "Album de Voyage IA", albumSub: "Généré à partir de vos aventures", community: "Infos Communauté", off: "REDUC", guides: "Guides Excl.", wallpapers: "Fonds d'écran", export: "Exporter l'album pour les réseaux", wall: "Mur de l'explorateur", wallSub: "Ce que disent les autres voyageurs de vos destinations" },
    de: { passport: "Reisepass", surname: "Nachname", givenNames: "Vornamen", rank: "Rang", miles: "Gesamtmeilen", bio: "Bio", badges: "Abzeichen", stamps: "Visastempel", edit: "Bearbeiten", save: "Speichern", langLabel: "Sprache", username: "Benutzername", expedition: "Ausstellungsdatum", passportNo: "Pass-Nr.", socials: "Soziale Netzwerke", nextBadge: "Nächster Meilenstein", albumTitle: "KI-Reisealbum", albumSub: "Erstellt aus deinen Abenteuern", community: "Community-Info", off: "RABATT", guides: "Exkl. Guides", wallpapers: "Hintergründe", export: "Album für soziale Netzwerke exportieren", wall: "Entdecker-Wand", wallSub: "Was andere Reisende über deine Ziele sagen" },
    ar: { passport: "جواز سفر", surname: "اللقب", givenNames: "الأسماء الأولى", rank: "الرتبة", miles: "إجمالي الأميال", bio: "السيرة الذاتية", badges: "الأوسمة", stamps: "أختام التأشيرة", edit: "تعديل", save: "حفظ", langLabel: "اللغة", username: "اسم المستخدم", expedition: "تاريخ الإصدار", passportNo: "رقم الجواز", socials: "التواصل الاجتماعي", nextBadge: "المعلم التالي", albumTitle: "ألبوم سفر الذكاء الاصطناعي", albumSub: "تم إنشاؤه من مغامراتك الأخيرة", community: "معلومات المجتمع", off: "خصم", guides: "أدلة حصرية", wallpapers: "خلفيات", export: "تصدير الألبوم لوسائل التواصل", wall: "جدار المستكشف", wallSub: "ماذا يقول المسافرون الآخرون عن وجهاتك" },
    zh: { passport: "护照", surname: "姓", givenNames: "名", rank: "等级", miles: "总里程", bio: "简介", badges: "勋章", stamps: "签证印章", edit: "编辑", save: "保存", langLabel: "语言", username: "用户名", expedition: "签发日期", passportNo: "护照号码", socials: "社交网络", nextBadge: "下一个里程碑", albumTitle: "AI 旅行相册", albumSub: "根据您的冒险自动生成", community: "社区信息", off: "折扣", guides: "独家指南", wallpapers: "壁纸", export: "导出社交媒体相册", wall: "探险者墙", wallSub: "其他旅行者对您目的地的评价" },
    ja: { passport: "パスポート", surname: "姓", givenNames: "名", rank: "ランク", miles: "通算マイル", bio: "自己紹介", badges: "バッジ", stamps: "入国スタンプ", edit: "編集", save: "保存", langLabel: "言語", username: "ユーザー名", expedition: "発行日", passportNo: "旅券番号", socials: "SNS", nextBadge: "次のマイルストーン", albumTitle: "AIトラベルアルバム", albumSub: "あなたの冒険から生成されました", community: "コミュニティ情報", off: "オフ", guides: "限定ガイド", wallpapers: "壁紙", export: "SNS用アルバムのエクスポート", wall: "冒険者の壁", wallSub: "他の旅行者があなたの目的地について語っていること" }
};

const RANK_CONFIG: Record<TravelerRank, { min: number, color: string, discount: string, icon: string }> = {
    'Turist': { min: 0, color: 'from-slate-400 to-slate-600', discount: '0%', icon: 'fa-walking' },
    'Explorer': { min: 1000, color: 'from-green-500 to-emerald-700', discount: '5%', icon: 'fa-map-signs' },
    'Wanderer': { min: 5000, color: 'from-blue-500 to-indigo-700', discount: '10%', icon: 'fa-compass' },
    'Globe-Trotter': { min: 15000, color: 'from-purple-500 to-pink-700', discount: '20%', icon: 'fa-globe' },
    'Legend bdai': { min: 40000, color: 'from-yellow-500 to-orange-700', discount: '40%', icon: 'fa-crown' }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, language = 'es' }) => {
  const profile = user as UserProfile;
  const t = UI_TEXT[language] || UI_TEXT['en'];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'passport' | 'albums' | 'community'>('passport');
  
  const currentRank = useMemo((): TravelerRank => {
      if (profile.miles >= 40000) return 'Legend bdai';
      if (profile.miles >= 15000) return 'Globe-Trotter';
      if (profile.miles >= 5000) return 'Wanderer';
      if (profile.miles >= 1000) return 'Explorer';
      return 'Turist';
  }, [profile.miles]);

  const [formData, setFormData] = useState({
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.username || '',
      bio: profile.bio,
      avatar: profile.avatar,
      language: profile.language,
      socials: profile.socials || { instagram: '', tiktok: '', x: '' }
  });

  const handleSave = () => {
      if (onUpdateUser) onUpdateUser({ ...profile, ...formData, rank: currentRank });
      setIsEditing(false);
  };

  const nextRank = Object.entries(RANK_CONFIG).find(([_, cfg]) => cfg.min > profile.miles)?.[0] as TravelerRank | undefined;
  const nextRankMin = nextRank ? RANK_CONFIG[nextRank].min : RANK_CONFIG[currentRank].min;
  const prevRankMin = RANK_CONFIG[currentRank].min;
  const progress = nextRank ? ((profile.miles - prevRankMin) / (nextRankMin - prevRankMin)) * 100 : 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md" onClick={onClose}></div>
      <div className="bg-[#0b1c3d] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border border-white/10 flex flex-col max-h-[95vh] animate-slide-up">
        <div className="flex bg-white/5 border-b border-white/10 p-2">
            <TabBtn active={activeTab === 'passport'} onClick={() => setActiveTab('passport')} icon="fa-id-card" label="Passport" />
            <TabBtn active={activeTab === 'albums'} onClick={() => setActiveTab('albums')} icon="fa-book-open" label="Albums" />
            <TabBtn active={activeTab === 'community'} onClick={() => setActiveTab('community')} icon="fa-users" label="Community" />
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#e8e4d8] m-3 rounded-[1.5rem] shadow-inner text-slate-900 pb-10 relative">
            {activeTab === 'passport' && (
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <h2 className="text-blue-900 font-heading font-black text-[10px] uppercase tracking-[0.3em]">{t.passport}</h2>
                            <p className="font-mono text-[8px] opacity-40 uppercase tracking-widest">{profile.passportNumber || 'XP-8829-BDAI'}</p>
                        </div>
                        <div className="flex gap-2">
                            {isOwnProfile && <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="w-8 h-8 rounded-full bg-yellow-500 text-slate-900 flex items-center justify-center shadow-lg active:scale-90 transition-transform"><i className={`fas ${isEditing ? 'fa-save' : 'fa-pen-nib'} text-[10px]`}></i></button>}
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center"><i className="fas fa-times text-[10px]"></i></button>
                        </div>
                    </div>
                    <div className="flex gap-4 mb-8">
                        <div onClick={() => isEditing && fileInputRef.current?.click()} className={`w-28 h-36 bg-white p-2 rounded shadow-2xl border border-slate-300 transform -rotate-1 relative overflow-hidden group ${isEditing ? 'ring-2 ring-yellow-500' : ''}`}>
                            <img src={formData.avatar} className="w-full h-full object-cover grayscale-[0.1]" alt="ID" />
                            {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><i className="fas fa-camera text-xl"></i></div>}
                            <input type="file" ref={fileInputRef} className="hidden" />
                        </div>
                        <div className="flex-1 space-y-4 pt-1">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <InputLabel label={t.surname} value={formData.lastName} onChange={v => setFormData({...formData, lastName: v})} />
                                    <InputLabel label={t.givenNames} value={formData.firstName} onChange={v => setFormData({...formData, firstName: v})} />
                                    <InputLabel label={t.username} value={formData.username} onChange={v => setFormData({...formData, username: v})} prefix="@" />
                                    <SelectLabel label={t.langLabel} value={formData.language} options={LANGUAGES} onChange={v => setFormData({...formData, language: v})} />
                                </div>
                            ) : (
                                <>
                                    <DataBlock label={t.surname} value={profile.lastName} />
                                    <DataBlock label={t.givenNames} value={profile.firstName} />
                                    <DataBlock label={t.username} value={`@${profile.username}`} color="text-blue-700" />
                                    <div className="flex items-center gap-2">
                                        <DataBlock label={t.langLabel} value={LANGUAGES.find(l => l.code === profile.language)?.name || profile.language} />
                                        <div className="mt-3"><FlagIcon code={profile.language} className="w-3.5 h-auto shadow-sm" /></div>
                                    </div>
                                    <div className="pt-2"><span className={`px-2 py-1 rounded bg-gradient-to-r ${RANK_CONFIG[currentRank].color} text-white text-[8px] font-black uppercase tracking-widest shadow-md flex items-center gap-1 w-fit`}><i className={`fas ${RANK_CONFIG[currentRank].icon}`}></i>{currentRank}</span></div>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="mb-8 p-4 bg-white/40 rounded-2xl border border-slate-900/5 shadow-sm">
                        <div className="flex justify-between items-end mb-2">
                            <div><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">{t.miles}</p><p className="text-xl font-black font-mono">{profile.miles.toLocaleString()}</p></div>
                            <div className="text-right"><p className="text-[7px] font-black text-slate-400 uppercase mb-1">{t.nextBadge}</p><p className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">{nextRank || 'MAX LEVEL'}</p></div>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3"><div className={`h-full bg-gradient-to-r ${RANK_CONFIG[currentRank].color} transition-all duration-1000`} style={{ width: `${progress}%` }}></div></div>
                        <div className="flex justify-between"><Benefit icon="fa-tag" label={`${RANK_CONFIG[currentRank].discount} ${t.off}`} active={true} /><Benefit icon="fa-book" label={t.guides} active={profile.miles >= 5000} /><Benefit icon="fa-image" label={t.wallpapers} active={profile.miles >= 15000} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="space-y-3"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t.socials}</p><div className="flex gap-2"><SocialIcon icon="fab fa-instagram" href={profile.socials?.instagram} active={!!profile.socials?.instagram} /><SocialIcon icon="fab fa-tiktok" href={profile.socials?.tiktok} active={!!profile.socials?.tiktok} /><SocialIcon icon="fab fa-x-twitter" href={profile.socials?.x} active={!!profile.socials?.x} /></div></div>
                        <div className="text-right"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.expedition}</p><p className="text-[10px] font-bold text-slate-600 font-mono italic">{profile.joinDate || '2024-01-01'}</p></div>
                    </div>
                    <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.badges}</p><div className="grid grid-cols-2 gap-2">{profile.badges.map(badge => (<div key={badge.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex flex-col items-center gap-1 shadow-sm transform hover:rotate-1 transition-all"><div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm shadow-inner"><i className={`fas ${badge.icon}`}></i></div><p className="text-[7px] font-black uppercase text-center text-slate-800">{badge.name}</p></div>))}</div></div>
                </div>
            )}
            {activeTab === 'albums' && (
                <div className="p-6 animate-fade-in"><header className="mb-8"><h3 className="text-xl font-black text-slate-900 leading-tight">{t.albumTitle}</h3><p className="text-xs text-slate-500 font-medium italic">{t.albumSub}</p></header><div className="space-y-6"><div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-200 transform -rotate-1"><img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=400&q=80" className="w-full h-40 object-cover rounded-2xl mb-4 grayscale-[0.3]" /><p className="text-center font-serif text-sm italic text-slate-600 leading-relaxed">"Las calles de París hablan un idioma que solo el corazón explorador entiende."</p><div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-100"><span className="text-[10px] font-black uppercase text-blue-600">Paris, France</span><span className="text-[10px] text-slate-400 font-mono italic">24/05/2024</span></div></div><button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl flex items-center justify-center gap-2"><i className="fas fa-file-export"></i> {t.export}</button></div></div>
            )}
            {activeTab === 'community' && (
                <div className="p-6 animate-fade-in space-y-6"><header><h3 className="text-xl font-black text-slate-900 leading-tight">{t.wall}</h3><p className="text-xs text-slate-500 font-medium">{t.wallSub}</p></header><div className="space-y-4"><div className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-3"><div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><i className="fas fa-camera"></i></div><div><p className="text-[10px] font-black uppercase text-purple-600 mb-1">Top Spot en Madrid</p><p className="text-xs font-bold text-slate-800">"Los Jardines de Sabatini tienen la luz perfecta a las 19:45."</p></div></div><div className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><i className="fas fa-award"></i></div><div><p className="text-[10px] font-black uppercase text-blue-600 mb-1">Badge más popular</p><p className="text-xs font-bold text-slate-800">"El 60% de los viajeros en Barcelona consiguen el badge 'Gaudí Expert'."</p></div></div></div></div>
            )}
        </div>
      </div>
    </div>
  );
};

const TabBtn = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${active ? 'text-yellow-500' : 'text-white/40'}`}>
        <i className={`fas ${icon} text-sm`}></i>
        <span className="text-[7px] font-black uppercase tracking-widest">{label}</span>
        {active && <div className="w-4 h-0.5 bg-yellow-500 rounded-full mt-1"></div>}
    </button>
);

const DataBlock = ({ label, value, color = "text-slate-900" }: any) => (
    <div><p className="text-[7px] font-black text-slate-400 uppercase mb-0.5">{label}</p><p className={`text-sm font-black uppercase tracking-tight font-mono ${color}`}>{value || '---'}</p></div>
);

const InputLabel = ({ label, value, onChange, prefix = "" }: any) => (
    <div><p className="text-[7px] font-black text-slate-400 uppercase">{label}</p><div className="flex items-center gap-1 bg-white/70 border-b border-slate-300 p-1 rounded-t">{prefix && <span className="text-xs font-bold text-slate-400">{prefix}</span>}<input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-transparent text-xs font-black uppercase outline-none focus:text-blue-700"/></div></div>
);

const SelectLabel = ({ label, value, options, onChange }: any) => (
    <div><p className="text-[7px] font-black text-slate-400 uppercase">{label}</p><div className="bg-white/70 border-b border-slate-300 p-1 rounded-t"><select value={value} onChange={e => onChange(e.target.value)} className="w-full bg-transparent text-xs font-black uppercase outline-none focus:text-blue-700 appearance-none cursor-pointer">{options.map((opt: any) => (<option key={opt.code} value={opt.code}>{opt.name}</option>))}</select></div></div>
);

const Benefit = ({ icon, label, active }: any) => (
    <div className={`flex flex-col items-center gap-1 ${active ? 'opacity-100' : 'opacity-20'}`}><div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] ${active ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-200 text-slate-400'}`}><i className={`fas ${icon}`}></i></div><span className="text-[6px] font-black uppercase text-center leading-none">{label}</span></div>
);

const SocialIcon = ({ icon, href, active }: any) => (
    <a href={href || "#"} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-white text-blue-900 shadow-sm' : 'bg-black/5 text-slate-300 cursor-default'}`}><i className={icon}></i></a>
);
