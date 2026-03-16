import React from 'react';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
  language?: string;
}

const LEGAL_TEXTS: Record<string, any> = {
  es: {
    privacy: { title: "Política de Privacidad", updated: "Última actualización: 14 de Marzo de 2026", intro: "En bdai, respetamos su privacidad y estamos comprometidos a proteger sus datos personales.", s1title: "1. Información que recopilamos", s1: "Recopilamos datos que usted nos proporciona directamente: nombre, email, edad, ciudad, país e idioma. También recopilamos datos de ubicación GPS cuando usa la app para desbloquear paradas y ganar millas.", s2title: "2. Cómo usamos su información", s2: "Utilizamos su información para proporcionar y mejorar nuestros servicios, personalizar su experiencia y gestionar su cuenta.", s3title: "3. Compartir su información", s3: "No vendemos sus datos personales a terceros. Podemos compartir información anonimizada con ayuntamientos y comercios locales para mejorar la experiencia turística.", s4title: "4. Sus derechos (RGPD)", s4: "Tiene derecho a acceder, rectificar y solicitar la eliminación de sus datos. Puede ejercer su derecho al olvido eliminando su cuenta desde el perfil.", s5title: "5. Contacto", s5: "Daysi Chong Zambrano — NIF: 16648955Z — Calle Calvo Sotelo 34, Logroño, La Rioja 26003 — info@bdai.travel" },
    terms: { title: "Términos de Uso", updated: "Última actualización: 14 de Marzo de 2026", intro: "Bienvenido a bdai. Al acceder o utilizar nuestra aplicación, usted acepta estos Términos de Uso.", s1title: "1. Uso de la Aplicación", s1: "bdai es un ecosistema de datos turísticos y gamificación. Usted se compromete a utilizar la app solo para fines legales.", s2title: "2. Cuentas de Usuario", s2: "Para acceder a ciertas funciones, debe crear una cuenta. Usted es responsable de mantener la confidencialidad de su información de inicio de sesión.", s3title: "3. Contenido Generado por el Usuario", s3: "Al aportar contenido a la comunidad, nos otorga una licencia no exclusiva y mundial para utilizarlo y mejorarlo.", s4title: "4. Gamificación y Recompensas", s4: "Las millas no tienen valor monetario real. Nos reservamos el derecho de modificar el programa de recompensas en cualquier momento.", s5title: "5. Limitación de Responsabilidad", s5: "La app se proporciona tal cual. No garantizamos que sea ininterrumpida o libre de errores.", s6title: "6. Contacto", s6: "Daysi Chong Zambrano — NIF: 16648955Z — Calle Calvo Sotelo 34, Logroño, La Rioja 26003 — info@bdai.travel" }
  },
  en: {
    privacy: { title: "Privacy Policy", updated: "Last updated: March 14, 2026", intro: "At bdai, we respect your privacy and are committed to protecting your personal data.", s1title: "1. Information We Collect", s1: "We collect data you provide directly: name, email, age, city, country and language. We also collect GPS location data when you use the app to unlock stops and earn miles.", s2title: "2. How We Use Your Information", s2: "We use your information to provide and improve our services, personalize your experience and manage your account.", s3title: "3. Sharing Your Information", s3: "We do not sell your personal data to third parties. We may share anonymized information with local governments and businesses to improve the tourism experience.", s4title: "4. Your Rights (GDPR)", s4: "You have the right to access, rectify and request deletion of your data. You can delete your account from the profile section.", s5title: "5. Contact", s5: "Daysi Chong Zambrano — NIF: 16648955Z — Calle Calvo Sotelo 34, Logroño, La Rioja 26003 — info@bdai.travel" },
    terms: { title: "Terms of Use", updated: "Last updated: March 14, 2026", intro: "Welcome to bdai. By accessing or using our application, you agree to these Terms of Use.", s1title: "1. Use of the Application", s1: "bdai is a tourism data and gamification ecosystem. You agree to use the app only for lawful purposes.", s2title: "2. User Accounts", s2: "To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your login information.", s3title: "3. User Generated Content", s3: "By contributing content to the community, you grant us a non-exclusive worldwide license to use and improve it.", s4title: "4. Gamification and Rewards", s4: "Miles have no real monetary value. We reserve the right to modify the rewards program at any time.", s5title: "5. Limitation of Liability", s5: "The app is provided as is. We do not guarantee that the app will be uninterrupted or error-free.", s6title: "6. Contact", s6: "Daysi Chong Zambrano — NIF: 16648955Z — Calle Calvo Sotelo 34, Logroño, La Rioja 26003 — info@bdai.travel" }
  },
  fr: {
    privacy: { title: "Politique de Confidentialité", updated: "Dernière mise à jour: 14 mars 2026", intro: "Chez bdai, nous respectons votre vie privée.", s1title: "1. Informations collectées", s1: "Nous collectons les données que vous nous fournissez: nom, email, âge, ville, pays et langue.", s2title: "2. Utilisation", s2: "Nous utilisons vos informations pour fournir et améliorer nos services.", s3title: "3. Partage", s3: "Nous ne vendons pas vos données personnelles à des tiers.", s4title: "4. Vos droits (RGPD)", s4: "Vous avez le droit d'accéder, rectifier et demander la suppression de vos données.", s5title: "5. Contact", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Conditions d'Utilisation", updated: "Dernière mise à jour: 14 mars 2026", intro: "Bienvenue sur bdai.", s1title: "1. Utilisation", s1: "Vous vous engagez à utiliser l'application uniquement à des fins légales.", s2title: "2. Comptes", s2: "Vous êtes responsable de la confidentialité de vos informations.", s3title: "3. Contenu", s3: "En contribuant du contenu, vous nous accordez une licence mondiale.", s4title: "4. Récompenses", s4: "Les miles n'ont pas de valeur monétaire réelle.", s5title: "5. Contact", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  de: {
    privacy: { title: "Datenschutzrichtlinie", updated: "Letzte Aktualisierung: 14. März 2026", intro: "Bei bdai respektieren wir Ihre Privatsphäre.", s1title: "1. Gesammelte Daten", s1: "Wir sammeln Daten, die Sie uns direkt zur Verfügung stellen.", s2title: "2. Verwendung", s2: "Wir verwenden Ihre Informationen für unsere Dienste.", s3title: "3. Weitergabe", s3: "Wir verkaufen Ihre Daten nicht.", s4title: "4. Rechte (DSGVO)", s4: "Sie haben das Recht auf Zugang und Löschung Ihrer Daten.", s5title: "5. Kontakt", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Nutzungsbedingungen", updated: "Letzte Aktualisierung: 14. März 2026", intro: "Willkommen bei bdai.", s1title: "1. Nutzung", s1: "Sie verpflichten sich, die App nur für legale Zwecke zu nutzen.", s2title: "2. Konten", s2: "Sie sind für Ihre Anmeldedaten verantwortlich.", s3title: "3. Inhalte", s3: "Sie gewähren uns eine weltweite Lizenz.", s4title: "4. Belohnungen", s4: "Meilen haben keinen Geldwert.", s5title: "5. Kontakt", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  it: {
    privacy: { title: "Informativa sulla Privacy", updated: "Ultimo aggiornamento: 14 marzo 2026", intro: "In bdai, rispettiamo la tua privacy.", s1title: "1. Dati raccolti", s1: "Raccogliamo i dati che ci fornisci.", s2title: "2. Uso", s2: "Usiamo i tuoi dati per migliorare i servizi.", s3title: "3. Condivisione", s3: "Non vendiamo i tuoi dati a terzi.", s4title: "4. Diritti (GDPR)", s4: "Hai il diritto di accedere e cancellare i tuoi dati.", s5title: "5. Contatto", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Termini di Utilizzo", updated: "Ultimo aggiornamento: 14 marzo 2026", intro: "Benvenuto su bdai.", s1title: "1. Uso", s1: "Ti impegni a usare l'app solo per scopi legali.", s2title: "2. Account", s2: "Sei responsabile delle tue credenziali.", s3title: "3. Contenuti", s3: "Ci concedi una licenza mondiale.", s4title: "4. Premi", s4: "Le miglia non hanno valore reale.", s5title: "5. Contatto", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  pt: {
    privacy: { title: "Política de Privacidade", updated: "Última atualização: 14 de março de 2026", intro: "Na bdai, respeitamos a sua privacidade.", s1title: "1. Dados coletados", s1: "Coletamos os dados que você nos fornece.", s2title: "2. Uso", s2: "Usamos seus dados para melhorar os serviços.", s3title: "3. Compartilhamento", s3: "Não vendemos seus dados a terceiros.", s4title: "4. Direitos (RGPD)", s4: "Você tem direito de acessar e excluir seus dados.", s5title: "5. Contato", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Termos de Uso", updated: "Última atualização: 14 de março de 2026", intro: "Bem-vindo ao bdai.", s1title: "1. Uso", s1: "Você concorda em usar o app apenas para fins legais.", s2title: "2. Contas", s2: "Você é responsável pelas suas credenciais.", s3title: "3. Conteúdo", s3: "Você nos concede uma licença mundial.", s4title: "4. Recompensas", s4: "As milhas não têm valor monetário real.", s5title: "5. Contato", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ro: {
    privacy: { title: "Politica de Confidențialitate", updated: "Ultima actualizare: 14 martie 2026", intro: "La bdai, respectăm confidențialitatea dvs.", s1title: "1. Date colectate", s1: "Colectăm datele pe care ni le furnizați.", s2title: "2. Utilizare", s2: "Folosim datele dvs. pentru serviciile noastre.", s3title: "3. Partajare", s3: "Nu vindem datele dvs. personale.", s4title: "4. Drepturi (GDPR)", s4: "Aveți dreptul de a accesa și șterge datele dvs.", s5title: "5. Contact", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Termeni de Utilizare", updated: "Ultima actualizare: 14 martie 2026", intro: "Bun venit la bdai.", s1title: "1. Utilizare", s1: "Vă angajați să utilizați aplicația doar în scopuri legale.", s2title: "2. Conturi", s2: "Sunteți responsabil pentru credențialele dvs.", s3title: "3. Conținut", s3: "Ne acordați o licență mondială.", s4title: "4. Recompense", s4: "Milele nu au valoare monetară reală.", s5title: "5. Contact", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ru: {
    privacy: { title: "Политика конфиденциальности", updated: "Последнее обновление: 14 марта 2026", intro: "В bdai мы уважаем вашу конфиденциальность.", s1title: "1. Данные", s1: "Мы собираем данные, которые вы предоставляете.", s2title: "2. Использование", s2: "Мы используем ваши данные для услуг.", s3title: "3. Передача", s3: "Мы не продаём ваши данные.", s4title: "4. Права (GDPR)", s4: "Вы можете удалить свои данные.", s5title: "5. Контакт", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Условия использования", updated: "Последнее обновление: 14 марта 2026", intro: "Добро пожаловать в bdai.", s1title: "1. Использование", s1: "Вы обязуетесь использовать приложение законно.", s2title: "2. Аккаунты", s2: "Вы несёте ответственность за свои данные.", s3title: "3. Контент", s3: "Вы даёте нам лицензию.", s4title: "4. Награды", s4: "Мили не имеют денежной ценности.", s5title: "5. Контакт", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  zh: {
    privacy: { title: "隐私政策", updated: "最后更新：2026年3月14日", intro: "在bdai，我们尊重您的隐私。", s1title: "1. 数据收集", s1: "我们收集您提供的数据。", s2title: "2. 使用", s2: "我们使用您的数据提供服务。", s3title: "3. 共享", s3: "我们不出售您的数据。", s4title: "4. 权利", s4: "您可以删除您的数据。", s5title: "5. 联系", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "使用条款", updated: "最后更新：2026年3月14日", intro: "欢迎使用bdai。", s1title: "1. 使用", s1: "您同意合法使用本应用。", s2title: "2. 账户", s2: "您负责保护您的账户。", s3title: "3. 内容", s3: "您授予我们许可。", s4title: "4. 奖励", s4: "里程没有货币价值。", s5title: "5. 联系", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ja: {
    privacy: { title: "プライバシーポリシー", updated: "最終更新日：2026年3月14日", intro: "bdaiではプライバシーを尊重します。", s1title: "1. データ収集", s1: "名前、メール等のデータを収集します。", s2title: "2. 使用", s2: "サービス提供のためにデータを使用します。", s3title: "3. 共有", s3: "第三者への販売はしません。", s4title: "4. 権利", s4: "データの削除を要求できます。", s5title: "5. 連絡先", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "利用規約", updated: "最終更新日：2026年3月14日", intro: "bdaiへようこそ。", s1title: "1. 利用", s1: "合法的な目的にのみ使用。", s2title: "2. アカウント", s2: "ログイン情報の保護はお客様の責任です。", s3title: "3. コンテンツ", s3: "ライセンスを付与します。", s4title: "4. 報酬", s4: "マイルに金銭的価値はありません。", s5title: "5. 連絡先", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ar: {
    privacy: { title: "سياسة الخصوصية", updated: "آخر تحديث: 14 مارس 2026", intro: "في bdai، نحترم خصوصيتك.", s1title: "1. البيانات", s1: "نجمع البيانات التي تقدمها.", s2title: "2. الاستخدام", s2: "نستخدم بياناتك لتقديم خدماتنا.", s3title: "3. المشاركة", s3: "لا نبيع بياناتك.", s4title: "4. حقوقك", s4: "يمكنك حذف بياناتك.", s5title: "5. التواصل", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "شروط الاستخدام", updated: "آخر تحديث: 14 مارس 2026", intro: "مرحباً بك في bdai.", s1title: "1. الاستخدام", s1: "تلتزم باستخدام التطبيق للأغراض القانونية.", s2title: "2. الحسابات", s2: "أنت مسؤول عن بياناتك.", s3title: "3. المحتوى", s3: "تمنحنا ترخيصاً.", s4title: "4. المكافآت", s4: "الأميال ليس لها قيمة نقدية.", s5title: "5. التواصل", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  hi: {
    privacy: { title: "गोपनीयता नीति", updated: "अंतिम अपडेट: 14 मार्च 2026", intro: "bdai में हम आपकी गोपनीयता का सम्मान करते हैं।", s1title: "1. डेटा", s1: "हम आपके द्वारा प्रदान किया गया डेटा एकत्र करते हैं।", s2title: "2. उपयोग", s2: "हम डेटा का उपयोग सेवाएं प्रदान करने के लिए करते हैं।", s3title: "3. साझा करना", s3: "हम आपका डेटा नहीं बेचते।", s4title: "4. अधिकार", s4: "आप अपना डेटा हटा सकते हैं।", s5title: "5. संपर्क", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "उपयोग की शर्तें", updated: "अंतिम अपडेट: 14 मार्च 2026", intro: "bdai में आपका स्वागत है।", s1title: "1. उपयोग", s1: "केवल कानूनी उद्देश्यों के लिए ऐप का उपयोग करें।", s2title: "2. खाते", s2: "आप अपनी जानकारी के लिए जिम्मेदार हैं।", s3title: "3. सामग्री", s3: "आप हमें लाइसेंस प्रदान करते हैं।", s4title: "4. पुरस्कार", s4: "मील का कोई मौद्रिक मूल्य नहीं है।", s5title: "5. संपर्क", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ko: {
    privacy: { title: "개인정보 처리방침", updated: "최종 업데이트: 2026년 3월 14일", intro: "bdai에서는 개인정보를 보호합니다.", s1title: "1. 데이터", s1: "제공하는 데이터를 수집합니다.", s2title: "2. 사용", s2: "서비스 제공을 위해 사용합니다.", s3title: "3. 공유", s3: "개인 데이터를 판매하지 않습니다.", s4title: "4. 권리", s4: "데이터 삭제를 요청할 수 있습니다.", s5title: "5. 연락처", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "이용약관", updated: "최종 업데이트: 2026년 3월 14일", intro: "bdai에 오신 것을 환영합니다.", s1title: "1. 사용", s1: "합법적인 목적으로만 사용합니다.", s2title: "2. 계정", s2: "로그인 정보를 보호할 책임이 있습니다.", s3title: "3. 콘텐츠", s3: "라이선스를 부여합니다.", s4title: "4. 보상", s4: "마일은 금전적 가치가 없습니다.", s5title: "5. 연락처", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  tr: {
    privacy: { title: "Gizlilik Politikası", updated: "Son güncelleme: 14 Mart 2026", intro: "bdai'de gizliliğinize saygı duyuyoruz.", s1title: "1. Veriler", s1: "Sağladığınız verileri topluyoruz.", s2title: "2. Kullanım", s2: "Verilerinizi hizmetler için kullanıyoruz.", s3title: "3. Paylaşım", s3: "Verilerinizi satmıyoruz.", s4title: "4. Haklar", s4: "Verilerinizi silebilirsiniz.", s5title: "5. İletişim", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Kullanım Koşulları", updated: "Son güncelleme: 14 Mart 2026", intro: "bdai'ye hoş geldiniz.", s1title: "1. Kullanım", s1: "Uygulamayı yasal amaçlar için kullanın.", s2title: "2. Hesaplar", s2: "Bilgilerinizin güvenliğinden siz sorumlusunuz.", s3title: "3. İçerik", s3: "Bize lisans vermiş olursunuz.", s4title: "4. Ödüller", s4: "Millerin parasal değeri yoktur.", s5title: "5. İletişim", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  nl: {
    privacy: { title: "Privacybeleid", updated: "Laatste update: 14 maart 2026", intro: "Bij bdai respecteren we uw privacy.", s1title: "1. Gegevens", s1: "We verzamelen gegevens die u verstrekt.", s2title: "2. Gebruik", s2: "We gebruiken uw gegevens voor onze diensten.", s3title: "3. Delen", s3: "We verkopen uw gegevens niet.", s4title: "4. Rechten", s4: "U kunt uw gegevens verwijderen.", s5title: "5. Contact", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Gebruiksvoorwaarden", updated: "Laatste update: 14 maart 2026", intro: "Welkom bij bdai.", s1title: "1. Gebruik", s1: "U gebruikt de app alleen voor wettelijke doeleinden.", s2title: "2. Accounts", s2: "U bent verantwoordelijk voor uw gegevens.", s3title: "3. Inhoud", s3: "U verleent ons een licentie.", s4title: "4. Beloningen", s4: "Miles hebben geen geldwaarde.", s5title: "5. Contact", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  pl: {
    privacy: { title: "Polityka Prywatności", updated: "Ostatnia aktualizacja: 14 marca 2026", intro: "W bdai szanujemy Twoją prywatność.", s1title: "1. Dane", s1: "Zbieramy dane, które nam podajesz.", s2title: "2. Użycie", s2: "Używamy Twoich danych do świadczenia usług.", s3title: "3. Udostępnianie", s3: "Nie sprzedajemy Twoich danych.", s4title: "4. Prawa", s4: "Możesz usunąć swoje dane.", s5title: "5. Kontakt", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Warunki Użytkowania", updated: "Ostatnia aktualizacja: 14 marca 2026", intro: "Witamy w bdai.", s1title: "1. Użytkowanie", s1: "Używasz aplikacji tylko w celach zgodnych z prawem.", s2title: "2. Konta", s2: "Jesteś odpowiedzialny za swoje dane.", s3title: "3. Treść", s3: "Udzielasz nam licencji.", s4title: "4. Nagrody", s4: "Mile nie mają wartości pieniężnej.", s5title: "5. Kontakt", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  ca: {
    privacy: { title: "Política de Privacitat", updated: "Darrera actualització: 14 de març de 2026", intro: "A bdai, respectem la vostra privacitat.", s1title: "1. Dades", s1: "Recollim les dades que ens proporcioneu.", s2title: "2. Ús", s2: "Usem les dades per als nostres serveis.", s3title: "3. Compartir", s3: "No venem les vostres dades.", s4title: "4. Drets", s4: "Podeu eliminar les vostres dades.", s5title: "5. Contacte", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Termes d'Ús", updated: "Darrera actualització: 14 de març de 2026", intro: "Benvingut a bdai.", s1title: "1. Ús", s1: "Us comprometeu a usar l'app per a fins legals.", s2title: "2. Comptes", s2: "Sou responsables de les vostres credencials.", s3title: "3. Contingut", s3: "Ens atorgeu una llicència.", s4title: "4. Recompenses", s4: "Les milles no tenen valor monetari.", s5title: "5. Contacte", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  eu: {
    privacy: { title: "Pribatutasun Politika", updated: "Azken eguneratzea: 2026ko martxoaren 14a", intro: "bdai-n zure pribatutasuna errespetatzen dugu.", s1title: "1. Datuak", s1: "Ematen dizkiguzun datuak biltzen ditugu.", s2title: "2. Erabilera", s2: "Zure datuak zerbitzuetarako erabiltzen ditugu.", s3title: "3. Partekatzea", s3: "Ez ditugu zure datuak saltzen.", s4title: "4. Eskubideak", s4: "Zure datuak ezabatu ditzakezu.", s5title: "5. Kontaktua", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Erabilera Baldintzak", updated: "Azken eguneratzea: 2026ko martxoaren 14a", intro: "Ongi etorri bdai-ra.", s1title: "1. Erabilera", s1: "App-a helburu legaletarako bakarrik erabiltzeko.", s2title: "2. Kontuak", s2: "Zure kredentzialak gordetzea zure erantzukizuna da.", s3title: "3. Edukia", s3: "Lizentzia ematen diguzu.", s4title: "4. Sariak", s4: "Miliek ez dute diru-balio errealrik.", s5title: "5. Kontaktua", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  vi: {
    privacy: { title: "Chính sách Quyền riêng tư", updated: "Cập nhật: 14 tháng 3 năm 2026", intro: "Tại bdai, chúng tôi tôn trọng quyền riêng tư.", s1title: "1. Dữ liệu", s1: "Chúng tôi thu thập dữ liệu bạn cung cấp.", s2title: "2. Sử dụng", s2: "Chúng tôi sử dụng dữ liệu để cung cấp dịch vụ.", s3title: "3. Chia sẻ", s3: "Chúng tôi không bán dữ liệu của bạn.", s4title: "4. Quyền", s4: "Bạn có thể xóa dữ liệu của mình.", s5title: "5. Liên hệ", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "Điều khoản Sử dụng", updated: "Cập nhật: 14 tháng 3 năm 2026", intro: "Chào mừng đến với bdai.", s1title: "1. Sử dụng", s1: "Chỉ sử dụng ứng dụng cho mục đích hợp pháp.", s2title: "2. Tài khoản", s2: "Bạn chịu trách nhiệm về thông tin đăng nhập.", s3title: "3. Nội dung", s3: "Bạn cấp cho chúng tôi giấy phép.", s4title: "4. Phần thưởng", s4: "Dặm không có giá trị tiền tệ.", s5title: "5. Liên hệ", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  },
  th: {
    privacy: { title: "นโยบายความเป็นส่วนตัว", updated: "อัปเดต: 14 มีนาคม 2026", intro: "ที่ bdai เราเคารพความเป็นส่วนตัวของคุณ", s1title: "1. ข้อมูล", s1: "เราเก็บรวบรวมข้อมูลที่คุณให้", s2title: "2. การใช้", s2: "เราใช้ข้อมูลเพื่อให้บริการ", s3title: "3. การแชร์", s3: "เราไม่ขายข้อมูลของคุณ", s4title: "4. สิทธิ์", s4: "คุณสามารถลบข้อมูลของคุณได้", s5title: "5. ติดต่อ", s5: "Daysi Chong Zambrano — info@bdai.travel" },
    terms: { title: "ข้อกำหนดการใช้งาน", updated: "อัปเดต: 14 มีนาคม 2026", intro: "ยินดีต้อนรับสู่ bdai", s1title: "1. การใช้งาน", s1: "ใช้แอปเพื่อวัตถุประสงค์ที่ถูกกฎหมายเท่านั้น", s2title: "2. บัญชี", s2: "คุณรับผิดชอบข้อมูลเข้าสู่ระบบ", s3title: "3. เนื้อหา", s3: "คุณให้สิทธิ์ใช้งานแก่เรา", s4title: "4. รางวัล", s4: "ไมล์ไม่มีมูลค่าทางการเงิน", s5title: "5. ติดต่อ", s5: "Daysi Chong Zambrano — info@bdai.travel" }
  }
};

const getText = (language: string, type: 'privacy' | 'terms') => {
  return LEGAL_TEXTS[language]?.[type] || LEGAL_TEXTS['en'][type];
};

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, language = 'es' }) => {
  const text = getText(language, type);

  return (
    <div 
      className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl flex flex-col"
      style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div className="flex justify-between items-center px-6 pt-12 pb-4 shrink-0">
        <h2 className="text-white font-black text-xl uppercase tracking-widest">{text.title}</h2>
        <button 
          onClick={onClose} 
          className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/5 active:scale-90 shadow-lg shrink-0"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
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
          {text.s6title && (
            <>
              <h3 className="text-white font-bold uppercase tracking-widest text-xs pt-2">{text.s6title}</h3>
              <p>{text.s6}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
