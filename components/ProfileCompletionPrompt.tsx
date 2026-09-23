import React, { useState } from 'react';
import { UserProfile } from '../types';

interface ProfileCompletionPromptProps {
  user: UserProfile;
  onClose: (updatedUser: UserProfile) => void;
}

const TEXTS: Record<string, Record<string, string>> = {
  es: {
    title: "Completa tu perfil", subtitle: "Cuéntanos un poco más de ti y llévate +10 millas de regalo.",
    birthday: "Fecha de nacimiento", city: "Ciudad", country: "País", cityPlaceholder: "Tu ciudad", countryPlaceholder: "Tu país",
    gender: "Sexo", male: "Hombre", female: "Mujer", unspecified: "Prefiero no decirlo",
    save: "Guardar y recibir +10 millas", skip: "Ahora no"
  },
  en: {
    title: "Complete your profile", subtitle: "Tell us a bit more about you and get +10 free miles.",
    birthday: "Date of birth", city: "City", country: "Country", cityPlaceholder: "Your city", countryPlaceholder: "Your country",
    gender: "Gender", male: "Male", female: "Female", unspecified: "Prefer not to say",
    save: "Save and get +10 miles", skip: "Not now"
  },
  fr: {
    title: "Complète ton profil", subtitle: "Parle-nous un peu plus de toi et reçois +10 miles gratuits.",
    birthday: "Date de naissance", city: "Ville", country: "Pays", cityPlaceholder: "Ta ville", countryPlaceholder: "Ton pays",
    gender: "Genre", male: "Homme", female: "Femme", unspecified: "Je préfère ne pas dire",
    save: "Enregistrer et recevoir +10 miles", skip: "Pas maintenant"
  },
  de: {
    title: "Vervollständige dein Profil", subtitle: "Erzähl uns etwas mehr über dich und erhalte +10 Meilen gratis.",
    birthday: "Geburtsdatum", city: "Stadt", country: "Land", cityPlaceholder: "Deine Stadt", countryPlaceholder: "Dein Land",
    gender: "Geschlecht", male: "Männlich", female: "Weiblich", unspecified: "Keine Angabe",
    save: "Speichern und +10 Meilen erhalten", skip: "Jetzt nicht"
  },
  it: {
    title: "Completa il tuo profilo", subtitle: "Raccontaci qualcosa in più su di te e ricevi +10 miglia gratis.",
    birthday: "Data di nascita", city: "Città", country: "Paese", cityPlaceholder: "La tua città", countryPlaceholder: "Il tuo paese",
    gender: "Genere", male: "Uomo", female: "Donna", unspecified: "Preferisco non dirlo",
    save: "Salva e ricevi +10 miglia", skip: "Non ora"
  },
  pt: {
    title: "Complete seu perfil", subtitle: "Conte-nos um pouco mais sobre você e ganhe +10 milhas grátis.",
    birthday: "Data de nascimento", city: "Cidade", country: "País", cityPlaceholder: "Sua cidade", countryPlaceholder: "Seu país",
    gender: "Gênero", male: "Masculino", female: "Feminino", unspecified: "Prefiro não dizer",
    save: "Salvar e ganhar +10 milhas", skip: "Agora não"
  },
  ro: {
    title: "Completează-ți profilul", subtitle: "Spune-ne puțin mai multe despre tine și primești +10 mile gratuite.",
    birthday: "Data nașterii", city: "Oraș", country: "Țară", cityPlaceholder: "Orașul tău", countryPlaceholder: "Țara ta",
    gender: "Gen", male: "Bărbat", female: "Femeie", unspecified: "Prefer să nu spun",
    save: "Salvează și primește +10 mile", skip: "Nu acum"
  },
  pl: {
    title: "Uzupełnij swój profil", subtitle: "Powiedz nam trochę więcej o sobie i otrzymaj +10 mil gratis.",
    birthday: "Data urodzenia", city: "Miasto", country: "Kraj", cityPlaceholder: "Twoje miasto", countryPlaceholder: "Twój kraj",
    gender: "Płeć", male: "Mężczyzna", female: "Kobieta", unspecified: "Wolę nie podawać",
    save: "Zapisz i odbierz +10 mil", skip: "Nie teraz"
  },
  nl: {
    title: "Vul je profiel aan", subtitle: "Vertel ons iets meer over jezelf en ontvang +10 gratis mijlen.",
    birthday: "Geboortedatum", city: "Stad", country: "Land", cityPlaceholder: "Jouw stad", countryPlaceholder: "Jouw land",
    gender: "Geslacht", male: "Man", female: "Vrouw", unspecified: "Zeg ik liever niet",
    save: "Opslaan en +10 mijlen ontvangen", skip: "Niet nu"
  },
  ru: {
    title: "Заполните свой профиль", subtitle: "Расскажите нам немного о себе и получите +10 бесплатных миль.",
    birthday: "Дата рождения", city: "Город", country: "Страна", cityPlaceholder: "Ваш город", countryPlaceholder: "Ваша страна",
    gender: "Пол", male: "Мужской", female: "Женский", unspecified: "Предпочитаю не указывать",
    save: "Сохранить и получить +10 миль", skip: "Не сейчас"
  },
  zh: {
    title: "完善您的个人资料", subtitle: "多告诉我们一些关于您的信息，即可获得 +10 免费里程。",
    birthday: "出生日期", city: "城市", country: "国家", cityPlaceholder: "您的城市", countryPlaceholder: "您的国家",
    gender: "性别", male: "男", female: "女", unspecified: "不愿透露",
    save: "保存并获得 +10 里程", skip: "暂不"
  },
  ja: {
    title: "プロフィールを完成させよう", subtitle: "もう少しあなたのことを教えてください。+10マイルをプレゼント。",
    birthday: "生年月日", city: "都市", country: "国", cityPlaceholder: "あなたの都市", countryPlaceholder: "あなたの国",
    gender: "性別", male: "男性", female: "女性", unspecified: "回答しない",
    save: "保存して+10マイルを受け取る", skip: "今はしない"
  },
  ko: {
    title: "프로필을 완성하세요", subtitle: "당신에 대해 조금 더 알려주시면 무료 마일 +10을 드립니다.",
    birthday: "생년월일", city: "도시", country: "국가", cityPlaceholder: "당신의 도시", countryPlaceholder: "당신의 국가",
    gender: "성별", male: "남성", female: "여성", unspecified: "밝히지 않음",
    save: "저장하고 +10 마일 받기", skip: "나중에"
  },
  ar: {
    title: "أكمل ملفك الشخصي", subtitle: "أخبرنا المزيد عنك واحصل على +10 أميال مجانية.",
    birthday: "تاريخ الميلاد", city: "المدينة", country: "الدولة", cityPlaceholder: "مدينتك", countryPlaceholder: "دولتك",
    gender: "الجنس", male: "ذكر", female: "أنثى", unspecified: "أفضل عدم الإفصاح",
    save: "احفظ واحصل على +10 أميال", skip: "ليس الآن"
  },
  hi: {
    title: "अपनी प्रोफ़ाइल पूरी करें", subtitle: "हमें अपने बारे में थोड़ा और बताएं और +10 मुफ़्त मील पाएं।",
    birthday: "जन्म तिथि", city: "शहर", country: "देश", cityPlaceholder: "आपका शहर", countryPlaceholder: "आपका देश",
    gender: "लिंग", male: "पुरुष", female: "महिला", unspecified: "बताना नहीं चाहते",
    save: "सहेजें और +10 मील पाएं", skip: "अभी नहीं"
  },
  tr: {
    title: "Profilini tamamla", subtitle: "Bize kendinden biraz daha bahset ve +10 ücretsiz mil kazan.",
    birthday: "Doğum tarihi", city: "Şehir", country: "Ülke", cityPlaceholder: "Şehrin", countryPlaceholder: "Ülken",
    gender: "Cinsiyet", male: "Erkek", female: "Kadın", unspecified: "Belirtmek istemiyorum",
    save: "Kaydet ve +10 mil kazan", skip: "Şimdi değil"
  },
  ca: {
    title: "Completa el teu perfil", subtitle: "Explica'ns una mica més sobre tu i rep +10 milles de regal.",
    birthday: "Data de naixement", city: "Ciutat", country: "País", cityPlaceholder: "La teva ciutat", countryPlaceholder: "El teu país",
    gender: "Gènere", male: "Home", female: "Dona", unspecified: "Prefereixo no dir-ho",
    save: "Desa i rep +10 milles", skip: "Ara no"
  },
  eu: {
    title: "Osatu zure profila", subtitle: "Kontaiguzu zure buruari buruz pixka bat gehiago eta jaso +10 milia doan.",
    birthday: "Jaiotze data", city: "Hiria", country: "Herrialdea", cityPlaceholder: "Zure hiria", countryPlaceholder: "Zure herrialdea",
    gender: "Generoa", male: "Gizona", female: "Emakumea", unspecified: "Nahiago dut ez esan",
    save: "Gorde eta jaso +10 milia", skip: "Orain ez"
  },
  vi: {
    title: "Hoàn thiện hồ sơ của bạn", subtitle: "Cho chúng tôi biết thêm về bạn và nhận +10 dặm miễn phí.",
    birthday: "Ngày sinh", city: "Thành phố", country: "Quốc gia", cityPlaceholder: "Thành phố của bạn", countryPlaceholder: "Quốc gia của bạn",
    gender: "Giới tính", male: "Nam", female: "Nữ", unspecified: "Không muốn tiết lộ",
    save: "Lưu và nhận +10 dặm", skip: "Không phải bây giờ"
  },
  th: {
    title: "กรอกโปรไฟล์ของคุณให้ครบถ้วน", subtitle: "บอกเราเกี่ยวกับตัวคุณเพิ่มเติมและรับ +10 ไมล์ฟรี",
    birthday: "วันเกิด", city: "เมือง", country: "ประเทศ", cityPlaceholder: "เมืองของคุณ", countryPlaceholder: "ประเทศของคุณ",
    gender: "เพศ", male: "ชาย", female: "หญิง", unspecified: "ไม่ระบุ",
    save: "บันทึกและรับ +10 ไมล์", skip: "ยังไม่ใช่ตอนนี้"
  }
};

export const ProfileCompletionPrompt: React.FC<ProfileCompletionPromptProps> = ({ user, onClose }) => {
  const lang = user.language || 'es';
  const t = TEXTS[lang] || TEXTS.en;

  const [birthday, setBirthday] = useState(user.birthday || '');
  const [city, setCity] = useState(user.city || '');
  const [country, setCountry] = useState(user.country || '');
  const [gender, setGender] = useState<NonNullable<UserProfile['gender']>>(user.gender || 'unspecified');

  const handleSkip = () => {
    onClose({ ...user, profileCompletedAt: new Date().toISOString() });
  };

  const handleSave = () => {
    const age = birthday ? new Date().getFullYear() - new Date(birthday).getFullYear() : user.age;
    onClose({
      ...user,
      birthday: birthday || user.birthday,
      age,
      city: city || user.city,
      country: country || user.country,
      gender,
      miles: user.miles + 10,
      profileCompletedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-[#020617]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 overflow-y-auto no-scrollbar animate-fade-in">
      <div className="w-full max-w-md bg-slate-900/80 border border-white/10 p-8 rounded-[3rem] shadow-2xl backdrop-blur-2xl relative">
        <button onClick={handleSkip} aria-label="Close"
          className="absolute top-6 right-6 z-10 w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center active:scale-90 hover:bg-white/10 hover:text-white transition-all">
          <i className="fas fa-times"></i>
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <i className="fas fa-gift text-purple-400"></i>
          </div>
          <h3 className="text-white font-black text-sm uppercase tracking-widest">{t.title}</h3>
          <p className="text-slate-400 text-[11px] mt-2 leading-relaxed px-2">{t.subtitle}</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.birthday}</p>
            <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)}
              className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-xs outline-none focus:border-purple-500/50 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.city}</p>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder={t.cityPlaceholder}
                className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-xs outline-none focus:border-purple-500/50 placeholder-slate-700 transition-all" />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.country}</p>
              <input type="text" value={country} onChange={e => setCountry(e.target.value)} placeholder={t.countryPlaceholder}
                className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-xl px-4 text-white text-xs outline-none focus:border-purple-500/50 placeholder-slate-700 transition-all" />
            </div>
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">{t.gender}</p>
            <div className="flex gap-2">
              {(['male', 'female', 'unspecified'] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  className={`flex-1 h-11 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${gender === g ? 'bg-purple-600 text-white' : 'bg-white/5 border border-white/10 text-slate-400'}`}>
                  {t[g]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button onClick={handleSave}
          className="w-full h-14 mt-6 bg-white text-slate-950 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">
          {t.save}
        </button>
        <button onClick={handleSkip} className="w-full h-10 mt-1 text-slate-500 text-[9px] font-black uppercase tracking-widest">
          {t.skip}
        </button>
      </div>
    </div>
  );
};
