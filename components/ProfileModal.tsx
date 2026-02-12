
import React, { useState } from 'react';
import { UserProfile, LANGUAGES, AVATARS } from '../types';
import { syncUserProfile } from '../services/supabaseClient';

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
    es: { title: "Pasaporte Global bdai", subtitle: "Nómada Digital ID", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País", age: "Edad", birthday: "Nacimiento", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión", stamps: "Mis Visados", badges: "Insignias", langLabel: "Idioma", rank: "RANGO", miles: "MILLAS", admin: "ADMIN", streak: "Racha", changeAvatar: "Cambiar Foto" },
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad ID", surname: "Surname", givenNames: "Given Names", city: "City", country: "Country", age: "Age", birthday: "Birthdate", save: "Save", edit: "Edit", logout: "Logout", stamps: "My Visas", badges: "Badges", langLabel: "Language", rank: "RANK", miles: "MILES", admin: "ADMIN", streak: "Streak", changeAvatar: "Change Photo" },
    it: { title: "Passaporto Globale bdai", subtitle: "ID Nomade Digitale", surname: "Cognome", givenNames: "Nomi", city: "Città", country: "Paese", age: "Età", birthday: "F. Nascita", save: "Salva", edit: "Modifica", logout: "Logout", stamps: "I Miei Visti", badges: "Distintivi", langLabel: "Lingua", rank: "RANGO", miles: "MIGLIA", admin: "ADMIN", streak: "Serie", changeAvatar: "Cambia Foto" },
    fr: { title: "Passeport Global bdai", subtitle: "ID Nomade Numérique", surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays", age: "Âge", birthday: "Naissance", save: "Enregistrer", edit: "Modifier", logout: "Déconnexion", stamps: "Mes Visas", badges: "Badges", langLabel: "Langue", rank: "RANG", miles: "MILES", admin: "ADMIN", streak: "Série", changeAvatar: "Changer Photo" },
    de: { title: "bdai Globaler Pass", subtitle: "Digital Nomad ID", surname: "Nachname", givenNames: "Vornamen", city: "Stadt", country: "Land", age: "Alter", birthday: "Geburtstag", save: "Speichern", edit: "Bearbeiten", logout: "Abmelden", stamps: "Meine Visa", badges: "Abzeichen", langLabel: "Sprache", rank: "RANG", miles: "MEILEN", admin: "ADMIN", streak: "Serie", changeAvatar: "Foto ändern" },
    pt: { title: "Passaporte Global bdai", subtitle: "ID Nómada Digital", surname: "Apelido", givenNames: "Nomes", city: "Cidade", country: "País", age: "Idade", birthday: "Nascimento", save: "Guardar", edit: "Editar", logout: "Sair", stamps: "Meus Vistos", badges: "Distintivos", langLabel: "Idioma", rank: "RANKING", miles: "MILHAS", admin: "ADMIN", streak: "Sequência", changeAvatar: "Mudar Foto" },
    ro: { title: "Pașaport Global bdai", subtitle: "ID Nomad Digital", surname: "Nume", givenNames: "Prenume", city: "Oraș", country: "Țară", age: "Vârstă", birthday: "Naștere", save: "Salvare", edit: "Editare", logout: "Deconectare", stamps: "Vizele Mele", badges: "Insigne", langLabel: "Limbă", rank: "RANG", miles: "MILE", admin: "ADMIN", streak: "Serie", changeAvatar: "Schimbă Foto" },
    ca: { title: "Passaport Global bdai", subtitle: "ID Nòmada Digital", surname: "Cognoms", givenNames: "Noms", city: "Ciutat", country: "País", age: "Edat", birthday: "Naixement", save: "Desar", edit: "Editar", logout: "Sortir", stamps: "Els Meus Visats", badges: "Insígnies", langLabel: "Idioma", rank: "RANG", miles: "MILLES", admin: "ADMIN", streak: "Ratxa", changeAvatar: "Canviar Foto" },
    nl: { title: "bdai Globaal Paspoort", subtitle: "Digital Nomad ID", surname: "Achternaam", givenNames: "Voornamen", city: "Stad", country: "Land", age: "Leeftijd", birthday: "Geboortedatum", save: "Opslaan", edit: "Bewerken", logout: "Uitloggen", stamps: "Mijn Visa", badges: "Badges", langLabel: "Taal", rank: "RANG", miles: "MIJL", admin: "ADMIN", streak: "Reeks", changeAvatar: "Foto wijzigen" },
    zh: { title: "bdai 全球护照", subtitle: "数字游民 ID", surname: "姓", givenNames: "名", city: "城市", country: "国家", age: "年龄", birthday: "生日", save: "保存", edit: "编辑", logout: "登出", stamps: "我的签证", badges: "奖章", langLabel: "语言", rank: "等级", miles: "里程", admin: "管理", streak: "连续", changeAvatar: "更换照片" },
    ja: { title: "bdai グローバルパスポート", subtitle: "デジタルノマド ID", surname: "姓", givenNames: "名", city: "都市", country: "国", age: "年齢", birthday: "誕生日", save: "保存", edit: "編集", logout: "ログアウト", stamps: "ビザ", badges: "バッジ", langLabel: "言語", rank: "ランク", miles: "マイル", admin: "管理", streak: "記録", changeAvatar: "写真変更" },
    ru: { title: "Глобальный паспорт bdai", subtitle: "ID цифрового кочевника", surname: "Фамилия", givenNames: "Имя", city: "Город", country: "Страна", age: "Возраст", birthday: "Рождение", save: "Сохранить", edit: "Править", logout: "Выйти", stamps: "Мои визы", badges: "Значки", langLabel: "Язык", rank: "РАНГ", miles: "МИЛИ", admin: "АДМИН", streak: "Серия", changeAvatar: "Сменить фото" },
    ar: { title: "جواز سفر bdai العالمي", subtitle: "هوية البدوي الرقمي", surname: "اللقب", givenNames: "الأسماء الأولى", city: "المدينة", country: "البلد", age: "العمر", birthday: "تاريخ الميلاد", save: "حفظ", edit: "تعديل", logout: "تسجيل الخروج", stamps: "تأشيراتي", badges: "الأوسمة", langLabel: "اللغة", rank: "الرتبة", miles: "الأميال", admin: "مسؤول", streak: "سلسلة", changeAvatar: "تغيير الصورة" },
    hi: { title: "bdai वैश्विक पासपोर्ट", subtitle: "डिजिटल घुमंतू आईडी", surname: "उपनाम", givenNames: "नाम", city: "शहर", country: "देश", age: "आयु", birthday: "जन्मदिन", save: "सहेजें", edit: "संपादित करें", logout: "लॉगआउट", stamps: "मेरे वीजा", badges: "बैज", langLabel: "भाषा", rank: "रैंक", miles: "मील", admin: "व्यवस्थापक", streak: "लगातार", changeAvatar: "फोटो बदलें" },
    ko: { title: "bdai 글로벌 여권", subtitle: "디지털 노마드 ID", surname: "성", givenNames: "이름", city: "도시", country: "국가", age: "나이", birthday: "생일", save: "저장", edit: "편집", logout: "로그아웃", stamps: "내 비자", badges: "배지", langLabel: "언어", rank: "등급", miles: "마일", admin: "관리자", streak: "연속", changeAvatar: "사진 변경" },
    tr: { title: "bdai Küresel Pasaport", subtitle: "Dijital Nomad Kimliği", surname: "Soyadı", givenNames: "İsimler", city: "Şehir", country: "Ülke", age: "Yaş", birthday: "Doğum Tarihi", save: "Kaydet", edit: "Düzenle", logout: "Çıkış Yap", stamps: "Vizelerim", badges: "Rozetler", langLabel: "Dil", rank: "RÜTBE", miles: "MİLLER", admin: "YÖNETİCİ", streak: "Seri", changeAvatar: "Fotoğraf Değiştir" },
    pl: { title: "Globalny Paszport bdai", subtitle: "ID Cyfrowego Nomady", surname: "Nazwisko", givenNames: "Imiona", city: "Miasto", country: "Kraj", age: "Wiek", birthday: "Data urodzenia", save: "Zapisz", edit: "Edytuj", logout: "Wyloguj", stamps: "Moje wizy", badges: "Odznaki", langLabel: "Język", rank: "RANGA", miles: "MILE", admin: "ADMIN", streak: "Seria", changeAvatar: "Zmień zdjęcie" },
    eu: { title: "bdai Pasaporte Globala", subtitle: "ID Nomada Digitala", surname: "Abizenak", givenNames: "Izenak", city: "Hiria", country: "Herrialdea", age: "Adina", birthday: "Jaioteguna", save: "Gorde", edit: "Editatu", logout: "Saioa Itxi", stamps: "Nire Visatuak", badges: "Intsigniak", langLabel: "Hizkuntza", rank: "MAILA", miles: "MILIAK", admin: "ADMIN", streak: "Segida", changeAvatar: "Argazkia Aldatu" },
    vi: { title: "Hộ chiếu Toàn cầu bdai", subtitle: "ID Du mục Kỹ thuật số", surname: "Họ", givenNames: "Tên", city: "Thành phố", country: "Quốc gia", age: "Tuổi", birthday: "Ngày sinh", save: "Lưu", edit: "Chỉnh sửa", logout: "Đăng xuất", stamps: "Thị thực của tôi", badges: "Huy hiệu", langLabel: "Ngôn ngữ", rank: "CẤP BẬC", miles: "DẶM", admin: "QUẢN TRỊ", streak: "Chuỗi", changeAvatar: "Đổi ảnh" },
    th: { title: "พาสปอร์ตทั่วโลก bdai", subtitle: "รหัสนักเดินทางดิจิทัล", surname: "นามสกุล", givenNames: "ชื่อ", city: "เมือง", country: "ประเทศ", age: "อายุ", birthday: "วันเกิด", save: "บันทึก", edit: "แก้ไข", logout: "ออกจากระบบ", stamps: "วีซ่าของฉัน", badges: "เหรียญตรา", langLabel: "ภาษา", rank: "อันดับ", miles: "ไมล์", admin: "ผู้ดูแล", streak: "สถิติ", changeAvatar: "เปลี่ยนรูป" }
};

const LangCircle: React.FC<{ code: string; label: string; isActive: boolean; onClick: () => void }> = ({ code, label, isActive, onClick }) => (
    <button onClick={onClick} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-90 shrink-0 ${isActive ? 'bg-purple-600 border-purple-400 text-white font-black scale-110 shadow-lg' : 'bg-white border-slate-200 text-slate-400 font-bold hover:bg-slate-50'}`}>
        <span className="text-[8px] uppercase">{label}</span>
    </button>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin, onLangChange }) => {
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
      language: user.language || 'es'
  });

  const pt = (key: string) => {
    return (MODAL_TEXTS[user.language] || MODAL_TEXTS['en'] || MODAL_TEXTS['es'])[key] || key;
  };

  const isAdmin = user.email === 'travelbdai@gmail.com';

  const handleAvatarChange = () => {
      const currentIndex = AVATARS.indexOf(formData.avatar);
      const nextIndex = (currentIndex + 1) % AVATARS.length;
      const newAvatar = AVATARS[nextIndex];
      setFormData(prev => ({ ...prev, avatar: newAvatar }));
      if (!isEditing && onUpdateUser) {
          onUpdateUser({ ...user, avatar: newAvatar });
      }
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
                <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`w-9 h-9 rounded-xl flex items-center justify-center ${isEditing ? 'bg-blue-600' : 'bg-white/10'} text-white transition-all shadow-lg`}>
                    {isSyncing ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'} text-xs`}></i>}
                </button>
                <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center"><i className="fas fa-times text-xs"></i></button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
            <div className="flex gap-6 items-start">
                <div onClick={handleAvatarChange} className="shrink-0 w-28 h-36 bg-white border-2 border-[#d7d2c3] rounded-xl shadow-lg overflow-hidden p-1 relative cursor-pointer group">
                    <img src={formData.avatar} className="w-full h-full object-cover grayscale contrast-125 saturate-0" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[8px] font-black text-center px-2 opacity-0 group-hover:opacity-100 transition-opacity">{pt('changeAvatar')}</div>
                </div>
                <div className="flex-1 space-y-4">
                    <div className="pb-2 border-b border-slate-200">
                        <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">ID_NOMAD</p>
                        <p className="font-black text-slate-900 uppercase text-xs truncate leading-none">@{formData.username}</p>
                    </div>
                    <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('rank')}</p><p className="font-black text-purple-600 text-[9px] uppercase">{user.rank}</p></div>
                    <div className="flex justify-between border-t border-slate-200 pt-3">
                        <div><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('miles')}</p><p className="font-black text-slate-900 text-[9px] mt-1">{user.miles.toLocaleString()}</p></div>
                        <div className="text-right"><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('streak')}</p><p className="font-black text-orange-600 text-[9px] mt-1"><i className="fas fa-fire mr-1"></i> {user.stats.streakDays}</p></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
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

            <div className="pt-4 border-t border-slate-200">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-3 tracking-widest">{pt('stamps')}</p>
                <div className="grid grid-cols-4 gap-2">
                    {user.stamps.length > 0 ? user.stamps.slice(0, 4).map((s, i) => (
                        <div key={i} className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                            <i className="fas fa-stamp text-slate-300"></i>
                        </div>
                    )) : [1,2,3,4].map(i => <div key={i} className="aspect-square bg-slate-50 border border-dashed border-slate-200 rounded-lg"></div>)}
                </div>
            </div>

            <div className="pt-2">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-4 tracking-widest">{pt('langLabel')}</p>
                <div className="flex flex-wrap gap-2 mb-8">
                    {LANGUAGES.map(lang => (
                        <LangCircle key={lang.code} label={lang.name} code={lang.code} isActive={user.language === lang.code} onClick={() => onLangChange?.(lang.code)} />
                    ))}
                </div>

                {isAdmin && (
                    <button onClick={onOpenAdmin} className="w-full py-4 mb-3 bg-slate-900 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95 shadow-lg">
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
