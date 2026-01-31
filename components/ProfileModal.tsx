
import React, { useState, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, Badge, SocialLinks, INTEREST_OPTIONS, RANK_THRESHOLDS, TravelerRank, BADGE_DEFINITIONS } from '../types';
import { FlagIcon } from './FlagIcon';
import { syncUserProfile } from '../services/supabaseClient';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  isOwnProfile?: boolean;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  language?: string;
}

const MODAL_TEXTS: any = {
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad Credential", surname: "Surname", givenNames: "Given Names", city: "City of Origin", country: "Country", birthday: "Date of Birth", age: "Age", social: "Social Matrix", interests: "Interest Profile", visas: "Verified Visas", entry: "ENTRY", verified: "VERIFIED", noVisas: "Ready for stamps", save: "Save Passport", edit: "Edit Identity", logout: "Logout", username: "Username", language: "Current Language", rank: "Traveler Rank", miles: "Total Miles", progress: "Progress to next rank", categoryPoints: "Activity Matrix", admin: "Engine Room" },
    es: { title: "Pasaporte Global bdai", subtitle: "Credencial Nómada Digital", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad Origen", country: "País", birthday: "F. Nacimiento", age: "Edad", social: "Social Matrix", interests: "Perfil de Intereses", visas: "Visados Verificados", entry: "ENTRADA", verified: "VERIFICADO", noVisas: "Listo para sellos", save: "Guardar Pasaporte", edit: "Editar Identidad", logout: "Cerrar Sesión", username: "Usuario", language: "Idioma Actual", rank: "Rango del Viajero", miles: "Millas Totales", progress: "Progreso al siguiente rango", categoryPoints: "Matriz de Actividad", admin: "Sala de Máquinas" },
    pt: { title: "Passaporte Global bdai", subtitle: "Credencial Nômade Digital", surname: "Sobrenome", givenNames: "Nomes", city: "Cidade", country: "País", birthday: "Nascimento", age: "Idade", social: "Social Matrix", interests: "Interesses", visas: "Vistos Verificados", entry: "ENTRADA", verified: "VERIFICADO", noVisas: "Pronto para selos", save: "Salvar", edit: "Editar", logout: "Sair", username: "Usuário", language: "Idioma", rank: "Classificação", miles: "Milhas", progress: "Progresso", categoryPoints: "Matriz de Atividade", admin: "Sala de Máquinas" },
    it: { title: "Passaporto Global bdai", subtitle: "Credenziale Nomade Digitale", surname: "Cognome", givenNames: "Nomi", city: "Città", country: "Paese", birthday: "Nascita", age: "Età", social: "Social Matrix", interests: "Interessi", visas: "Visti Verificati", entry: "ENTRATA", verified: "VERIFICATO", noVisas: "Pronto per timbri", save: "Salva", edit: "Modifica", logout: "Esci", username: "Utente", language: "Lingua", rank: "Rango", miles: "Miglia", progress: "Progresso", categoryPoints: "Matrice di Attività", admin: "Sala Macchine" },
    fr: { title: "Passeport Global bdai", subtitle: "Identifiant Nomade Numérique", surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays", birthday: "Naissance", age: "Âge", social: "Social Matrix", interests: "Intérêts", visas: "Visas Vérifiés", entry: "ENTRÉE", verified: "VÉRIFIÉ", noVisas: "Prêt pour timbres", save: "Enregistrer", edit: "Modifier", logout: "Déconnexion", username: "Utilisateur", language: "Langue", rank: "Rang", miles: "Milles", progress: "Progression", categoryPoints: "Matrice d'Activité", admin: "Salle des Machines" },
    de: { title: "bdai Global Reisepass", subtitle: "Digitaler Nomade", surname: "Nachname", givenNames: "Vorname", city: "Stadt", country: "Land", birthday: "Geburtsdatum", age: "Alter", social: "Social Matrix", interests: "Interessen", visas: "Verifizierte Visa", entry: "EINTRITT", verified: "VERIFIZIERT", noVisas: "Bereit für Stempel", save: "Speichern", edit: "Bearbeiten", logout: "Abmelden", username: "Benutzername", language: "Sprache", rank: "Rang", miles: "Meilen", progress: "Fortschritt", categoryPoints: "Aktivitätsmatrix", admin: "Maschinenraum" },
    ru: { title: "Глобальный паспорт bdai", subtitle: "Цифровой кочевник", surname: "Фамилия", givenNames: "Имя", city: "Город", country: "Страна", birthday: "Дата рождения", age: "Возраст", social: "Social Matrix", interests: "Интересы", visas: "Визы", entry: "ВХОД", verified: "ПОДТВЕРЖДЕНО", noVisas: "Готов к штампам", save: "Сохранить", edit: "Изменить", logout: "Выйти", username: "Никнейм", language: "Язык", rank: "Ранг", miles: "Мили", progress: "Прогресс", categoryPoints: "Матрица активности", admin: "Машинный зал" },
    ja: { title: "bdai グローバルパスポート", subtitle: "デジタルノマド資格", surname: "姓", givenNames: "名", city: "都市", country: "国", birthday: "生年月日", age: "年齢", social: "Social Matrix", interests: "興味", visas: "ビザ", entry: "入場", verified: "認証済み", noVisas: "スタンプ準備完了", save: "保存", edit: "編集", logout: "ログアウト", username: "ユーザー名", language: "言語", rank: "ランク", miles: "マイル", progress: "進捗", categoryPoints: "活動マトリックス", admin: "エンジンルーム" },
    zh: { title: "bdai 全球护照", subtitle: "数字游民凭证", surname: "姓", givenNames: "名", city: "城市", country: "国家", birthday: "出生日期", age: "年龄", social: "Social Matrix", interests: "兴趣", visas: "已验证签证", entry: "入境", verified: "已验证", noVisas: "准备盖章", save: "保存", edit: "编辑", logout: "登出", username: "用户名", language: "语言", rank: "等级", miles: "里程", progress: "进度", categoryPoints: "活动矩阵", admin: "机房" },
    ar: { title: "جواز سفر bdai العالمي", subtitle: "هوية البدوي الرقمي", surname: "اللقب", givenNames: "الأسماء", city: "المدينة", country: "البلد", birthday: "تاريخ الميلاد", age: "العمر", social: "Social Matrix", interests: "الاهتمامات", visas: "تأشيرات مؤكدة", entry: "دخول", verified: "مؤكد", noVisas: "جاهز للأختام", save: "حفظ", edit: "تعديل", logout: "خروج", username: "اسم المستخدم", language: "اللغة", rank: "الرتبة", miles: "الأميال", progress: "التقدم", categoryPoints: "مصفوفة النشاط", admin: "غرفة المحركات" },
    ca: { title: "Passaport Global bdai", subtitle: "Credencial Nòmada Digital", surname: "Cognoms", givenNames: "Noms", city: "Ciutat", country: "País", birthday: "Naixement", age: "Edat", social: "Social Matrix", interests: "Interessos", visas: "Visats Verificats", entry: "ENTRADA", verified: "VERIFICAT", noVisas: "Llest per segells", save: "Desar", edit: "Editar", logout: "Sortir", username: "Usuari", language: "Idioma", rank: "Rang", miles: "Milles", progress: "Progrés", categoryPoints: "Matriu d'Activitat", admin: "Sala de Màquines" },
    eu: { title: "bdai Pasaporte Orokorra", subtitle: "Nomada Digitala", surname: "Abizenak", givenNames: "Izenak", city: "Hiria", country: "Herrialdea", birthday: "Jaiotze data", age: "Adina", social: "Social Matrix", interests: "Interesak", visas: "Visatuak", entry: "SARRERA", verified: "EGIAZTATUTA", noVisas: "Zigiluak jasotzeko prest", save: "Gorde", edit: "Aldatu", logout: "Irten", username: "Erabiltzailea", language: "Hizkuntza", rank: "Maila", miles: "Miliak", progress: "Aurrerapena", categoryPoints: "Jarduera Matrizea", admin: "Makina Gela" }
};

const ADMIN_EMAILS = ['admin@bdai.com', 'tu-email@gmail.com']; // Reemplaza con tu email real

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const pt = (key: string) => (MODAL_TEXTS[user.language] || MODAL_TEXTS['es'])[key] || key;

  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      city: user.city || '',
      country: user.country || '',
      bio: user.bio || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es',
      interests: user.interests || [],
      socialLinks: user.socialLinks || { instagram: '', tiktok: '', x: '', facebook: '' }
  });

  const handleSave = async () => {
      setIsSyncing(true);
      const birthDate = new Date(formData.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`, age: age };
      const result = await syncUserProfile(updatedUser);
      if (result.success) {
          if (onUpdateUser) onUpdateUser(updatedUser);
          setIsEditing(false);
      }
      setIsSyncing(false);
  };

  const ranks: TravelerRank[] = ['Turist', 'Explorer', 'Wanderer', 'Globe-Trotter', 'Legend'];
  const currentRankIndex = ranks.indexOf(user.rank || 'Turist');
  const nextRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;
  const currentThreshold = RANK_THRESHOLDS[user.rank || 'Turist'];
  const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : currentThreshold;
  const progressPercent = nextRank ? Math.min(100, Math.max(0, ((user.miles - currentThreshold) / (nextThreshold - currentThreshold)) * 100)) : 100;

  const isAdmin = ADMIN_EMAILS.includes(user.email);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-xl" onClick={onClose}></div>
      <div className="bg-[#f2efe4] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10 border-[8px] border-[#d4cfbd] flex flex-col max-h-[95vh] text-slate-900 font-sans">
        
        <div className="bg-[#7b1b1b] p-6 pb-8 flex flex-col gap-1 border-b-[8px] border-[#d4cfbd] shrink-0 pt-safe-iphone relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-slate-900 shadow-lg border-2 border-yellow-400"><i className="fas fa-id-badge text-2xl"></i></div>
                    <div>
                        <h2 className="text-yellow-500 font-black text-[11px] uppercase tracking-[0.4em] leading-none">{pt('title')}</h2>
                        <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest mt-1">{pt('subtitle')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isOwnProfile && (
                        <>
                            {isAdmin && onOpenAdmin && (
                                <button onClick={onOpenAdmin} className="w-12 h-12 rounded-2xl bg-slate-900 text-purple-400 flex items-center justify-center shadow-lg border border-purple-500/30">
                                    <i className="fas fa-microchip"></i>
                                </button>
                            )}
                            <button 
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                                disabled={isSyncing}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEditing ? 'bg-blue-600' : 'bg-white/10'} text-white shadow-lg`}
                            >
                                {isSyncing ? <i className="fas fa-spinner fa-spin"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'}`}></i>}
                            </button>
                            <button onClick={onLogout} className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg"><i className="fas fa-sign-out-alt"></i></button>
                        </>
                    )}
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10 pb-32">
            {/* Rank and Progress */}
            <div className="bg-white/40 p-6 rounded-3xl border border-slate-200">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-1">{pt('rank')}</p>
                        <h4 className="text-2xl font-black text-purple-600 uppercase tracking-tighter">{user.rank}</h4>
                    </div>
                    <div className="text-right">
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest mb-1">{pt('miles')}</p>
                        <h4 className="text-lg font-black text-slate-900">{user.miles.toLocaleString()}</h4>
                    </div>
                </div>
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-purple-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                </div>
            </div>

            {/* Photo and Core Identity */}
            <div className="flex gap-8 items-start">
                <div className="relative group shrink-0">
                    <div className="w-36 h-48 bg-white border-4 border-[#d4cfbd] rounded-xl shadow-2xl overflow-hidden flex items-center justify-center p-2 relative">
                        <img src={formData.avatar} className="w-full h-full object-cover filter contrast-110 saturate-[0.9] mix-blend-multiply" />
                        {isEditing && (
                            <button onClick={() => {
                                const nextIdx = (AVATARS.indexOf(formData.avatar) + 1) % AVATARS.length;
                                setFormData({...formData, avatar: AVATARS[nextIdx]});
                            }} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="fas fa-sync text-2xl"></i>
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="flex-1 space-y-4">
                    <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('givenNames')}</p>
                        {isEditing ? (
                            <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded-lg px-2 py-1 font-black text-sm uppercase" />
                        ) : (
                            <p className="font-black text-slate-800 uppercase text-lg">{formData.firstName || '---'}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('surname')}</p>
                        {isEditing ? (
                            <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded-lg px-2 py-1 font-black text-sm uppercase" />
                        ) : (
                            <p className="font-black text-slate-800 uppercase text-lg">{formData.lastName || '---'}</p>
                        )}
                    </div>
                    <div>
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('username')}</p>
                        <p className="font-black text-purple-600 text-sm uppercase">@{formData.username || 'traveler'}</p>
                    </div>
                </div>
            </div>

            {/* Full Activity Matrix (7 Categories) */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 px-1">
                    <i className="fas fa-chart-bar text-slate-800"></i> {pt('categoryPoints')}
                </h4>
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Cultura', points: user.culturePoints || 0, icon: 'fa-landmark', color: 'bg-amber-100 text-amber-600' },
                        { label: 'Gastro', points: user.foodPoints || 0, icon: 'fa-utensils', color: 'bg-emerald-100 text-emerald-600' },
                        { label: 'Foto', points: user.photoPoints || 0, icon: 'fa-camera', color: 'bg-purple-100 text-purple-600' },
                        { label: 'Historia', points: user.historyPoints || 0, icon: 'fa-fingerprint', color: 'bg-orange-100 text-orange-600' },
                        { label: 'Naturaleza', points: user.naturePoints || 0, icon: 'fa-leaf', color: 'bg-green-100 text-green-600' },
                        { label: 'Arte', points: user.artPoints || 0, icon: 'fa-palette', color: 'bg-pink-100 text-pink-600' },
                        { label: 'Arq', points: user.archPoints || 0, icon: 'fa-archway', color: 'bg-blue-100 text-blue-600' }
                    ].map(cat => (
                        <div key={cat.label} className="bg-white p-2 rounded-xl border border-slate-200 text-center shadow-sm">
                            <div className={`w-6 h-6 ${cat.color} rounded-lg flex items-center justify-center mx-auto mb-1`}><i className={`fas ${cat.icon} text-[10px]`}></i></div>
                            <p className="text-[9px] font-black text-slate-900">{cat.points}</p>
                            <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Birth and Location Fields */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <div>
                    <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('birthday')}</p>
                    {isEditing ? (
                        <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded-lg px-2 py-1 text-xs" />
                    ) : (
                        <p className="font-bold text-slate-800 text-sm">{formData.birthday || '---'}</p>
                    )}
                </div>
                <div>
                    <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('age')}</p>
                    <p className="font-bold text-slate-800 text-sm">{user.age || '--'}</p>
                </div>
                <div>
                    <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('city')}</p>
                    {isEditing ? (
                        <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded-lg px-2 py-1 text-xs" />
                    ) : (
                        <p className="font-bold text-slate-800 text-sm uppercase">{formData.city || '---'}</p>
                    )}
                </div>
                <div>
                    <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('country')}</p>
                    {isEditing ? (
                        <input value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded-lg px-2 py-1 text-xs" />
                    ) : (
                        <p className="font-bold text-slate-800 text-sm uppercase">{formData.country || '---'}</p>
                    )}
                </div>
            </div>

            {/* Verified Visas (Visited Cities) */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 px-1">
                    <i className="fas fa-passport text-slate-800"></i> {pt('visas')}
                </h4>
                <div className="flex flex-wrap gap-2">
                    {user.visitedCities?.length > 0 ? user.visitedCities.map(city => (
                        <div key={city} className="bg-slate-900 text-white px-3 py-1.5 rounded-full flex items-center gap-2 border border-slate-700 shadow-md">
                            <span className="text-[8px] font-black uppercase tracking-widest">{city}</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                    )) : (
                        <p className="text-[10px] text-slate-400 italic px-1">{pt('noVisas')}</p>
                    )}
                </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-6 pt-4 border-t border-slate-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 px-1">
                    <i className="fas fa-language text-slate-800"></i> {pt('language')}
                </h4>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
                    {LANGUAGES.map(lang => (
                        <button 
                            key={lang.code} 
                            onClick={() => setFormData(prev => ({ ...prev, language: lang.code }))} 
                            className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center bg-white shadow-sm shrink-0 ${formData.language === lang.code ? 'border-purple-600 scale-110' : 'border-transparent opacity-40'}`}
                        >
                            <FlagIcon code={lang.code} className="w-full h-full" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
