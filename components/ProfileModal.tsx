
import React, { useState, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, Badge, SocialLinks, INTEREST_OPTIONS, RANK_THRESHOLDS, TravelerRank, BADGE_DEFINITIONS } from '../types';
import { FlagIcon } from './FlagIcon';
import { generateAudio, cleanDescriptionText } from '../services/geminiService';
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
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad Credential", surname: "Surname", givenNames: "Given Names", city: "City of Origin", country: "Country", birthday: "Date of Birth", age: "Age", social: "Social Matrix", interests: "Interest Profile", visas: "Verified Visas", entry: "ENTRY", verified: "VERIFIED", noVisas: "Ready for stamps", save: "Save Passport", edit: "Edit Identity", logout: "Logout", username: "Username", audioMemory: "Listen Memory", linked: "Linked", language: "Current Language", rank: "Traveler Rank", miles: "Total Miles", syncing: "Syncing...", success: "Saved!", error: "Sync Error", dbHelp: "Run this in Supabase SQL Editor:", progress: "Progress to next rank", badges: "Achievement Log", categoryPoints: "Activity Matrix" },
    es: { title: "Pasaporte Global bdai", subtitle: "Credencial Nómada Digital", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad Origen", country: "País", birthday: "F. Nacimiento", age: "Edad", social: "Social Matrix", interests: "Perfil de Intereses", visas: "Visados Verificados", entry: "ENTRADA", verified: "VERIFICADO", noVisas: "Listo para sellos", save: "Guardar Pasaporte", edit: "Editar Identidad", logout: "Cerrar Sesión", username: "Usuario", audioMemory: "Escuchar Recuerdo", linked: "Vinculado", language: "Idioma Actual", rank: "Rango del Viajero", miles: "Millas Totales", syncing: "Sincronizando...", success: "¡Guardado!", error: "Error Sync", dbHelp: "Ejecuta esto en Supabase SQL Editor:", progress: "Progreso al siguiente rango", badges: "Logros de Viaje", categoryPoints: "Matriz de Actividad" },
    pt: { title: "Passaporte Global bdai", subtitle: "Credencial Nômade Digital", surname: "Apelidos", givenNames: "Nomes", city: "Cidade de Origem", country: "País", birthday: "Data de Nasc.", age: "Idade", social: "Matriz Social", interests: "Perfil de Interesses", visas: "Vistos Verificados", entry: "ENTRADA", verified: "VERIFICADO", noVisas: "Pronto para selos", save: "Salvar Passaporte", edit: "Editar Identidade", logout: "Sair", username: "Usuário", audioMemory: "Ouvir Memória", linked: "Vinculado", language: "Idioma Atual", rank: "Nível do Viajante", miles: "Milhas Totais", syncing: "Sincronizando...", success: "Salvo!", error: "Erro de Sincronização", progress: "Progresso para o próximo nível", badges: "Conquistas de Viagem", categoryPoints: "Matriz de Atividade" },
    it: { title: "Passaporto Globale bdai", subtitle: "Credenziale Nomad Digitale", surname: "Cognome", givenNames: "Nome", city: "Città di Origine", country: "Paese", birthday: "Data di Nascita", age: "Età", social: "Matrice Sociale", interests: "Profilo Interessi", visas: "Visti Verificati", entry: "INGRESSO", verified: "VERIFICATO", noVisas: "Pronto per i timbri", save: "Salva Passaporto", edit: "Modifica Identità", logout: "Esci", username: "Username", audioMemory: "Ascolta Ricordo", linked: "Collegato", language: "Lingua Attuale", rank: "Grado Viaggiatore", miles: "Miglia Totali", syncing: "Sincronizzazione...", success: "Salvato!", error: "Errore Sync", progress: "Progresso al prossimo grado", badges: "Log di Viaggio", categoryPoints: "Matrice Attività" },
    ru: { title: "Глобальный паспорт bdai", subtitle: "Удостоверение цифрового кочевника", surname: "Фамилия", givenNames: "Имя", city: "Город проживания", country: "Страна", birthday: "Дата рождения", age: "Возраст", social: "Социальная матрица", interests: "Профиль интересов", visas: "Визы", entry: "ВХОД", verified: "ПОДТВЕРЖДЕНО", noVisas: "Готов к штампам", save: "Сохранить паспорт", edit: "Изменить", logout: "Выйти", username: "Имя пользователя", audioMemory: "Слушать память", linked: "Связано", language: "Текущий язык", rank: "Ранг путешественника", miles: "Всего миль", syncing: "Синхронизация...", success: "Сохранено!", error: "Ошибка синхронизации", progress: "Прогресс до следующего ранга", badges: "Журнал достижений", categoryPoints: "Матрица активности" },
    hi: { title: "bdai वैश्विक पासपोर्ट", subtitle: "डिजिटल घुमंतू क्रेडेंशियल", surname: "उपनाम", givenNames: "नाम", city: "मूल शहर", country: "देश", birthday: "जन्म तिथि", age: "आयु", social: "सामाजिक मैट्रिक्स", interests: "रुचि प्रोफ़ाइल", visas: "सत्यापित वीज़ा", entry: "प्रवेश", verified: "सत्यापित", noVisas: "मुहरों के लिए तैयार", save: "पासपोर्ट सहेजें", edit: "पहचान बदलें", logout: "लॉग आउट", username: "उपयोगकर्ता नाम", audioMemory: "स्मृति सुनें", linked: "जुड़ा हुआ", language: "वर्तमान भाषा", rank: "यात्री रैंक", miles: "कुल मील", syncing: "सिंक्रनाइज़ हो रहा है...", success: "सहेजा गया!", error: "सिंक त्रुटि", progress: "अगले रैंक की ओर प्रगति", badges: "उपलब्धि लॉग", categoryPoints: "गतिविधि मैट्रिक्स" },
    fr: { title: "Passeport Global bdai", subtitle: "Identifiant Nomade Numérique", surname: "Nom", givenNames: "Prénoms", city: "Ville d'origine", country: "Pays", birthday: "Date de naissance", age: "Âge", social: "Matrice Sociale", interests: "Profil d'intérêts", visas: "Visas Vérifiés", entry: "ENTRÉE", verified: "VÉRIFIÉ", noVisas: "Prêt pour tampons", save: "Sauvegarder", edit: "Modifier", logout: "Déconnexion", username: "Nom d'utilisateur", audioMemory: "Écouter souvenir", linked: "Lié", language: "Langue actuelle", rank: "Rang voyageur", miles: "Milles Totaux", syncing: "Synchronisation...", success: "Enregistré!", error: "Erreur Sync", progress: "Progrès vers le prochain rang", badges: "Journal des succès", categoryPoints: "Matrice d'activité" },
    de: { title: "bdai Globaler Pass", subtitle: "Digitaler Nomaden-Ausweis", surname: "Nachname", givenNames: "Vorname", city: "Herkunftsort", country: "Land", birthday: "Geburtsdatum", age: "Alter", social: "Soziale Matrix", interests: "Interessenprofil", visas: "Visa", entry: "EINTRITT", verified: "VERIFIZIERT", noVisas: "Bereit für Stempel", save: "Pass speichern", edit: "Identität bearbeiten", logout: "Abmelden", username: "Nutzername", audioMemory: "Erinnerung hören", linked: "Verbunden", language: "Aktuelle Sprache", rank: "Reiserrang", miles: "Gesamtmeilen", syncing: "Synchronisierung...", success: "Gespeichert!", error: "Sync-Fehler", progress: "Fortschritt zum nächsten Rang", badges: "Erfolge", categoryPoints: "Aktivitätsmatrix" },
    ja: { title: "bdai グローバルパスポート", subtitle: "デジタルノマド資格", surname: "苗字", givenNames: "名前", city: "出身都市", country: "国", birthday: "生年月日", age: "年齢", social: "ソーシャルマトリックス", interests: "興味プロファイル", visas: "確認済みビザ", entry: "入国", verified: "確認済み", noVisas: "スタンプの準備完了", save: "パスポートを保存", edit: "IDを編集", logout: "ログアウト", username: "ユーザー名", audioMemory: "思い出を聴く", linked: "リンク済み", language: "現在の言語", rank: "トラベラーランク", miles: "合計マイル", syncing: "同期中...", success: "保存完了！", error: "同期エラー", progress: "次のランクへの進捗", badges: "達成ログ", categoryPoints: "活動マトリックス" },
    zh: { title: "bdai 全球护照", subtitle: "数字游民凭证", surname: "姓", givenNames: "名", city: "出生城市", country: "国家", birthday: "出生日期", age: "年龄", social: "社交矩阵", interests: "兴趣配置", visas: "已验证签证", entry: "入境", verified: "已验证", noVisas: "准备盖章", save: "保存护照", edit: "编辑身份", logout: "登出", username: "用户名", audioMemory: "聆听回忆", linked: "已链接", language: "当前语言", rank: "旅行者等级", miles: "总里程", syncing: "同步中...", success: "已保存！", error: "同步错误", progress: "升级进度", badges: "成就日志", categoryPoints: "活动矩阵" },
    ar: { title: "جواز سفر bdai العالمي", subtitle: "اعتماد الرحالة الرقمي", surname: "اللقب", givenNames: "الأسماء", city: "مدينة الأصل", country: "البلد", birthday: "تاريخ الميلاد", age: "العمر", social: "المصفوفة الاجتماعية", interests: "ملف الاهتمامات", visas: "تأشيرات موثقة", entry: "دخول", verified: "موثق", noVisas: "جاهز للأختام", save: "حفظ الجواز", edit: "تعديل الهوية", logout: "تسجيل الخروج", username: "اسم المستخدم", audioMemory: "استماع للذكرى", linked: "مرتبط", language: "اللغة الحالية", rank: "رتبة المسافر", miles: "إجمالي الأميال", syncing: "جاري المزامنة...", success: "تم الحفظ!", error: "خطأ في المزامنة", progress: "التقدم نحو الرتبة التالية", badges: "سجل الإنجازات", categoryPoints: "مصفوفة النشاط" },
    ca: { title: "Passaport Global bdai", subtitle: "Credencial Nòmada Digital", surname: "Cognoms", givenNames: "Noms", city: "Ciutat Origen", country: "País", birthday: "F. Naixement", age: "Edat", social: "Matriu Social", interests: "Perfil d'Interessos", visas: "Visats Verificats", entry: "ENTRADA", verified: "VERIFICAT", noVisas: "Llest per a segells", save: "Desar Passaport", edit: "Editar Identitat", logout: "Tancar Sessió", username: "Usuari", audioMemory: "Escoltar Record", linked: "Vinculat", language: "Idioma Actual", rank: "Rang del Viatger", miles: "Milles Totals", syncing: "Sincronitzant...", success: "Desat!", error: "Error Sync", progress: "Progrés al següent rang", badges: "Logros de Viatge", categoryPoints: "Matriu d'Activitat" },
    eu: { title: "bdai Pasaporte Globala", subtitle: "Nomada Digital Kredentziala", surname: "Abizenak", givenNames: "Izenak", city: "Jatorrizko Hiria", country: "Herrialdea", birthday: "Jaiotze Data", age: "Adina", social: "Matrize Soziala", interests: "Interes Profila", visas: "Bisa Egiaztatuak", entry: "SARRERA", verified: "EGIAZTATUTA", noVisas: "Zigiluetarako prest", save: "Pasaportea Gorde", edit: "Identitatea Aldatu", logout: "Saioa Itxi", username: "Erabiltzailea", audioMemory: "Oroitzapena Entzun", linked: "Lotuta", language: "Hizkuntza", rank: "Bidaiari Maila", miles: "Milia Guztira", syncing: "Sinkronizatzen...", success: "Gordeta!", error: "Errorea", progress: "Hurrengo mailarako aurrerapena", badges: "Lorpenak", categoryPoints: "Jarduera Matrizea" }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, isOwnProfile, onUpdateUser, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error' | 'partial'>('idle');
  const [syncErrorMessage, setSyncErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pt = (key: string) => (MODAL_TEXTS[user.language] || MODAL_TEXTS['es'])[key] || key;

  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || '',
      country: user.country || '',
      bio: user.bio || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es',
      interests: user.interests || [],
      socialLinks: user.socialLinks || { instagram: '', tiktok: '', x: '', facebook: '' }
  });

  const handleLanguageChange = (code: string) => {
    setFormData(prev => ({ ...prev, language: code }));
  };

  const handleSave = async () => {
      setIsSyncing(true);
      setSyncStatus('idle');
      
      const birthDate = new Date(formData.birthday);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`, age: age };
      
      const result = await syncUserProfile(updatedUser);
      
      if (result.success) {
          if (onUpdateUser) onUpdateUser(updatedUser);
          setSyncStatus(result.needsMigration ? 'partial' : 'success');
          setTimeout(() => {
              if (!result.needsMigration) {
                setIsEditing(false);
                setSyncStatus('idle');
              }
          }, 2000);
      } else {
          setSyncStatus('error');
          setSyncErrorMessage(result.error || 'Desconocido');
      }
      setIsSyncing(false);
  };

  const ranks: TravelerRank[] = ['Turist', 'Explorer', 'Wanderer', 'Globe-Trotter', 'Legend'];
  const currentRankIndex = ranks.indexOf(user.rank || 'Turist');
  const nextRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;
  const currentThreshold = RANK_THRESHOLDS[user.rank || 'Turist'];
  const nextThreshold = nextRank ? RANK_THRESHOLDS[nextRank] : currentThreshold;
  const progressPercent = nextRank ? Math.min(100, Math.max(0, ((user.miles - currentThreshold) / (nextThreshold - currentThreshold)) * 100)) : 100;

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
                            <button 
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                                disabled={isSyncing}
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEditing ? (syncStatus === 'success' ? 'bg-green-600' : syncStatus === 'error' ? 'bg-red-600' : 'bg-blue-600') : 'bg-white/10'} text-white shadow-lg`}
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
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center">
                    {nextRank ? `${pt('progress')}: ${(nextThreshold - user.miles).toLocaleString()} miles to ${nextRank}` : 'MAX RANK ACHIEVED'}
                </p>
            </div>

            <div className="flex gap-8 items-start">
                <div className="relative group shrink-0">
                    <div className="w-36 h-48 bg-white border-4 border-[#d4cfbd] rounded-xl shadow-2xl overflow-hidden flex items-center justify-center p-2 relative">
                        <img src={formData.avatar} className="w-full h-full object-cover filter contrast-110 saturate-[0.9] mix-blend-multiply" />
                        <div className="absolute inset-0 bg-[#f2efe4]/10 mix-blend-overlay"></div>
                        {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}><i className="fas fa-camera text-white text-3xl"></i></div>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { const r = new FileReader(); r.onloadend = () => setFormData(p => ({...p, avatar: r.result as string})); r.readAsDataURL(file); }
                    }} />
                </div>
                
                <div className="flex-1 space-y-6">
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('username')}</p>
                        <p className="font-black text-purple-600 text-lg uppercase tracking-tight">{formData.username || 'traveler'}</p>
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('surname')}</p>
                        <p className="font-black text-slate-800 uppercase truncate text-lg tracking-tight">{formData.lastName || '---'}</p>
                    </div>
                    <div className="border-b border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('givenNames')}</p>
                        <p className="font-black text-slate-800 uppercase truncate text-lg tracking-tight">{formData.firstName || '---'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 px-1">
                    <i className="fas fa-chart-bar text-slate-800"></i> {pt('categoryPoints')}
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Cultura', points: user.culturePoints || 0, icon: 'fa-landmark', color: 'bg-amber-100 text-amber-600' },
                        { label: 'Gastro', points: user.foodPoints || 0, icon: 'fa-utensils', color: 'bg-emerald-100 text-emerald-600' },
                        { label: 'Foto', points: user.photoPoints || 0, icon: 'fa-camera', color: 'bg-purple-100 text-purple-600' }
                    ].map(cat => (
                        <div key={cat.label} className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-sm">
                            <div className={`w-8 h-8 ${cat.color} rounded-xl flex items-center justify-center mx-auto mb-2`}><i className={`fas ${cat.icon} text-xs`}></i></div>
                            <p className="text-[10px] font-black text-slate-900">{cat.points}</p>
                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{cat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 px-1">
                    <i className="fas fa-award text-slate-800"></i> {pt('badges')}
                </h4>
                <div className="grid grid-cols-4 gap-4 bg-white/50 p-6 rounded-3xl border border-slate-200 border-dashed">
                    {BADGE_DEFINITIONS.map(badgeDef => {
                        const isEarned = user.badges?.some(b => b.id === badgeDef.id);
                        return (
                            <div key={badgeDef.id} className="flex flex-col items-center gap-2 group relative">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 ${isEarned ? 'bg-purple-600 text-white shadow-lg scale-110' : 'bg-slate-200 text-slate-400 opacity-30 grayscale'}`}>
                                    <i className={`fas ${badgeDef.icon}`}></i>
                                </div>
                                <span className={`text-[7px] font-black uppercase tracking-widest text-center leading-tight ${isEarned ? 'text-slate-800' : 'text-slate-400'}`}>
                                    {badgeDef.name}
                                </span>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-slate-900 text-white text-[7px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center uppercase tracking-widest font-bold">
                                    {badgeDef.description}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-6 pt-4 border-t border-slate-200">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3 px-1"><i className="fas fa-language text-slate-800"></i> {pt('language')}</h4>
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-1">
                    {LANGUAGES.map(lang => (
                        <div key={lang.code} className="flex flex-col items-center gap-2 shrink-0">
                            <button 
                                onClick={() => handleLanguageChange(lang.code)} 
                                className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all flex items-center justify-center bg-white shadow-sm ${formData.language === lang.code ? 'border-purple-600 scale-110 shadow-lg ring-4 ring-purple-500/10' : 'border-transparent opacity-40 grayscale-[0.5]'}`}
                            >
                                <FlagIcon code={lang.code} className="w-full h-full" />
                            </button>
                            <span className={`text-[8px] font-black uppercase tracking-widest ${formData.language === lang.code ? 'text-purple-600' : 'text-slate-400'}`}>{lang.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
