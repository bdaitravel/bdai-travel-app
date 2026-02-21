import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, APP_BADGES } from '../types';
import { syncUserProfile } from '../services/supabaseClient';
import { translations } from '../data/translations';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  language?: string;
  onLangChange?: (code: string) => void;
}

const MODAL_TEXTS: any = {
    es: { title: "Pasaporte Global bdai", subtitle: "Nómada Digital ID", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País", age: "Edad", birthday: "Nacimiento", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión", stamps: "Mis Visados", badges: "Insignias", langLabel: "Idioma", rank: "RANGO", miles: "MILLAS", admin: "ADMIN", streak: "Racha", changeAvatar: "Cambiar Foto", email: "Correo Electrónico" },
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad ID", surname: "Surname", givenNames: "Given Names", city: "City", country: "Country", age: "Age", birthday: "Birthdate", save: "Save", edit: "Edit", logout: "Logout", stamps: "My Visas", badges: "Badges", langLabel: "Language", rank: "RANK", miles: "MILES", admin: "ADMIN", streak: "Streak", changeAvatar: "Change Photo", email: "Email Address" },
    fr: { title: "Passeport Global bdai", subtitle: "ID Nomade Numérique", surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays", age: "Âge", birthday: "Naissance", save: "Enregistrer", edit: "Modifier", logout: "Déconnexion", stamps: "Mes Visas", badges: "Badges", langLabel: "Langue", rank: "RANG", miles: "MILES", admin: "ADMIN", streak: "Série", changeAvatar: "Changer Photo" },
    it: { title: "Passaporto Globale bdai", subtitle: "ID Nomade Digitale", surname: "Cognome", givenNames: "Nomi", city: "Città", country: "Paese", age: "Età", birthday: "F. Nascita", save: "Salva", edit: "Modifica", logout: "Esci", stamps: "I Miei Visti", badges: "Distintivi", langLabel: "Lingua", rank: "RANGO", miles: "MIGLIA", admin: "ADMIN", streak: "Serie", changeAvatar: "Cambia Foto" },
    de: { title: "bdai Globaler Pass", subtitle: "Digital Nomad ID", surname: "Nachname", givenNames: "Vornamen", city: "Stadt", country: "Land", age: "Alter", birthday: "Geburtstag", save: "Speichern", edit: "Bearbeiten", logout: "Abmelden", stamps: "Meine Visa", badges: "Abzeichen", langLabel: "Sprache", rank: "RANG", miles: "MEILEN", admin: "ADMIN", streak: "Serie", changeAvatar: "Foto ändern" },
    pt: { title: "Passaporte Global bdai", subtitle: "ID Nómada Digital", surname: "Apelido", givenNames: "Nomes", city: "Cidade", country: "País", age: "Idade", birthday: "Nascimento", save: "Guardar", edit: "Editar", logout: "Sair", stamps: "Meus Vistos", badges: "Distintivos", langLabel: "Idioma", rank: "RANKING", miles: "MILHAS", admin: "ADMIN", streak: "Sequência", changeAvatar: "Mudar Foto" },
    ro: { title: "Pașaport Global bdai", subtitle: "ID Nomad Digital", surname: "Nume", givenNames: "Prenume", city: "Oraș", country: "Țară", age: "Vârstă", birthday: "Naștere", save: "Salvare", edit: "Editare", logout: "Deconectare", stamps: "Vizele Mele", badges: "Insigne", langLabel: "Limbă", rank: "RANG", miles: "MILE", admin: "ADMIN", streak: "Serie", changeAvatar: "Schimbă Foto" },
    ru: { title: "Глобальный паспорт bdai", subtitle: "ID кочевника", surname: "Фамилия", givenNames: "Имя", city: "Город", country: "Страна", age: "Возраст", birthday: "Рождение", save: "Сохранить", edit: "Править", logout: "Выйти", stamps: "Визы", badges: "Значки", langLabel: "Язык", rank: "РАНГ", miles: "МИЛИ", admin: "АДМИН", streak: "Серия", changeAvatar: "Сменить фото" },
    ar: { title: "جواز سفر bdai العالمي", subtitle: "هوية البدوي الرقمي", surname: "اللقب", givenNames: "الأسماء", city: "المدينة", country: "البلد", age: "العمر", birthday: "الميلاد", save: "حفظ", edit: "تعديل", logout: "خروج", stamps: "تأشيراتي", badges: "الأوسمة", langLabel: "اللغة", rank: "الرتبة", miles: "الأميال", admin: "مسؤول", streak: "سلسلة", changeAvatar: "تغيير الصورة" },
    zh: { title: "bdai 全球护照", subtitle: "数字游民 ID", surname: "姓", givenNames: "名", city: "城市", country: "国家", age: "年龄", birthday: "生日", save: "保存", edit: "编辑", logout: "登出", stamps: "我的签证", badges: "奖章", langLabel: "语言", rank: "等级", miles: "里程", admin: "管理", streak: "连续", changeAvatar: "更换照片" },
    ja: { title: "bdai パスポート", subtitle: "デジタルノマド ID", surname: "姓", givenNames: "名", city: "都市", country: "国", age: "年齢", birthday: "誕生日", save: "保存", edit: "編集", logout: "ログアウト", stamps: "ビザ", badges: "バッジ", langLabel: "言語", rank: "ランク", miles: "マイル", admin: "管理", streak: "記録", changeAvatar: "写真変更" },
    ko: { title: "bdai 글로벌 여권", subtitle: "디지털 노마드 ID", surname: "성", givenNames: "이름", city: "도시", country: "국가", age: "나이", birthday: "생일", save: "저장", edit: "편집", logout: "로그아웃", stamps: "내 비자", badges: "배지", langLabel: "언어", rank: "등급", miles: "마일", admin: "관리자", streak: "연속", changeAvatar: "사진 변경" },
    hi: { title: "bdai वैश्विक पासपोर्ट", subtitle: "डिजिटल घुमंतू आईडी", surname: "उपनाम", givenNames: "नाम", city: "शहर", country: "देश", age: "आयु", birthday: "जन्मदिन", save: "सहेजें", edit: "संपादิต करें", logout: "लॉगआउट", stamps: "मेरे वीजा", badges: "बैज", langLabel: "भाषा", rank: "रैंक", miles: "मील", admin: "व्यवस्थापक", streak: "लगातार", changeAvatar: "फोटो बदलें" },
    tr: { title: "bdai Küresel Pasaport", subtitle: "Dijital Nomad Kimliği", surname: "Soyadı", givenNames: "İsimler", city: "Şehir", country: "Ülke", age: "Yaş", birthday: "Doğum", save: "Kaydet", edit: "Düzenle", logout: "Çıkış", stamps: "Vizelerim", badges: "Rozetler", langLabel: "Dil", rank: "RÜTBE", miles: "MİLLER", admin: "YÖNETİCİ", streak: "Seri", changeAvatar: "Fotoğraf Değiştir" },
    nl: { title: "bdai Globaal Paspoort", subtitle: "Digital Nomad ID", surname: "Achternaam", givenNames: "Voornamen", city: "Stad", country: "Land", age: "Leeftijd", birthday: "Geboortedatum", save: "Opslaan", edit: "Bewerken", logout: "Uitloggen", stamps: "Mijn Visa", badges: "Badges", langLabel: "Taal", rank: "RANG", miles: "MIJL", admin: "ADMIN", streak: "Reeks", changeAvatar: "Foto wijzigen" },
    pl: { title: "Globalny Paszport bdai", subtitle: "ID Nomady", surname: "Nazwisko", givenNames: "Imiona", city: "Miasto", country: "Kraj", age: "Wiek", birthday: "Data urodzenia", save: "Zapisz", edit: "Edytuj", logout: "Wyloguj", stamps: "Wizy", badges: "Odznaki", langLabel: "Język", rank: "RANGA", miles: "MILE", admin: "ADMIN", streak: "Seria", changeAvatar: "Zmień zdjęcie" },
    ca: { title: "Passaport Global bdai", subtitle: "ID Nòmada Digital", surname: "Cognoms", givenNames: "Noms", city: "Ciutat", country: "País", age: "Edat", birthday: "Naixement", save: "Desar", edit: "Editar", logout: "Sortir", stamps: "Els Meus Visats", badges: "Insígnies", langLabel: "Idioma", rank: "RANG", miles: "MILLES", admin: "ADMIN", streak: "Ratxa", changeAvatar: "Canviar Foto" },
    eu: { title: "bdai Pasaporte Globala", subtitle: "ID Nomada Digitala", surname: "Abizenak", givenNames: "Izenak", city: "Hiria", country: "Herrialdea", age: "Adina", birthday: "Jaioteguna", save: "Gorde", edit: "Editatu", logout: "Saioa Itxi", stamps: "Nire Visatuak", badges: "Intsigniak", langLabel: "Hizkuntza", rank: "MAILA", miles: "MILIAK", admin: "ADMIN", streak: "Segida", changeAvatar: "Argazkia Aldatu" },
    vi: { title: "Hộ chiếu Toàn cầu bdai", subtitle: "ID Du mục", surname: "Họ", givenNames: "Tên", city: "Thành phố", country: "Quốc gia", age: "Tuổi", birthday: "Ngày sinh", save: "Lưu", edit: "Chỉnh sửa", logout: "Đăng xuất", stamps: "Thị thực", badges: "Huy hiệu", langLabel: "Ngôn ngữ", rank: "CẤP BẬC", miles: "DẶM", admin: "QUẢN TRỊ", streak: "Chuỗi", changeAvatar: "Đổi ảnh" },
    th: { title: "พาสปอร์ตทั่วโลก bdai", subtitle: "รหัสนักเดินทาง", surname: "นามสกุล", givenNames: "ชื่อ", city: "เมือง", country: "ประเทศ", age: "อายุ", birthday: "วันเกิด", save: "บันทึก", edit: "แก้ไข", logout: "ออก", stamps: "วีซ่า", badges: "เหรียญตรา", langLabel: "ภาษา", rank: "อันดับ", miles: "ไมล์", admin: "ผู้ดูแล", streak: "สถิติ", changeAvatar: "เปลี่ยนรูป" }
};

const LangCircle: React.FC<{ code: string; label: string; isActive: boolean; onClick: () => void }> = ({ code, label, isActive, onClick }) => (
    <button onClick={onClick} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-90 shrink-0 ${isActive ? 'bg-purple-600 border-purple-400 text-white font-black scale-110 shadow-lg' : 'bg-white border-slate-200 text-slate-400 font-bold hover:bg-slate-50'}`}>
        <span className="text-[8px] uppercase">{label}</span>
    </button>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin, language, onLangChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || '',
      country: user.country || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es'
  });

  useEffect(() => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || 'traveler',
      city: user.city || '',
      country: user.country || '',
      avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01',
      language: user.language || 'es'
    });
  }, [user]);

  const pt = (key: string) => {
    const lang = user.language || 'es';
    const dict = MODAL_TEXTS[lang] || MODAL_TEXTS['en'] || MODAL_TEXTS['es'];
    const globalDict = translations[lang] || translations['en'] || translations['es'];
    return dict[key] || globalDict[key] || key;
  };

  const isAdmin = user.email === 'travelbdai@gmail.com';

  const handleAvatarClick = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          setFormData(prev => ({ ...prev, avatar: base64String }));
          if (!isEditing && onUpdateUser) {
              const updatedUser = { ...user, avatar: base64String };
              onUpdateUser(updatedUser);
              syncUserProfile(updatedUser);
          }
      };
      reader.readAsDataURL(file);
  };

  const handleSave = async () => {
      setIsSyncing(true);
      try {
          const birthDate = new Date(formData.birthday);
          const age = new Date().getFullYear() - birthDate.getFullYear();
          const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`.trim(), age: age };
          await syncUserProfile(updatedUser);
          if (onUpdateUser) onUpdateUser(updatedUser);
          setIsEditing(false);
      } catch (e) {} finally { setIsSyncing(false); }
  };

  const [showBragModal, setShowBragModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleShareRank = async () => {
    const message = pt('shareRankMessage')
      .replace('{rank}', user.rank)
      .replace('{miles}', user.miles.toLocaleString());

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BDAI Rank',
          text: message,
          url: 'https://www.bdai.travel'
        });
      } catch (e) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start overflow-y-auto no-scrollbar bg-slate-950/98 backdrop-blur-2xl">
      {/* TOAST NOTIFICATION */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl animate-bounce">
          <i className="fas fa-check-circle mr-2"></i> {pt('copiedToClipboard')}
        </div>
      )}

      {/* BRAG MODAL (SHARE CARD) */}
      {showBragModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-[320px] bg-slate-950 border-4 border-slate-900 rounded-[3rem] p-8 relative overflow-hidden flex flex-col items-center">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-cyan-900/20"></div>
            
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-purple-600 flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.5)] mb-6">
              <i className="fas fa-crown text-3xl text-white"></i>
            </div>

            <p className="relative z-10 text-[10px] font-black text-purple-400 uppercase tracking-[0.4em] mb-2">Current Status</p>
            <h3 className="relative z-10 text-4xl font-black text-white uppercase tracking-tighter mb-4">{user.rank}</h3>
            
            <div className="relative z-10 w-full p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md mb-8">
               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Distance</p>
               <p className="text-2xl font-black text-cyan-400">{user.miles.toLocaleString()} <span className="text-[10px] text-slate-400 uppercase">Miles</span></p>
            </div>

            <button 
              onClick={() => {
                handleShareRank();
                setShowBragModal(false);
              }}
              className="relative z-10 w-full py-5 bg-purple-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all mb-4"
            >
              <i className="fas fa-paper-plane mr-2"></i> Confirm & Share
            </button>

            <button 
              onClick={() => setShowBragModal(false)}
              className="relative z-10 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm px-4 pt-12">
        <div className="flex justify-between items-center mb-6 w-full px-2">
            <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/20">
                <i className="fas fa-sign-out-alt"></i> {pt('logout')}
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/5 active:scale-90 shadow-lg"><i className="fas fa-times"></i></button>
        </div>

        <div className="bg-[#f3f0e6] w-full rounded-[2.5rem] overflow-hidden shadow-2xl relative border-[3px] border-[#d7d2c3] flex flex-col text-slate-900 mb-64">
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
            <div className="bg-[#8b2b2b] p-6 flex justify-between items-center shrink-0 border-b-2 border-[#d7d2c3]">
                <div>
                    <h2 className="text-yellow-500 font-black text-[11px] uppercase tracking-widest leading-none">{pt('title')}</h2>
                    <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest mt-1.5">{pt('subtitle')}</p>
                </div>
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEditing ? 'bg-blue-600' : 'bg-white/10'} text-white transition-all shadow-lg`}>
                    {isSyncing ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'} text-xs`}></i>}
                </button>
            </div>

            <div className="p-6 space-y-8">
                <div className="flex gap-6 items-start">
                    <div onClick={handleAvatarClick} className="shrink-0 w-28 h-36 bg-white border-2 border-[#d7d2c3] rounded-xl shadow-lg overflow-hidden p-1 relative cursor-pointer group">
                        <img src={formData.avatar} className="w-full h-full object-cover grayscale contrast-125 saturate-0" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[8px] font-black text-center px-2 opacity-0 group-hover:opacity-100 transition-opacity">{pt('changeAvatar')}</div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="pb-2 border-b border-slate-200">
                            <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">ID_NOMAD</p>
                            <p className="font-black text-slate-900 uppercase text-xs truncate leading-none">@{formData.username}</p>
                        </div>
                        <div className="pb-2 border-b border-slate-200">
                            <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('email')}</p>
                            <p className="font-bold text-slate-600 text-[8px] truncate leading-none">{user.email}</p>
                        </div>
                        <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('rank')}</p><p className="font-black text-purple-600 text-[9px] uppercase">{user.rank}</p></div>
                        <div className="flex justify-between border-t border-slate-200 pt-3">
                            <div><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('miles')}</p><p className="font-black text-slate-900 text-[9px] mt-1">{user.miles.toLocaleString()}</p></div>
                            <div className="text-right"><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('streak')}</p><p className="font-black text-orange-600 text-[9px] mt-1"><i className="fas fa-fire mr-1"></i> {user.stats.streakDays}</p></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('givenNames')}</p>
                        {isEditing ? <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.firstName || '---'}</p>}
                    </div>
                    <div className="space-y-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('surname')}</p>
                        {isEditing ? <input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.lastName || '---'}</p>}
                    </div>
                    <div className="space-y-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('city')}</p>
                        {isEditing ? <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.city || '---'}</p>}
                    </div>
                    <div className="space-y-1">
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('birthday')}</p>
                        {isEditing ? <input type="date" value={formData.birthday} onChange={e => setFormData({...formData, birthday: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px]" /> : <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.birthday || '---'}</p>}
                    </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-slate-300">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-4 tracking-widest">{pt('stamps')}</p>
                    <div className="grid grid-cols-4 gap-3">
                        {user.stamps.length > 0 ? user.stamps.map((s, i) => (
                            <div key={i} className="aspect-square bg-white border-2 border-slate-300 rounded-2xl flex flex-col items-center justify-center p-1.5 shadow-sm transform rotate-[-4deg] hover:rotate-0 transition-transform">
                                <i className="fas fa-stamp text-lg mb-1" style={{ color: s.color }}></i>
                                <span className="text-[6px] font-black text-slate-800 uppercase truncate w-full text-center leading-none mb-0.5">{s.city}</span>
                                <span className="text-[5px] font-bold text-slate-400 uppercase truncate w-full text-center leading-none">{s.country}</span>
                            </div>
                        )) : [1,2,3,4].map(i => <div key={i} className="aspect-square bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl"></div>)}
                    </div>
                </div>

                <div className="pt-2">
                    <p className="text-[8px] font-black text-slate-500 mb-4 tracking-widest">{pt('myCollection')}</p>
                    <div className="grid grid-cols-3 gap-3">
                        {APP_BADGES.map((b) => {
                            const isEarned = user.badges?.some(ub => ub.id === b.id);
                            return (
                                <div 
                                    key={b.id} 
                                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border transition-all ${
                                        isEarned 
                                        ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.3)] scale-105' 
                                        : 'bg-slate-900/50 border-slate-800 opacity-30 grayscale'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${isEarned ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : 'bg-slate-800 text-slate-600'}`}>
                                        <i className={`fas ${b.icon} text-sm`}></i>
                                    </div>
                                    <span className={`text-[7px] font-black uppercase text-center leading-tight mb-1 ${isEarned ? 'text-slate-900' : 'text-slate-500'}`}>{b.name}</span>
                                    <span className={`text-[5px] font-medium text-center leading-none opacity-60 ${isEarned ? 'text-slate-700' : 'text-slate-400'}`}>{pt(b.description)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        onClick={() => setShowBragModal(true)}
                        className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 border border-white/5"
                    >
                        <i className="fas fa-bullhorn text-purple-400"></i>
                        {pt('shareRank')}
                    </button>
                </div>

                <div className="pt-6">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-4 tracking-widest">{pt('langLabel')}</p>
                    <div className="flex flex-wrap gap-2 mb-20">
                        {LANGUAGES.map(lang => (
                            <LangCircle key={lang.code} label={lang.name} code={lang.code} isActive={user.language === lang.code} onClick={() => onLangChange?.(lang.code)} />
                        ))}
                    </div>
                    {isAdmin && <button onClick={onOpenAdmin} className="w-full py-4 mb-3 bg-slate-900 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95 shadow-lg"><i className="fas fa-tools text-xs"></i> {pt('admin')}</button>}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
