
import React, { useState } from 'react';
import { UserProfile, LANGUAGES, AVATARS } from '../types';
import { FlagIcon } from './FlagIcon';
import { syncUserProfile } from '../services/supabaseClient';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  language?: string;
}

const MODAL_TEXTS: any = {
    es: { title: "Pasaporte Global bdai", subtitle: "Nómada Digital ID", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País", age: "Edad", birthday: "F. Nacimiento", categoryPoints: "Actividad Técnica", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión", stamps: "Mis Visados", visibility: "Visibilidad", public: "Público", private: "Privado", langLabel: "Idioma", user_id: "ID_USUARIO", rank: "RANGO", miles: "MILLAS", admin: "SALA DE MÁQUINAS", emptyStamps: "Sin visados registrados aún", cats: { Hist: "Hist", Gast: "Gast", Arte: "Arte", Natu: "Natu", Foto: "Foto", Cult: "Cult", Arqu: "Arqu" } },
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad ID", surname: "Surname", givenNames: "Given Names", city: "City", country: "Country", age: "Age", birthday: "Birthdate", categoryPoints: "Technical Activity", save: "Save", edit: "Edit", logout: "Logout", stamps: "My Visas", visibility: "Visibility", public: "Public", private: "Private", langLabel: "Language", user_id: "USER_ID", rank: "RANK", miles: "MILES", admin: "ADMIN PANEL", emptyStamps: "No stamps recorded yet", cats: { Hist: "Hist", Gast: "Food", Arte: "Art", Natu: "Natu", Foto: "Photo", Cult: "Cult", Arqu: "Arch" } },
    zh: { title: "bdai 全球护照", subtitle: "数字游民 ID", surname: "姓", givenNames: "名", city: "城市", country: "国家", age: "年龄", birthday: "出生日期", categoryPoints: "技术活动", save: "保存", edit: "编辑", logout: "注销", stamps: "签证", visibility: "可见性", public: "公开", private: "私密", langLabel: "语言", user_id: "用户ID", rank: "等级", miles: "里程", admin: "机房", emptyStamps: "暂无签证记录", cats: { Hist: "历史", Gast: "美食", Arte: "艺术", Natu: "自然", Foto: "摄影", Cult: "文化", Arqu: "建筑" } },
    ja: { title: "bdai グローバルパスポート", subtitle: "デジタルノマド ID", surname: "姓（Surname）", givenNames: "名（Given Names）", city: "都市名", country: "国名", age: "年齢", birthday: "生年月日", categoryPoints: "アクティビティ履歴", save: "保存", edit: "編集", logout: "ログアウト", stamps: "入国スタンプ", visibility: "公開設定", public: "公開", private: "非公開", langLabel: "言語設定", user_id: "ユーザーID", rank: "ランク", miles: "マイル", admin: "管理パネル", emptyStamps: "スタンプはまだありません", cats: { Hist: "歴史", Gast: "美食", Arte: "アート", Natu: "自然", Foto: "写真", Cult: "文化", Arqu: "建築" } },
    ca: { title: "Passaport Global bdai", subtitle: "ID de Nòmada Digital", surname: "Cognoms", givenNames: "Noms", city: "Ciutat", country: "País", age: "Edat", birthday: "F. Naixement", categoryPoints: "Activitat Tècnica", save: "Desar", edit: "Editar", logout: "Tancar Sessió", stamps: "Els Meus Visats", visibility: "Visibilitat", public: "Públic", private: "Privat", langLabel: "Idioma", user_id: "ID_USUARI", rank: "RANG", miles: "MILLES", admin: "SALA DE MÀQUINES", emptyStamps: "Sense visats registrats encara", cats: { Hist: "Hist", Gast: "Gast", Arte: "Art", Natu: "Natu", Foto: "Foto", Cult: "Cult", Arqu: "Arqu" } },
    eu: { title: "bdai Pasaporte Globala", subtitle: "Nomada Digital ID", surname: "Abizenak", givenNames: "Izenak", city: "Hiria", country: "Herrialdea", age: "Adina", birthday: "Jaiotze data", categoryPoints: "Jarduera Teknikoa", save: "Gorde", edit: "Editatu", logout: "Saioa Itxi", stamps: "Nire Bisatuak", visibility: "Ikusgarritasuna", public: "Publikoa", private: "Pribatua", langLabel: "Hizkuntza", user_id: "ERABILTZAILE_ID", rank: "RANGOA", miles: "MILIAK", admin: "MAKINA GELA", emptyStamps: "Bisaturik gabe oraindik", cats: { Hist: "Hist", Gast: "Gast", Arte: "Arte", Natu: "Natu", Foto: "Foto", Cult: "Kult", Arqu: "Ark" } },
    pt: { title: "Passaporte Global bdai", subtitle: "ID de Nômade Digital", surname: "Sobrenome", givenNames: "Nomes", city: "Cidade", country: "País", age: "Idade", birthday: "D. Nascimento", categoryPoints: "Atividade Técnica", save: "Salvar", edit: "Editar", logout: "Sair", stamps: "Meus Vistos", visibility: "Visibilidade", public: "Público", private: "Privado", langLabel: "Idioma", user_id: "ID_USUÁRIO", rank: "NÍVEL", miles: "MILHAS", admin: "PAINEL ADMIN", emptyStamps: "Nenhum visto registrado ainda", cats: { Hist: "Hist", Gast: "Gast", Arte: "Arte", Natu: "Natu", Foto: "Foto", Cult: "Cult", Arqu: "Arqu" } },
    fr: { title: "Passeport Global bdai", subtitle: "ID Nomade Numérique", surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays", age: "Âge", birthday: "Date de Naissance", categoryPoints: "Activité Technique", save: "Enregistrer", edit: "Modifier", logout: "Déconnexion", stamps: "Mes Visas", visibility: "Visibilité", public: "Public", private: "Privé", langLabel: "Langue", user_id: "ID_UTILISATEUR", rank: "RANG", miles: "MILES", admin: "PANNEAU ADMIN", emptyStamps: "Aucun visa enregistré pour le moment", cats: { Hist: "Hist", Gast: "Gast", Arte: "Art", Natu: "Natu", Foto: "Photo", Cult: "Cult", Arqu: "Arch" } },
    de: { title: "bdai Globaler Reisepass", subtitle: "Digitaler Nomade ID", surname: "Nachname", givenNames: "Vornamen", city: "Stadt", country: "Land", age: "Alter", birthday: "Geburtsdatum", categoryPoints: "Technische Aktivität", save: "Speichern", edit: "Bearbeiten", logout: "Abmelden", stamps: "Meine Visa", visibility: "Sichtbarkeit", public: "Öffentlich", private: "Privat", langLabel: "Sprache", user_id: "BENUTZER_ID", rank: "RANG", miles: "MEILEN", admin: "ADMIN-PANEL", emptyStamps: "Noch keine Visa registriert", cats: { Hist: "Hist", Gast: "Gast", Arte: "Kunst", Natu: "Natu", Foto: "Foto", Cult: "Kult", Arqu: "Arch" } },
    it: { title: "Passaporto Globale bdai", subtitle: "ID Nomade Digitale", surname: "Cognome", givenNames: "Nomi", city: "Città", country: "Paese", age: "Età", birthday: "Data di Nascita", categoryPoints: "Attività Tecnica", save: "Salva", edit: "Modifica", logout: "Logout", stamps: "I Miei Visti", visibility: "Visibilità", public: "Pubblico", private: "Privato", langLabel: "Lingua", user_id: "ID_UTENTE", rank: "RANGO", miles: "MIGLIA", admin: "PANNELLO ADMIN", emptyStamps: "Nessun visto ancora registrato", cats: { Hist: "Stora", Gast: "Gast", Arte: "Arte", Natu: "Natu", Foto: "Foto", Cult: "Cult", Arqu: "Arch" } },
    ru: { title: "Глобальный паспорт bdai", subtitle: "ID цифрового кочевника", surname: "Фамилия", givenNames: "Имя", city: "Город", country: "Страна", age: "Возраст", birthday: "Дата рождения", categoryPoints: "Активность", save: "Сохранить", edit: "Редактировать", logout: "Выйти", stamps: "Мои визы", visibility: "Видимость", public: "Публичный", private: "Приватный", langLabel: "Язык", user_id: "ID_ПОЛЬЗОВАТЕЛЯ", rank: "РАНГ", miles: "МИЛИ", admin: "АДМИН-ПАНЕЛЬ", emptyStamps: "Визы еще не зарегистрированы", cats: { Hist: "Ист", Gast: "Гаст", Arte: "Арт", Natu: "Прир", Foto: "Фото", Cult: "Культ", Arqu: "Арх" } },
    hi: { title: "bdai वैश्विक पासपोर्ट", subtitle: "डिजिटल नोमैड आईडी", surname: "उपनाम", givenNames: "नाम", city: "शहर", country: "देश", age: "आयु", birthday: "जन्म तिथि", categoryPoints: "तकनीकी गतिविधि", save: "सहेजें", edit: "संपादित करें", logout: "लॉगआउट", stamps: "मेरे वीजा", visibility: "दृश्यता", public: "सार्वजनिक", private: "निजी", langLabel: "भाषा", user_id: "यूज़र आईडी", rank: "रैंक", miles: "मील", admin: "एडमिन पैनल", emptyStamps: "अभी तक कोई वीजा नहीं", cats: { Hist: "इति", Gast: "गैस्ट", Arte: "कला", Natu: "प्रकृ", Foto: "फोटो", Cult: "संस्कृ", Arqu: "वास्तु" } },
    ko: { title: "bdai 글로벌 여권", subtitle: "디지털 노마드 ID", surname: "성", givenNames: "이름", city: "도시", country: "국가", age: "나이", birthday: "생년월일", categoryPoints: "기술 활동", save: "저장", edit: "편집", logout: "로그아웃", stamps: "나의 비자", visibility: "공개 여부", public: "공개", private: "비공개", langLabel: "언어", user_id: "사용자 ID", rank: "등급", miles: "마일", admin: "관리자 패널", emptyStamps: "등록된 비자가 없습니다", cats: { Hist: "역사", Gast: "미식", Arte: "예술", Natu: "자연", Foto: "사진", Cult: "문화", Arqu: "건축" } },
    tr: { title: "bdai Küresel Pasaport", subtitle: "Dijital Göçebe ID", surname: "Soyadı", givenNames: "İsimler", city: "Şehir", country: "Ülke", age: "Yaş", birthday: "Doğum Tarihi", categoryPoints: "Teknik Aktivite", save: "Kaydet", edit: "Düzenle", logout: "Çıkış Yap", stamps: "Vizelerim", visibility: "Görünürlük", public: "Açık", private: "Gizli", langLabel: "Dil", user_id: "KULLANICI_ID", rank: "RÜTBE", miles: "MİLLER", admin: "YÖNETİM PANELİ", emptyStamps: "Henüz vize kaydedilmedi", cats: { Hist: "Tar", Gast: "Gast", Arte: "Sanat", Natu: "Doğa", Foto: "Foto", Cult: "Kült", Arqu: "Mim" } },
    ar: { title: "bdai جواز السفر العالمي", subtitle: "هوية البدوي الرقمي", surname: "اللقب", givenNames: "الأسماء", city: "المدينة", country: "البلد", age: "العمر", birthday: "تاريخ الميلاد", categoryPoints: "النشاط التقني", save: "حفظ", edit: "تعديل", logout: "تسجيل الخروج", stamps: "تأشيراتي", visibility: "الخصوصية", public: "عام", private: "خاص", langLabel: "اللغة", user_id: "معرف المستخدم", rank: "الرتبة", miles: "الأميال", admin: "لوحة التحكم", emptyStamps: "لا توجد تأشيرات مسجلة بعد", cats: { Hist: "تاريخ", Gast: "طهي", Arte: "فن", Natu: "طبيعة", Foto: "صورة", Cult: "ثقافة", Arqu: "عمارة" } }
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || '',
      country: user.country || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es',
      isPublic: user.isPublic ?? false
  });

  // Helper function to get translated text based on current formData language
  const pt = (key: string) => {
    const lang = formData.language || 'es';
    return (MODAL_TEXTS[lang] || MODAL_TEXTS['es'])[key] || (MODAL_TEXTS['es'])[key] || key;
  };

  // Helper for categories labels
  const getCats = () => {
    const lang = formData.language || 'es';
    return (MODAL_TEXTS[lang] || MODAL_TEXTS['es']).cats || MODAL_TEXTS['es'].cats;
  };

  const cats = getCats();
  const isAdmin = user.email === 'travelbdai@gmail.com';

  const handleSave = async () => {
      setIsSyncing(true);
      try {
          const birthDate = new Date(formData.birthday);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`, age: age };
          await syncUserProfile(updatedUser);
          if (onUpdateUser) onUpdateUser(updatedUser);
          setIsEditing(false);
      } catch (e) {
          console.error("Save error:", e);
      } finally {
          setIsSyncing(false);
      }
  };

  const activityCategories = [
    { label: cats.Hist, points: user.historyPoints || 0 },
    { label: cats.Gast, points: user.foodPoints || 0 },
    { label: cats.Arte, points: user.artPoints || 0 },
    { label: cats.Natu, points: user.naturePoints || 0 },
    { label: cats.Foto, points: user.photoPoints || 0 },
    { label: cats.Cult, points: user.culturePoints || 0 },
    { label: cats.Arqu, points: user.archPoints || 0 }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" onClick={onClose}></div>
      <div className="bg-[#f3f0e6] w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border-[3px] border-[#d7d2c3] flex flex-col max-h-[95vh] text-slate-900">
        <div className="bg-[#8b2b2b] p-5 flex justify-between items-center shrink-0 border-b-2 border-[#d7d2c3]">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-slate-900 border border-yellow-400 shadow-md"><i className="fas fa-id-card text-xs"></i></div>
                <div>
                    <h2 className="text-yellow-500 font-black text-[10px] uppercase tracking-widest leading-none">{pt('title')}</h2>
                    <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest mt-1">{pt('subtitle')}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEditing ? 'bg-blue-600' : 'bg-white/10'} text-white transition-all`}>
                    {isSyncing ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'} text-xs`}></i>}
                </button>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
            <div className="flex gap-6 items-start">
                <div className="shrink-0 w-28 h-36 bg-white border-2 border-[#d7d2c3] rounded-xl shadow-lg overflow-hidden flex items-center justify-center p-1 relative">
                    <img src={formData.avatar} className="w-full h-full object-cover grayscale contrast-125 saturate-0" />
                </div>
                <div className="flex-1 space-y-4">
                    <div className="pb-2 border-b border-slate-200">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('user_id')}</p>
                        <p className="font-black text-slate-900 uppercase text-xs truncate leading-none">{formData.username}</p>
                    </div>
                    <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('givenNames')}</p>{isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] font-bold uppercase" /> : <p className="font-black text-slate-800 uppercase text-xs leading-none">{formData.firstName || '---'}</p>}</div>
                    <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('surname')}</p>{isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] font-bold uppercase" /> : <p className="font-black text-slate-800 uppercase text-xs leading-none">{formData.lastName || '---'}</p>}</div>
                    <div className="flex justify-between border-t border-slate-200 pt-3">
                        <div><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('rank')}</p><p className="font-black text-purple-600 text-[9px] uppercase mt-1">{user.rank}</p></div>
                        <div className="text-right"><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('miles')}</p><p className="font-black text-slate-900 text-[9px] mt-1">{user.miles.toLocaleString()}</p></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5 border-t border-slate-300 pt-5">
                <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('city')}</p>{isEditing ? <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.city || '---'}</p>}</div>
                <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('birthday')}</p>{isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.birthday || '---'}</p>}</div>
            </div>

            <div className="pt-2">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 border-b border-slate-200 pb-2">{pt('stamps')}</h4>
                <div className="flex gap-5 overflow-x-auto no-scrollbar pb-8 min-h-[100px] pt-2 px-1">
                    {user.stamps && user.stamps.length > 0 ? (
                        user.stamps.map((stamp, i) => (
                            <div key={i} className="shrink-0 w-20 h-20 rounded-full border-[3px] border-[#8b2b2b]/40 bg-white/90 flex flex-col items-center justify-center text-center shadow-[10px_10px_20px_rgba(0,0,0,0.3)] rotate-[-12deg] p-2 border-dashed transition-transform hover:scale-110 active:scale-95">
                                <span className="text-[6px] font-black uppercase leading-none text-[#8b2b2b] tracking-tighter">{stamp.country}</span>
                                <span className="text-[8px] font-black uppercase text-slate-900 my-0.5 tracking-tight border-y border-[#8b2b2b]/20 py-0.5 w-full">{stamp.city}</span>
                                <span className="text-[5px] font-bold text-slate-400 uppercase">{stamp.date}</span>
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-16 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center opacity-40 italic text-[9px]">
                            {pt('emptyStamps')}
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-2">
                <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 border-b border-slate-200 pb-2">{pt('categoryPoints')}</h4>
                <div className="grid grid-cols-4 gap-2">
                    {activityCategories.map(cat => (
                        <div key={cat.label} className="bg-white/40 border border-slate-200 p-2 rounded-xl text-center flex flex-col items-center">
                            <p className="text-xs font-black text-slate-900 leading-none">{cat.points}</p>
                            <p className="text-[5px] font-black text-slate-400 uppercase tracking-widest mt-1 truncate w-full">{cat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-5 border-t border-slate-300">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-4 tracking-widest">{pt('langLabel')}</p>
                <div className="grid grid-cols-5 gap-3 mb-8">
                    {LANGUAGES.map(lang => (
                        <button key={lang.code} onClick={() => { setFormData({...formData, language: lang.code}); if(onUpdateUser) onUpdateUser({...user, language: lang.code}); }} className="transition-all active:scale-90">
                            <FlagIcon code={lang.code} className={`w-7 h-7 ${formData.language === lang.code ? 'ring-2 ring-purple-600 shadow-lg' : 'opacity-30 grayscale'}`} />
                        </button>
                    ))}
                </div>

                {isAdmin && (
                    <button onClick={onOpenAdmin} className="w-full py-4 mb-3 bg-slate-900 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95">
                        <i className="fas fa-tools text-xs"></i> {pt('admin')}
                    </button>
                )}

                <button onClick={onLogout} className="w-full py-4 border border-red-100 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95">
                    {pt('logout')}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
