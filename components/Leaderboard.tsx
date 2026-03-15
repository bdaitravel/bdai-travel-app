import React from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  currentUser: LeaderboardEntry;
  entries: LeaderboardEntry[];
  onUserClick: (entry: LeaderboardEntry) => void;
  language: string;
}

const TEXTS: any = {
    es: { title: "Ranking Global", you: "Tu Estado", subtitle: "Exploradores de élite", catGlobal: "Global", catCountry: "País", catBadges: "Insignias" },
    en: { title: "Elite Travelers", you: "Your Status", subtitle: "Global explorer rankings", catGlobal: "Global", catCountry: "Country", catBadges: "Badges" },
    it: { title: "Classifica Mondiale", you: "Tuo Stato", subtitle: "Esploratori d'élite", catGlobal: "Globale", catCountry: "Paese", catBadges: "Distintivi" },
    fr: { title: "Classement Mondial", you: "Votre Statut", subtitle: "Voyageurs d'élite", catGlobal: "Mondial", catCountry: "Pays", catBadges: "Badges" },
    de: { title: "Bestenliste", you: "Dein Status", subtitle: "Globale Entdecker-Rankings", catGlobal: "Global", catCountry: "Land", catBadges: "Abzeichen" },
    pt: { title: "Ranking Global", you: "Seu Status", subtitle: "Exploradores de elite", catGlobal: "Global", catCountry: "País", catBadges: "Emblemas" },
    ro: { title: "Clasament Global", you: "Statutul Tău", subtitle: "Exploratori de elită", catGlobal: "Global", catCountry: "Țară", catBadges: "Insigne" },
    ca: { title: "Rànquing Global", you: "El Teu Estat", subtitle: "Exploradors d'elit", catGlobal: "Global", catCountry: "País", catBadges: "Insígnies" },
    nl: { title: "Wereldranglijst", you: "Jouw Status", subtitle: "Elite ontdekkingsreizigers", catGlobal: "Globaal", catCountry: "Land", catBadges: "Badges" },
    zh: { title: "全球排行榜", you: "您的状态", subtitle: "精英探险家", catGlobal: "全球", catCountry: "国家", catBadges: "奖章" },
    ja: { title: "リーダーボード", you: "あなたのステータス", subtitle: "エリート探検家", catGlobal: "グローバル", catCountry: "国別", catBadges: "バッジ" },
    ru: { title: "Рейтинг", you: "Ваш статус", subtitle: "Элитные исследователи", catGlobal: "Глобальный", catCountry: "Страна", catBadges: "Значки" },
    tr: { title: "Küresel Sıralama", you: "Durumunuz", subtitle: "Seçkin gezginler sıralaması", catGlobal: "Küresel", catCountry: "Ülke", catBadges: "Rozetler" },
    pl: { title: "Ranking Globalny", you: "Twój Status", subtitle: "Elitarni odkrywcy", catGlobal: "Globalny", catCountry: "Kraj", catBadges: "Odznaki" },
    hi: { title: "वैश्विक रैंकिंग", you: "आपकी स्थिति", subtitle: "अभिजात वर्ग के खोजकर्ता", catGlobal: "वैश्विक", catCountry: "देश", catBadges: "बैज" },
    ko: { title: "글로벌 랭킹", you: "나의 상태", subtitle: "엘리트 탐험가 순위", catGlobal: "글로벌", catCountry: "국가", catBadges: "배지" },
    ar: { title: "التصنيف العالمي", you: "حالتك", subtitle: "مستكشفو النخبة", catGlobal: "عالمي", catCountry: "الدولة", catBadges: "الأوسمة" },
    eu: { title: "Sailkapen Orokorra", you: "Zure Egoera", subtitle: "Esploratzaile eliteak", catGlobal: "Orokorra", catCountry: "Herrialdea", catBadges: "Txapak" },
    vi: { title: "Bảng xếp hạng", you: "Trạng thái", subtitle: "Nhà thám hiểm tinh hoa", catGlobal: "Toàn cầu", catCountry: "Quốc gia", catBadges: "Huy hiệu" },
    th: { title: "อันดับโลก", you: "สถานะของคุณ", subtitle: "นักสำรวจอีลิท", catGlobal: "ทั่วโลก", catCountry: "ประเทศ", catBadges: "เหรียญตรา" }
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser, entries, onUserClick, language }) => {
  const t = TEXTS[language] || TEXTS['en'];
  const [category, setCategory] = React.useState<'GLOBAL' | 'COUNTRY' | 'BADGES'>('GLOBAL');

  const filteredEntries = React.useMemo(() => {
    let result = [...entries];
    if (category === 'COUNTRY') {
      result = result.filter(e => e.country === currentUser.country);
    } else if (category === 'BADGES') {
      return result.sort((a, b) => (b.badges?.length || 0) - (a.badges?.length || 0));
    }
    return result.sort((a, b) => b.miles - a.miles);
  }, [entries, category, currentUser.country]);

  const top3 = filteredEntries.slice(0, 3);
  const rest = filteredEntries.slice(3);

  const FlagImg = ({ country }: { country?: string }) => {
    if (!country) return null;
    const code = country.length === 2 ? country.toUpperCase() : country.toLowerCase() === 'españa' ? 'ES' : country.substring(0,2).toUpperCase();
    return <img src={`https://flagsapi.com/${code}/flat/64.png`} className="w-2.5 h-2.5 rounded-full opacity-80" alt="" />;
  };

  return (
    <div className="w-full h-full pb-24 animate-fade-in flex flex-col pt-12 bg-slate-950 overflow-y-auto no-scrollbar">
        <div className="text-center mb-8 px-6">
            <h2 className="text-5xl font-black text-white lowercase tracking-tighter mb-2">{t.title}</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400 opacity-60">{t.subtitle}</p>
        </div>

        <div className="flex justify-center gap-2 mb-10 px-6">
            {(['GLOBAL','COUNTRY','BADGES'] as const).map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} className={`px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                    {cat === 'GLOBAL' ? t.catGlobal : cat === 'COUNTRY' ? t.catCountry : t.catBadges}
                </button>
            ))}
        </div>

        <div className={`flex justify-center items-end gap-3 mb-16 px-6 h-80 relative ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            {top3[1] && (
                <div className="flex flex-col items-center w-28 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="relative mb-4 cursor-pointer" onClick={() => onUserClick(top3[1])}>
                        <img src={top3[1].avatar} className="w-18 h-18 rounded-[2rem] border-2 border-slate-400/50 object-cover shadow-2xl relative z-10" />
                        <div className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-slate-400 text-slate-950 flex items-center justify-center text-[11px] font-black border-4 border-slate-950 z-20 shadow-lg">2</div>
                    </div>
                    <div className="w-full h-28 bg-white/5 border border-white/10 rounded-t-[2rem] flex flex-col items-center justify-center p-3 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center gap-1 mb-1 max-w-full">
                            <p className="text-[10px] font-black truncate text-slate-200">{top3[1].name}</p>
                            <FlagImg country={top3[1].country} />
                        </div>
                        <p className="text-[9px] text-purple-400 font-bold">{category === 'BADGES' ? (top3[1].travelerRank || 'ZERO') : `${top3[1].miles.toLocaleString()}m`}</p>
                    </div>
                </div>
            )}
            {top3[0] && (
                <div className="flex flex-col items-center w-32 z-10 animate-slide-up">
                    <div className="relative mb-6 cursor-pointer" onClick={() => onUserClick(top3[0])}>
                        <img src={top3[0].avatar} className="w-24 h-24 rounded-[2.5rem] border-4 border-yellow-500 object-cover shadow-[0_0_40px_rgba(234,179,8,0.4)] relative z-10" />
                        <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-yellow-500 text-yellow-950 flex items-center justify-center text-sm font-black border-4 border-slate-950 z-20 shadow-xl">1</div>
                    </div>
                    <div className="w-full h-40 bg-gradient-to-b from-purple-600/30 to-slate-900/80 border border-purple-500/40 rounded-t-[2.5rem] flex flex-col items-center justify-center p-4 backdrop-blur-2xl shadow-2xl">
                        <div className="flex items-center justify-center gap-2 mb-1 w-full">
                            <p className="text-xs font-black truncate text-white">{top3[0].name}</p>
                            <FlagImg country={top3[0].country} />
                        </div>
                        <p className="text-[11px] text-yellow-400 font-black tracking-widest uppercase">{category === 'BADGES' ? (top3[0].travelerRank || 'ZERO') : `${top3[0].miles.toLocaleString()} MILES`}</p>
                    </div>
                </div>
            )}
            {top3[2] && (
                <div className="flex flex-col items-center w-28 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="relative mb-4 cursor-pointer" onClick={() => onUserClick(top3[2])}>
                        <img src={top3[2].avatar} className="w-18 h-18 rounded-[2rem] border-2 border-amber-700/50 object-cover shadow-2xl relative z-10" />
                        <div className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center text-[11px] font-black border-4 border-slate-950 z-20 shadow-lg">3</div>
                    </div>
                    <div className="w-full h-20 bg-white/5 border border-white/10 rounded-t-[2rem] flex flex-col items-center justify-center p-3 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center gap-1 mb-1 max-w-full">
                            <p className="text-[10px] font-black truncate text-slate-200">{top3[2].name}</p>
                            <FlagImg country={top3[2].country} />
                        </div>
                        <p className="text-[9px] text-purple-400 font-bold">{category === 'BADGES' ? (top3[2].travelerRank || 'ZERO') : `${top3[2].miles.toLocaleString()}m`}</p>
                    </div>
                </div>
            )}
        </div>

        <div className="flex-1 px-6 space-y-3 pb-10">
            {rest.map((user, idx) => (
                <div key={user.id} onClick={() => onUserClick(user)} className={`flex items-center p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer group ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <span className="w-10 text-sm font-black text-slate-600 group-hover:text-purple-400">{idx + 4}</span>
                    <img src={user.avatar} className="w-12 h-12 rounded-2xl border border-white/10 object-cover" />
                    <div className={`ml-5 flex-1 ${language === 'ar' ? 'mr-5 ml-0 text-right' : ''}`}>
                        <div className="flex items-center gap-2">
                            <p className="font-black text-sm text-slate-100">{user.name}</p>
                            <FlagImg country={user.country} />
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                            {category === 'BADGES' ? `${user.travelerRank || 'ZERO'} • ${user.badges?.length || 0} ${t.catBadges}` : `${user.miles.toLocaleString()} miles`}
                        </p>
                    </div>
                    <i className={`fas fa-chevron-right text-[10px] text-slate-700 ${language === 'ar' ? 'rotate-180' : ''}`}></i>
                </div>
            ))}
        </div>

        <div className="px-6 mt-2 pb-6">
            <div className={`bg-purple-600 p-6 rounded-[3rem] flex items-center shadow-2xl border border-white/20 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="relative shrink-0">
                    <img src={currentUser.avatar} className="w-14 h-14 rounded-2xl border-2 border-white/20 object-cover" />
                </div>
                <div className={`ml-4 flex-1 ${language === 'ar' ? 'mr-4 ml-0 text-right' : ''}`}>
                    <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-1">{t.you}</p>
                    <p className="font-black text-white uppercase text-sm leading-none">{currentUser.username}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black text-white tracking-tighter">{currentUser.miles.toLocaleString()}</p>
                    <p className="text-[7px] font-black text-white/50 uppercase tracking-widest">MILES</p>
                </div>
            </div>
        </div>
    </div>
  );
};

