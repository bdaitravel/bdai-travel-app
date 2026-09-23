import React from 'react';
import { Capacitor } from '@capacitor/core';
import { AppleLogo } from './AppleLogo';

interface LeaderboardLockedViewProps {
  language: string;
  onLinkApple: () => void;
  onLinkGoogle: () => void;
}

const isIOS = Capacitor.getPlatform() === 'ios';

const TEXTS: Record<string, Record<string, string>> = {
  es: {
    title: "Vincula tu cuenta para participar",
    subtitle: "El Ranking Global compara viajeros reales entre sí. Vincula tu perfil con Apple o Google para que tus millas cuenten aquí — no perderás nada de tu progreso actual.",
    linkApple: "Vincular con Apple", linkGoogle: "Vincular con Google"
  },
  en: {
    title: "Link your account to take part",
    subtitle: "The Global Ranking compares real travelers against each other. Link your profile with Apple or Google so your miles count here — you won't lose any of your current progress.",
    linkApple: "Link with Apple", linkGoogle: "Link with Google"
  },
  fr: {
    title: "Lie ton compte pour participer",
    subtitle: "Le classement mondial compare de vrais voyageurs entre eux. Lie ton profil avec Apple ou Google pour que tes miles comptent ici — tu ne perdras rien de ta progression actuelle.",
    linkApple: "Se connecter avec Apple", linkGoogle: "Se connecter avec Google"
  },
  de: {
    title: "Verknüpfe dein Konto, um teilzunehmen",
    subtitle: "Die globale Rangliste vergleicht echte Reisende miteinander. Verknüpfe dein Profil mit Apple oder Google, damit deine Meilen hier zählen — du verlierst dabei nichts von deinem aktuellen Fortschritt.",
    linkApple: "Mit Apple verknüpfen", linkGoogle: "Mit Google verknüpfen"
  },
  it: {
    title: "Collega il tuo account per partecipare",
    subtitle: "La classifica globale confronta viaggiatori reali tra loro. Collega il tuo profilo con Apple o Google affinché le tue miglia contino qui — non perderai nulla dei tuoi progressi attuali.",
    linkApple: "Accedi con Apple", linkGoogle: "Accedi con Google"
  },
  pt: {
    title: "Vincule sua conta para participar",
    subtitle: "O Ranking Global compara viajantes reais entre si. Vincule seu perfil com Apple ou Google para que suas milhas contem aqui — você não perderá nada do seu progresso atual.",
    linkApple: "Vincular com Apple", linkGoogle: "Vincular com Google"
  },
  ro: {
    title: "Conectează-ți contul pentru a participa",
    subtitle: "Clasamentul Global compară călători reali între ei. Conectează-ți profilul cu Apple sau Google pentru ca milele tale să conteze aici — nu vei pierde nimic din progresul actual.",
    linkApple: "Conectează cu Apple", linkGoogle: "Conectează cu Google"
  },
  pl: {
    title: "Połącz konto, aby wziąć udział",
    subtitle: "Globalny ranking porównuje prawdziwych podróżników między sobą. Połącz swój profil z Apple lub Google, aby twoje mile się tu liczyły — nie stracisz nic ze swojego obecnego postępu.",
    linkApple: "Połącz z Apple", linkGoogle: "Połącz z Google"
  },
  nl: {
    title: "Koppel je account om mee te doen",
    subtitle: "De wereldwijde ranglijst vergelijkt echte reizigers met elkaar. Koppel je profiel met Apple of Google zodat je mijlen hier meetellen — je verliest niets van je huidige voortgang.",
    linkApple: "Koppelen met Apple", linkGoogle: "Koppelen met Google"
  },
  ru: {
    title: "Привяжите аккаунт, чтобы участвовать",
    subtitle: "Глобальный рейтинг сравнивает реальных путешественников между собой. Привяжите профиль к Apple или Google, чтобы ваши мили учитывались здесь — вы не потеряете свой текущий прогресс.",
    linkApple: "Привязать Apple", linkGoogle: "Привязать Google"
  },
  zh: {
    title: "绑定账号以参与排名",
    subtitle: "全球排行榜比较真实旅行者之间的成绩。绑定您的账号到 Apple 或 Google，让您的里程计入排名——您当前的进度不会丢失。",
    linkApple: "绑定 Apple", linkGoogle: "绑定 Google"
  },
  ja: {
    title: "アカウントを連携して参加しよう",
    subtitle: "グローバルランキングは実際の旅行者同士を比較します。プロフィールをAppleまたはGoogleと連携すると、あなたのマイルがここに反映されます — 現在の進捗が失われることはありません。",
    linkApple: "Appleと連携", linkGoogle: "Googleと連携"
  },
  ko: {
    title: "계정을 연결하여 참여하세요",
    subtitle: "글로벌 랭킹은 실제 여행자들을 서로 비교합니다. Apple 또는 Google로 프로필을 연결하면 마일이 여기에 반영됩니다 — 현재 진행 상황은 전혀 손실되지 않습니다.",
    linkApple: "Apple과 연결", linkGoogle: "Google과 연결"
  },
  ar: {
    title: "اربط حسابك للمشاركة",
    subtitle: "يقارن التصنيف العالمي بين المسافرين الحقيقيين. اربط ملفك الشخصي بـ Apple أو Google لكي تُحتسب أميالك هنا — لن تفقد أي شيء من تقدمك الحالي.",
    linkApple: "ربط مع Apple", linkGoogle: "ربط مع Google"
  },
  hi: {
    title: "भाग लेने के लिए अपना खाता लिंक करें",
    subtitle: "ग्लोबल रैंकिंग वास्तविक यात्रियों की तुलना करती है। अपनी प्रोफ़ाइल को Apple या Google से लिंक करें ताकि आपकी मील यहां गिनी जाएं — आपकी वर्तमान प्रगति बिल्कुल नहीं खोएगी।",
    linkApple: "Apple से लिंक करें", linkGoogle: "Google से लिंक करें"
  },
  tr: {
    title: "Katılmak için hesabını bağla",
    subtitle: "Küresel Sıralama gerçek gezginleri birbiriyle karşılaştırır. Millerinin burada sayılması için profilini Apple veya Google ile bağla — mevcut ilerlemenden hiçbir şey kaybetmezsin.",
    linkApple: "Apple ile Bağla", linkGoogle: "Google ile Bağla"
  },
  ca: {
    title: "Vincula el teu compte per participar",
    subtitle: "El Rànquing Global compara viatgers reals entre ells. Vincula el teu perfil amb Apple o Google perquè les teves milles comptin aquí — no perdràs res del teu progrés actual.",
    linkApple: "Vincula amb Apple", linkGoogle: "Vincula amb Google"
  },
  eu: {
    title: "Lotu zure kontua parte hartzeko",
    subtitle: "Munduko Rankingak benetako bidaiariak alderatzen ditu elkarren artean. Lotu zure profila Apple edo Google-rekin zure miliak hemen konta daitezen — ez duzu zure uneko aurrerapenik galduko.",
    linkApple: "Lotu Apple-rekin", linkGoogle: "Lotu Google-rekin"
  },
  vi: {
    title: "Liên kết tài khoản để tham gia",
    subtitle: "Bảng xếp hạng toàn cầu so sánh những du khách thực sự với nhau. Liên kết hồ sơ của bạn với Apple hoặc Google để số dặm của bạn được tính ở đây — bạn sẽ không mất bất kỳ tiến trình hiện tại nào.",
    linkApple: "Liên kết với Apple", linkGoogle: "Liên kết với Google"
  },
  th: {
    title: "เชื่อมต่อบัญชีของคุณเพื่อเข้าร่วม",
    subtitle: "อันดับระดับโลกเปรียบเทียบนักเดินทางจริงระหว่างกัน เชื่อมต่อโปรไฟล์ของคุณกับ Apple หรือ Google เพื่อให้ไมล์ของคุณถูกนับที่นี่ — คุณจะไม่สูญเสียความคืบหน้าปัจจุบันเลย",
    linkApple: "เชื่อมต่อกับ Apple", linkGoogle: "เชื่อมต่อกับ Google"
  }
};

export const LeaderboardLockedView: React.FC<LeaderboardLockedViewProps> = ({ language, onLinkApple, onLinkGoogle }) => {
  const t = TEXTS[language] || TEXTS.en;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center mb-6">
        <i className="fas fa-trophy text-2xl text-purple-400"></i>
      </div>
      <h2 className="text-white font-black text-sm uppercase tracking-widest mb-3">{t.title}</h2>
      <p className="text-slate-400 text-[11px] leading-relaxed max-w-xs mb-8">{t.subtitle}</p>

      <div className="w-full max-w-[280px]">
        {isIOS ? (
          <button onClick={onLinkApple}
            className="w-full h-14 bg-black border border-white/10 text-white rounded-2xl font-semibold text-[15px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
            <AppleLogo className="w-[18px] h-[18px]" color="#FFFFFF" />
            {t.linkApple}
          </button>
        ) : (
          <button onClick={onLinkGoogle}
            className="w-full h-14 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
            <i className="fab fa-google text-purple-600"></i>{t.linkGoogle}
          </button>
        )}
      </div>
    </div>
  );
};
