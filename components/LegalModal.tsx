import React from 'react';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
  language?: string;
}

const LEGAL_TEXTS: Record<string, any> = {
  es: {
    privacy: {
      title: "Política de Privacidad", updated: "Última actualización: 14 de Marzo de 2026",
      intro: "En bdai (better destinations by ai), respetamos su privacidad y estamos comprometidos a proteger sus datos personales.",
      s1title: "1. Información que recopilamos", s1: "Recopilamos datos que usted nos proporciona directamente: nombre, email, edad, ciudad, país e idioma. También recopilamos datos de ubicación GPS cuando usa la app para desbloquear paradas y ganar millas.",
      s2title: "2. Cómo usamos su información", s2: "Utilizamos su información para proporcionar y mejorar nuestros servicios, personalizar su experiencia, gestionar su cuenta y para fines de gamificación.",
      s3title: "3. Compartir su información", s3: "No vendemos sus datos personales a terceros. Podemos compartir información anonimizada con ayuntamientos y comercios locales para mejorar la experiencia turística.",
      s4title: "4. Sus derechos (RGPD)", s4: "Tiene derecho a acceder, rectificar y solicitar la eliminación de sus datos. Puede ejercer su derecho al olvido eliminando su cuenta desde el perfil.",
      s5title: "5. Contacto", s5: "Daysi Chong Zambrano — NIF: 16648955Z — Calle Calvo Sotelo 34, Logroño, La Rioja 26003 — info@bdai.travel"
    },
    terms: {
      title: "Términos de Uso", updated: "Última actualización: 14 de Marzo de 2026",
      intro: "Bienvenido a bdai. Al acceder o utilizar nuestra aplicación, usted acepta estos Términos de Uso.",
      s1title: "1. Uso de la Aplicación", s1: "bdai es un ecosistema de datos turísticos y gamificación. Usted se compromete a utilizar la app solo para fines legales.",
      s2title: "2. Cuentas de Usuario", s2: "Para acceder a ciertas funciones, debe crear una cuenta. Usted es responsable de mantener la confidencialidad de su información de inicio de sesión.",
      s3title: "3. Contenido Generado por el Usuario", s3: "Al aportar contenido a la comunidad, nos otorga una licencia no exclusiva y mundial para utilizarlo y mejorarlo.",
      s4title: "4. Gamificación y Recompensas", s4: "Las millas no tienen valor monetario real. Nos reservamos el derecho de modificar el programa de recompensas en cualquier momento.",
      s5title: "5. Limitación de Responsabilidad", s5: "La app se proporciona tal cual. No garantizamos que sea ininterrumpida o libre de errores.",
      s6title: "6. Contacto", s6: "Daysi Chong Zambrano — NIF: 16648955Z — Calle Calvo Sotelo 34, Logroño, La Rioja 26003 — info@bdai.travel"
    }
  },
  en: {
    privacy: {
      title: "Privacy Policy", updated: "Last updated: March 14, 2026",
      intro: "At bdai (better destinations by ai), we respect your privacy and are committed to protecting your personal data.",
      s1title: "1. Information We Collect", s1: "We collect data you provide directly: name, email, age, city, country and language. We also collect GPS location data when you use the app to unlock stops and earn miles.",
      s2title: "2. How We Use Your Information", s2: "We use your information to provide and improve our services, personalize your experience and manage your account.",
      s3title: "3. Sharing Your Information", s3: "We do not sell your personal data to third parties. We may share anonymized information with local governments and businesses to improve the tourism experience.",
      s4title: "4. Your Rights (GDPR)", s4: "You have the right to access, rectify and request deletion of your data. You can delete your account from the profile section.",
      s5title: "5. Contact", s5: "Daysi Chong Zambrano — NIF: 16648955Z — Calle Calvo Sotelo 34, Logroño, La Rioja 26003 — info@bdai.travel"
    },
    terms: {
      title: "Terms of Use", updated: "Last updated: March 14, 2026",
      intro: "Welcome to bdai. By accessing or using our application, you agree to these Terms of Use.",
      s1title: "1. Use of the Application", s1: "bdai is a tourism data and gamification ecosystem. You agree to use the app only for lawful purposes.",
      s2title: "2. User Accounts", s2: "To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your login information.",
      s3title: "3. User Generated Content", s3: "By contributing content to the community, you grant us a non-exclusive worldwide license to use and improve it.",
      s4title: "4. Gamification and Rewards", s4: "Miles have no real monetary value. We reserve the right to modify the rewards program at any time.",
      s5title: "5. Limitation of Liability", s5: "The app is provided as is. We do not guarantee that the app will be uninterrupted or error-free.",
      s6title: "6. Contact", s6: "Daysi Chong Zambrano — NIF: 16648955Z — Calle Calvo Sotelo 34, Logroño, La Rioja 26003 — info@bdai.travel"
    }
  },
  fr: {
    privacy: { title: "Politique de Confidentialité", updated: "Dernière mise à jour: 14 mars 2026", intro: "Chez bdai, nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles.", s1title: "1. Informations collectées", s1: "Nous collectons les données que vous nous fournissez: nom, email, âge, ville, pays et langue.", s2title: "2. Utilisation de vos données", s2: "Nous utilisons vos informations pour fournir et améliorer nos services.", s3title: "3. Partage des données", s3: "Nous ne vendons pas vos données personnelles à des tiers.", s4title: "4. Vos droits (RGPD)", s4: "Vous avez le droit d'accéder, rectifier et demander la suppression de vos données.", s5title: "5. Contact", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Conditions d'Utilisation", updated: "Dernière mise à jour: 14 mars 2026", intro: "Bienvenue sur bdai. En accédant à notre application, vous acceptez ces Conditions.", s1title: "1. Utilisation", s1: "Vous vous engagez à utiliser l'application uniquement à des fins légales.", s2title: "2. Comptes", s2: "Vous êtes responsable de la confidentialité de vos informations de connexion.", s3title: "3. Contenu", s3: "En contribuant du contenu, vous nous accordez une licence mondiale non exclusive.", s4title: "4. Récompenses", s4: "Les miles n'ont pas de valeur monétaire réelle.", s5title: "5. Contact", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  de: {
    privacy: { title: "Datenschutzrichtlinie", updated: "Letzte Aktualisierung: 14. März 2026", intro: "Bei bdai respektieren wir Ihre Privatsphäre und verpflichten uns zum Schutz Ihrer persönlichen Daten.", s1title: "1. Gesammelte Daten", s1: "Wir sammeln Daten, die Sie uns direkt zur Verfügung stellen: Name, E-Mail, Alter, Stadt, Land und Sprache.", s2title: "2. Verwendung Ihrer Daten", s2: "Wir verwenden Ihre Informationen, um unsere Dienste bereitzustellen und Ihre Erfahrung zu personalisieren.", s3title: "3. Datenweitergabe", s3: "Wir verkaufen Ihre persönlichen Daten nicht an Dritte.", s4title: "4. Ihre Rechte (DSGVO)", s4: "Sie haben das Recht auf Zugang, Berichtigung und Löschung Ihrer Daten.", s5title: "5. Kontakt", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Nutzungsbedingungen", updated: "Letzte Aktualisierung: 14. März 2026", intro: "Willkommen bei bdai. Durch die Nutzung unserer App stimmen Sie diesen Nutzungsbedingungen zu.", s1title: "1. Nutzung", s1: "Sie verpflichten sich, die App nur für legale Zwecke zu nutzen.", s2title: "2. Benutzerkonten", s2: "Sie sind für die Vertraulichkeit Ihrer Anmeldedaten verantwortlich.", s3title: "3. Inhalte", s3: "Durch das Einreichen von Inhalten gewähren Sie uns eine weltweite nicht-exklusive Lizenz.", s4title: "4. Belohnungen", s4: "Meilen haben keinen echten Geldwert.", s5title: "5. Kontakt", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  it: {
    privacy: { title: "Informativa sulla Privacy", updated: "Ultimo aggiornamento: 14 marzo 2026", intro: "In bdai, rispettiamo la tua privacy e ci impegniamo a proteggere i tuoi dati personali.", s1title: "1. Dati raccolti", s1: "Raccogliamo i dati che ci fornisci: nome, email, età, città, paese e lingua.", s2title: "2. Uso dei dati", s2: "Usiamo i tuoi dati per fornire e migliorare i nostri servizi.", s3title: "3. Condivisione", s3: "Non vendiamo i tuoi dati personali a terzi.", s4title: "4. I tuoi diritti (GDPR)", s4: "Hai il diritto di accedere, rettificare e richiedere la cancellazione dei tuoi dati.", s5title: "5. Contatto", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Termini di Utilizzo", updated: "Ultimo aggiornamento: 14 marzo 2026", intro: "Benvenuto su bdai. Accedendo all'app, accetti questi Termini.", s1title: "1. Uso", s1: "Ti impegni a usare l'app solo per scopi legali.", s2title: "2. Account", s2: "Sei responsabile della riservatezza delle tue credenziali.", s3title: "3. Contenuti", s3: "Contribuendo contenuti, ci concedi una licenza mondiale non esclusiva.", s4title: "4. Premi", s4: "Le miglia non hanno valore monetario reale.", s5title: "5. Contatto", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  pt: {
    privacy: { title: "Política de Privacidade", updated: "Última atualização: 14 de março de 2026", intro: "Na bdai, respeitamos a sua privacidade e comprometemo-nos a proteger os seus dados pessoais.", s1title: "1. Dados coletados", s1: "Coletamos os dados que você nos fornece: nome, email, idade, cidade, país e idioma.", s2title: "2. Uso dos dados", s2: "Usamos seus dados para fornecer e melhorar nossos serviços.", s3title: "3. Compartilhamento", s3: "Não vendemos seus dados pessoais a terceiros.", s4title: "4. Seus direitos (RGPD)", s4: "Você tem o direito de acessar, retificar e solicitar a exclusão dos seus dados.", s5title: "5. Contato", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Termos de Uso", updated: "Última atualização: 14 de março de 2026", intro: "Bem-vindo ao bdai. Ao acessar nosso app, você concorda com estes Termos.", s1title: "1. Uso", s1: "Você concorda em usar o app apenas para fins legais.", s2title: "2. Contas", s2: "Você é responsável pela confidencialidade das suas credenciais.", s3title: "3. Conteúdo", s3: "Ao contribuir com conteúdo, você nos concede uma licença mundial não exclusiva.", s4title: "4. Recompensas", s4: "As milhas não têm valor monetário real.", s5title: "5. Contato", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ru: {
    privacy: { title: "Политика конфиденциальности", updated: "Последнее обновление: 14 марта 2026 г.", intro: "В bdai мы уважаем вашу конфиденциальность.", s1title: "1. Собираемые данные", s1: "Имя, email, возраст, город, страна, язык и GPS.", s2title: "2. Использование", s2: "Для предоставления и улучшения услуг.", s3title: "3. Передача данных", s3: "Мы не продаём ваши данные третьим лицам.", s4title: "4. Ваши права (GDPR)", s4: "Доступ, исправление и удаление данных.", s5title: "5. Контакт", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Условия использования", updated: "Последнее обновление: 14 марта 2026 г.", intro: "Добро пожаловать в bdai.", s1title: "1. Использование", s1: "Только в законных целях.", s2title: "2. Аккаунты", s2: "Вы отвечаете за конфиденциальность данных.", s3title: "3. Контент", s3: "Неисключительная мировая лицензия.", s4title: "4. Награды", s4: "Мили без денежной ценности.", s5title: "5. Контакт", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  zh: {
    privacy: { title: "隐私政策", updated: "最后更新：2026年3月14日", intro: "在bdai，我们尊重您的隐私。", s1title: "1. 收集的数据", s1: "姓名、电子邮件、年龄、城市、国家、语言和GPS数据。", s2title: "2. 数据使用", s2: "用于提供和改进服务。", s3title: "3. 数据共享", s3: "不向第三方出售数据。", s4title: "4. 您的权利", s4: "访问、更正和删除数据的权利。", s5title: "5. 联系方式", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "使用条款", updated: "最后更新：2026年3月14日", intro: "欢迎使用bdai。", s1title: "1. 使用", s1: "仅用于合法目的。", s2title: "2. 账户", s2: "保护您的登录信息。", s3title: "3. 内容", s3: "非独占全球许可。", s4title: "4. 奖励", s4: "里程无货币价值。", s5title: "5. 联系", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ja: {
    privacy: { title: "プライバシーポリシー", updated: "最終更新日：2026年3月14日", intro: "bdaiではお客様のプライバシーを尊重します。", s1title: "1. 収集するデータ", s1: "名前、メール、年齢、都市、国、言語、GPS。", s2title: "2. データの使用", s2: "サービスの提供・改善に使用します。", s3title: "3. データの共有", s3: "第三者への販売はしません。", s4title: "4. お客様の権利", s4: "アクセス、修正、削除の権利があります。", s5title: "5. お問い合わせ", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "利用規約", updated: "最終更新日：2026年3月14日", intro: "bdaiへようこそ。", s1title: "1. 利用", s1: "合法的な目的にのみ使用。", s2title: "2. アカウント", s2: "ログイン情報の保護はお客様の責任。", s3title: "3. コンテンツ", s3: "非独占的な世界規模のライセンス。", s4title: "4. 報酬", s4: "マイルに金銭的価値はありません。", s5title: "5. お問い合わせ", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ar: {
    privacy: { title: "سياسة الخصوصية", updated: "آخر تحديث: 14 مارس 2026", intro: "في bdai، نحترم خصوصيتك.", s1title: "1. البيانات", s1: "الاسم والبريد والعمر والمدينة والبلد واللغة وGPS.", s2title: "2. الاستخدام", s2: "لتقديم الخدمات وتحسينها.", s3title: "3. المشاركة", s3: "لا نبيع بياناتك.", s4title: "4. حقوقك", s4: "الوصول والتصحيح والحذف.", s5title: "5. التواصل", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "شروط الاستخدام", updated: "آخر تحديث: 14 مارس 2026", intro: "مرحباً بك في bdai.", s1title: "1. الاستخدام", s1: "للأغراض القانونية فقط.", s2title: "2. الحسابات", s2: "أنت مسؤول عن سرية بياناتك.", s3title: "3. المحتوى", s3: "ترخيص غير حصري عالمي.", s4title: "4. المكافآت", s4: "الأميال بلا قيمة نقدية.", s5title: "5. التواصل", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ca: {
    privacy: { title: "Política de Privacitat", updated: "Darrera actualització: 14 de març de 2026", intro: "A bdai, respectem la vostra privacitat.", s1title: "1. Dades recollides", s1: "Nom, email, edat, ciutat, país, idioma i GPS.", s2title: "2. Ús de les dades", s2: "Per proporcionar i millorar els nostres serveis.", s3title: "3. Compartir", s3: "No venem les vostres dades.", s4title: "4. Els vostres drets", s4: "Accés, rectificació i supressió.", s5title: "5. Contacte", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Termes d'Ús", updated: "Darrera actualització: 14 de març de 2026", intro: "Benvingut a bdai.", s1title: "1. Ús", s1: "Només per a fins legals.", s2title: "2. Comptes", s2: "Responsables de les vostres credencials.", s3title: "3. Contingut", s3: "Llicència mundial no exclusiva.", s4title: "4. Recompenses", s4: "Les milles no tenen valor monetari.", s5title: "5. Contacte", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  eu: {
    privacy: { title: "Pribatutasun Politika", updated: "Azken eguneratzea: 2026ko martxoaren 14a", intro: "bdai-n zure pribatutasuna errespetatzen dugu.", s1title: "1. Bildutako datuak", s1: "Izena, emaila, adina, hiria, herrialdea, hizkuntza eta GPS.", s2title: "2. Datuen erabilera", s2: "Zerbitzuak eskaintzeko eta hobetzeko.", s3title: "3. Partekatzea", s3: "Ez ditugu zure datuak saltzen.", s4title: "4. Zure eskubideak", s4: "Sartzeko, zuzentzeko eta ezabatzeko eskubidea.", s5title: "5. Kontaktua", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Erabilera Baldintzak", updated: "Azken eguneratzea: 2026ko martxoaren 14a", intro: "Ongi etorri bdai-ra.", s1title: "1. Erabilera", s1: "Helburu legaletarako bakarrik.", s2title: "2. Kontuak", s2: "Kredentzialak konfidentzialtasunez gordetzea.", s3title: "3. Edukia", s3: "Mundu mailako lizentzia ez-esklusiboa.", s4title: "4. Sariak", s4: "Miliek ez dute diru-balio errealrik.", s5title: "5. Kontaktua", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  }
};

const getText = (language: string, type: 'privacy' | 'terms') => {
  return LEGAL_TEXTS[language]?.[type] || LEGAL_TEXTS['en'][type];
};

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, language = 'es' }) => {
  const text = getText(language, type);

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/98 backdrop-blur-2xl flex flex-col">
      {/* Header fijo */}
      <div className="flex justify-between items-center px-6 pt-12 pb-4 shrink-0">
        <h2 className="text-white font-black text-xl uppercase tracking-widest">{text.title}</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/5 active:scale-90 shadow-lg shrink-0"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 overflow-y-auto px-6 pb-12">
        <div className="w-full max-w-md mx-auto bg-slate-900 border border-white/10 rounded-3xl p-6 text-slate-300 text-sm leading-relaxed space-y-6">
          <p><strong className="text-white">{text.updated}</strong></p>
          <p>{text.intro}</p>
          <h3 className="text-white font-bold uppercase tracking-widest text-xs pt-2">{text.s1title}</h3>
          <p>{text.s1}</p>
          <h3 className="text-white font-bold uppercase tracking-widest text-xs pt-2">{text.s2title}</h3>
          <p>{text.s2}</p>
          <h3 className="text-white font-bold uppercase tracking-widest text-xs pt-2">{text.s3title}</h3>
          <p>{text.s3}</p>
          <h3 className="text-white font-bold uppercase tracking-widest text-xs pt-2">{text.s4title}</h3>
          <p>{text.s4}</p>
          <h3 className="text-white font-bold uppercase tracking-widest text-xs pt-2">{text.s5title}</h3>
          <p>{text.s5}</p>
          {text.s6title && <>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs pt-2">{text.s6title}</h3>
            <p>{text.s6}</p>
          </>}
        </div>
      </div>
    </div>
  );
};

