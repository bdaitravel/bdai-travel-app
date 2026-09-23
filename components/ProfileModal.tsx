import ReactDOM from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { UserProfile, LANGUAGES, AVATARS, APP_BADGES } from '../types';
import { useParams, useNavigate } from 'react-router-dom';
import { queueProfileSync, supabase, setUsername, UsernameTakenError } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { toast } from './Toast';
import { AppleLogo } from './AppleLogo';
import { tourCacheService } from '../lib/tourCacheService';
import { translations } from '../data/translations';
import { LegalModal } from './LegalModal';
import { ReportBugModal } from './ReportBugModal';
import { ShareableBadge } from './ShareableBadge';
import { ShareableVisa } from './ShareableVisa';
import { VisaStamp, Badge } from '../types';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  language?: string;
  onLangChange?: (code: string) => void;
}

const MODAL_TEXTS: Record<string, Record<string, string>> = {
    es: { title: "Pasaporte Global bdai", subtitle: "Nómada Digital ID", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País", age: "Edad", birthday: "Nacimiento", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión", stamps: "Mis Visados", badges: "Insignias", rankBadges: "Rangos", achievementBadges: "Logros", langLabel: "Idioma", rank: "RANGO", miles: "MILLAS", admin: "ADMIN", streak: "Racha", changeAvatar: "Cambiar Foto", email: "Correo Electrónico", reportBug: "Reportar Error", privacy: "Privacidad", terms: "Términos", deleteAccount: "Eliminar Cuenta (GDPR)", deleteConfirmTitle: "⚠️ ZONA DE PELIGRO", deleteConfirmText: "Esta acción es IRREVERSIBLE. Perderás todas tus millas, visados, insignias e historial para siempre.", deleteConfirmInstruction: "Escribe tu email para confirmar:", deleteConfirmPlaceholder: "tu@email.com", deleteConfirmCancel: "Cancelar", deleteConfirmYes: "Eliminar permanentemente", deleting: "Borrando...", deleteCountdown: "Espera {n}s...", deleteEmailMismatch: "El email no coincide", deleteWordConfirm: "eliminar", deleteConfirmInstructionNoEmail: "Escribe ELIMINAR para confirmar:", offlineCacheLabel: "Caché Tours Offline", clearCache: "Vaciar" },
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad ID", surname: "Surname", givenNames: "First Name", city: "City", country: "Country", age: "Age", birthday: "Birthdate", save: "Save", edit: "Edit", logout: "Logout", stamps: "My Visas", badges: "Badges", rankBadges: "Ranks", achievementBadges: "Achievements", langLabel: "Language", rank: "RANK", miles: "MILES", admin: "ADMIN", streak: "Streak", changeAvatar: "Change Photo", email: "Email Address", reportBug: "Report Bug", privacy: "Privacy", terms: "Terms", deleteAccount: "Delete Account (GDPR)", deleteConfirmTitle: "⚠️ DANGER ZONE", deleteConfirmText: "This action is IRREVERSIBLE. You will permanently lose all your miles, visas, badges and history.", deleteConfirmInstruction: "Type your email to confirm:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "Cancel", deleteConfirmYes: "Permanently delete", deleting: "Deleting...", deleteCountdown: "Wait {n}s...", deleteEmailMismatch: "Email doesn't match", deleteWordConfirm: "delete", deleteConfirmInstructionNoEmail: "Type DELETE to confirm:", offlineCacheLabel: "Tours Offline Cache", clearCache: "Clear" },
    fr: { title: "Passeport Global bdai", subtitle: "ID Nomade Numérique", surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays", age: "Âge", birthday: "Naissance", save: "Enregistrer", edit: "Modifier", logout: "Déconnexion", stamps: "Mes Visas", badges: "Badges", rankBadges: "Rangs", achievementBadges: "Réalisations", langLabel: "Langue", rank: "RANG", miles: "MILES", admin: "ADMIN", streak: "Série", changeAvatar: "Changer Photo", email: "Adresse e-mail", reportBug: "Signaler un bug", privacy: "Confidentialité", terms: "Conditions", deleteAccount: "Supprimer le Compte (RGPD)", deleteConfirmTitle: "⚠️ ZONE DANGEREUSE", deleteConfirmText: "Cette action est IRRÉVERSIBLE. Vous perdrez définitivement tous vos miles, visas, badges et historique.", deleteConfirmInstruction: "Tapez votre email pour confirmer:", deleteConfirmPlaceholder: "votre@email.com", deleteConfirmCancel: "Annuler", deleteConfirmYes: "Supprimer définitivement", deleting: "Suppression...", deleteCountdown: "Attendez {n}s...", deleteEmailMismatch: "L'email ne correspond pas", deleteWordConfirm: "supprimer", deleteConfirmInstructionNoEmail: "Tapez SUPPRIMER pour confirmer:", offlineCacheLabel: "Cache des Circuits Hors Ligne", clearCache: "Vider" },
    de: { title: "bdai Globaler Pass", subtitle: "Digital Nomad ID", surname: "Nachname", givenNames: "Vornamen", city: "Stadt", country: "Land", age: "Alter", birthday: "Geburtstag", save: "Speichern", edit: "Bearbeiten", logout: "Abmelden", stamps: "Meine Visa", badges: "Abzeichen", rankBadges: "Ränge", achievementBadges: "Erfolge", langLabel: "Sprache", rank: "RANG", miles: "MEILEN", admin: "ADMIN", streak: "Serie", changeAvatar: "Foto ändern", email: "E-Mail-Adresse", reportBug: "Fehler melden", privacy: "Datenschutz", terms: "Nutzungsbedingungen", deleteAccount: "Konto löschen (DSGVO)", deleteConfirmTitle: "⚠️ GEFAHRENZONE", deleteConfirmText: "Diese Aktion ist UNWIDERRUFLICH. Sie verlieren alle Meilen, Visa, Abzeichen und den Verlauf dauerhaft.", deleteConfirmInstruction: "E-Mail zur Bestätigung eingeben:", deleteConfirmPlaceholder: "ihre@email.com", deleteConfirmCancel: "Abbrechen", deleteConfirmYes: "Dauerhaft löschen", deleting: "Löschen...", deleteCountdown: "Warten {n}s...", deleteEmailMismatch: "E-Mail stimmt nicht überein", deleteWordConfirm: "löschen", deleteConfirmInstructionNoEmail: "Gib LÖSCHEN ein, um zu bestätigen:", offlineCacheLabel: "Offline-Tour-Cache", clearCache: "Leeren" },
    it: { title: "Passaporto Globale bdai", subtitle: "ID Nomade Digitale", surname: "Cognome", givenNames: "Nomi", city: "Città", country: "Paese", age: "Età", birthday: "F. Nascita", save: "Salva", edit: "Modifica", logout: "Esci", stamps: "I Miei Visti", badges: "Distintivi", rankBadges: "Gradi", achievementBadges: "Risultati", langLabel: "Lingua", rank: "RANGO", miles: "MIGLIA", admin: "ADMIN", streak: "Serie", changeAvatar: "Cambia Foto", email: "Indirizzo email", reportBug: "Segnala un bug", privacy: "Privacy", terms: "Termini", deleteAccount: "Elimina Account (GDPR)", deleteConfirmTitle: "⚠️ ZONA PERICOLOSA", deleteConfirmText: "Questa azione è IRREVERSIBILE. Perderai definitivamente tutte le miglia, visti, distintivi e cronologia.", deleteConfirmInstruction: "Digita la tua email per confermare:", deleteConfirmPlaceholder: "tua@email.com", deleteConfirmCancel: "Annulla", deleteConfirmYes: "Elimina definitivamente", deleting: "Eliminazione...", deleteCountdown: "Aspetta {n}s...", deleteEmailMismatch: "L'email non corrisponde", deleteWordConfirm: "elimina", deleteConfirmInstructionNoEmail: "Scrivi ELIMINA per confermare:", offlineCacheLabel: "Cache Tour Offline", clearCache: "Svuota" },
    pt: { title: "Passaporte Global bdai", subtitle: "ID Nómada Digital", surname: "Apelido", givenNames: "Nomes", city: "Cidade", country: "País", age: "Idade", birthday: "Nascimento", save: "Guardar", edit: "Editar", logout: "Sair", stamps: "Meus Vistos", badges: "Distintivos", rankBadges: "Classificações", achievementBadges: "Conquistas", langLabel: "Idioma", rank: "RANKING", miles: "MILHAS", admin: "ADMIN", streak: "Sequência", changeAvatar: "Mudar Foto", email: "Endereço de email", reportBug: "Reportar Erro", privacy: "Privacidade", terms: "Termos", deleteAccount: "Eliminar Conta (RGPD)", deleteConfirmTitle: "⚠️ ZONA DE PERIGO", deleteConfirmText: "Esta ação é IRREVERSÍVEL. Perderá permanentemente todas as suas milhas, vistos, emblemas e histórico.", deleteConfirmInstruction: "Escreva o seu email para confirmar:", deleteConfirmPlaceholder: "seu@email.com", deleteConfirmCancel: "Cancelar", deleteConfirmYes: "Eliminar permanentemente", deleting: "Eliminando...", deleteCountdown: "Aguarde {n}s...", deleteEmailMismatch: "O email não corresponde", deleteWordConfirm: "eliminar", deleteConfirmInstructionNoEmail: "Escreva ELIMINAR para confirmar:", offlineCacheLabel: "Cache de Tours Offline", clearCache: "Limpar" },
    ro: { title: "Pașaport Global bdai", subtitle: "ID Nomad Digital", surname: "Nume", givenNames: "Prenume", city: "Oraș", country: "Țară", age: "Vârstă", birthday: "Naștere", save: "Salvare", edit: "Editare", logout: "Deconectare", stamps: "Vizele Mele", badges: "Insigne", rankBadges: "Ranguri", achievementBadges: "Realizări", langLabel: "Limbă", rank: "RANG", miles: "MILE", admin: "ADMIN", streak: "Serie", changeAvatar: "Schimbă Foto", email: "Adresă email", reportBug: "Raportează o eroare", privacy: "Confidențialitate", terms: "Termeni", deleteAccount: "Șterge Contul (GDPR)", deleteConfirmTitle: "⚠️ ZONĂ PERICULOASĂ", deleteConfirmText: "Această acțiune este IREVERSIBILĂ. Veți pierde definitiv toate milele, vizele, insignele și istoricul.", deleteConfirmInstruction: "Introduceți emailul pentru confirmare:", deleteConfirmPlaceholder: "email@tau.com", deleteConfirmCancel: "Anulare", deleteConfirmYes: "Șterge definitiv", deleting: "Ștergere...", deleteCountdown: "Așteptați {n}s...", deleteEmailMismatch: "Emailul nu se potrivește", deleteWordConfirm: "șterge", deleteConfirmInstructionNoEmail: "Scrie ȘTERGE pentru a confirma:", offlineCacheLabel: "Cache Tururi Offline", clearCache: "Golește" },
    ru: { title: "Глобальный паспорт bdai", subtitle: "ID кочевника", surname: "Фамилия", givenNames: "Имя", city: "Город", country: "Страна", age: "Возраст", birthday: "Рождение", save: "Сохранить", edit: "Править", logout: "Выйти", stamps: "Визы", badges: "Значки", rankBadges: "Ранги", achievementBadges: "Достижения", langLabel: "Язык", rank: "РАНГ", miles: "МИЛИ", admin: "АДМИН", streak: "Серия", changeAvatar: "Сменить фото", email: "Электронная почта", reportBug: "Сообщить об ошибке", privacy: "Конфиденциальность", terms: "Условия", deleteAccount: "Удалить Аккаунт (GDPR)", deleteConfirmTitle: "⚠️ ОПАСНАЯ ЗОНА", deleteConfirmText: "Это действие НЕОБРАТИМО. Вы навсегда потеряете все мили, визы, значки и историю.", deleteConfirmInstruction: "Введите email для подтверждения:", deleteConfirmPlaceholder: "ваш@email.com", deleteConfirmCancel: "Отмена", deleteConfirmYes: "Удалить навсегда", deleting: "Удаление...", deleteCountdown: "Подождите {n}с...", deleteEmailMismatch: "Email не совпадает", deleteWordConfirm: "удалить", deleteConfirmInstructionNoEmail: "Введите УДАЛИТЬ для подтверждения:", offlineCacheLabel: "Кэш офлайн-туров", clearCache: "Очистить" },
    ar: { title: "جواز سفر bdai العالمي", subtitle: "هوية البدوي الرقمي", surname: "اللقب", givenNames: "الأسماء", city: "المدينة", country: "البلد", age: "العمر", birthday: "الميلاد", save: "حفظ", edit: "تعديل", logout: "خروج", stamps: "تأشيراتي", badges: "الأوسمة", rankBadges: "الرتب", achievementBadges: "الإنجازات", langLabel: "اللغة", rank: "الرتبة", miles: "الأميال", admin: "مسؤول", streak: "سلسلة", changeAvatar: "تغيير الصورة", email: "البريد الإلكتروني", reportBug: "الإبلاغ عن خطأ", privacy: "الخصوصية", terms: "الشروط", deleteAccount: "حذف الحساب (GDPR)", deleteConfirmTitle: "⚠️ منطقة الخطر", deleteConfirmText: "هذا الإجراء لا رجعة فيه. ستفقد جميع أميالك وتأشيراتك وأوسمتك وسجلك إلى الأبد.", deleteConfirmInstruction: "اكتب بريدك الإلكتروني للتأكيد:", deleteConfirmPlaceholder: "بريدك@email.com", deleteConfirmCancel: "إلغاء", deleteConfirmYes: "حذف نهائياً", deleting: "جارٍ الحذف...", deleteCountdown: "انتظر {n}ث...", deleteEmailMismatch: "البريد الإلكتروني لا يتطابق", deleteWordConfirm: "حذف", deleteConfirmInstructionNoEmail: "اكتب حذف للتأكيد:", offlineCacheLabel: "ذاكرة التخزين المؤقت للجولات دون اتصال", clearCache: "إفراغ" },
    zh: { title: "bdai 全球护照", subtitle: "数字游民 ID", surname: "姓", givenNames: "名", city: "城市", country: "国家", age: "年龄", birthday: "生日", save: "保存", edit: "编辑", logout: "登出", stamps: "我的签证", badges: "奖章", rankBadges: "等级", achievementBadges: "成就", langLabel: "语言", rank: "等级", miles: "里程", admin: "管理", streak: "连续", changeAvatar: "更换照片", email: "电子邮件", reportBug: "报告错误", privacy: "隐私", terms: "条款", deleteAccount: "删除账户 (GDPR)", deleteConfirmTitle: "⚠️ 危险区域", deleteConfirmText: "此操作不可逆。您将永久失去所有里程、签证、徽章和历史记录。", deleteConfirmInstruction: "输入您的邮箱以确认:", deleteConfirmPlaceholder: "您的@邮箱.com", deleteConfirmCancel: "取消", deleteConfirmYes: "永久删除", deleting: "删除中...", deleteCountdown: "等待 {n}秒...", deleteEmailMismatch: "邮箱不匹配", deleteWordConfirm: "删除", deleteConfirmInstructionNoEmail: "输入“删除”以确认：", offlineCacheLabel: "离线行程缓存", clearCache: "清除" },
    ja: { title: "bdai パスポート", subtitle: "デジタルノマド ID", surname: "姓", givenNames: "名", city: "都市", country: "国", age: "年齢", birthday: "誕生日", save: "保存", edit: "編集", logout: "ログアウト", stamps: "ビザ", badges: "バッジ", rankBadges: "ランク", achievementBadges: "実績", langLabel: "言語", rank: "ランク", miles: "マイル", admin: "管理", streak: "記録", changeAvatar: "写真変更", email: "メールアドレス", reportBug: "バグを報告", privacy: "プライバシー", terms: "利用規約", deleteAccount: "アカウント削除 (GDPR)", deleteConfirmTitle: "⚠️ 危険ゾーン", deleteConfirmText: "この操作は元に戻せません。すべてのマイル、ビザ、バッジ、履歴が永久に失われます。", deleteConfirmInstruction: "確認のためメールアドレスを入力:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "キャンセル", deleteConfirmYes: "完全に削除する", deleting: "削除中...", deleteCountdown: "{n}秒待機中...", deleteEmailMismatch: "メールアドレスが一致しません", deleteWordConfirm: "削除", deleteConfirmInstructionNoEmail: "確認のため「削除」と入力してください：", offlineCacheLabel: "オフラインツアーキャッシュ", clearCache: "消去" },
    ko: { title: "bdai 글로벌 여권", subtitle: "디지털 노마드 ID", surname: "성", givenNames: "이름", city: "도시", country: "국가", age: "나이", birthday: "생일", save: "저장", edit: "편집", logout: "로그아웃", stamps: "내 비자", badges: "배지", rankBadges: "등급", achievementBadges: "업적", langLabel: "언어", rank: "등급", miles: "마일", admin: "관리자", streak: "연속", changeAvatar: "사진 변경", email: "이메일 주소", reportBug: "버그 신고", privacy: "개인정보", terms: "이용약관", deleteAccount: "계정 삭제 (GDPR)", deleteConfirmTitle: "⚠️ 위험 구역", deleteConfirmText: "이 작업은 되돌릴 수 없습니다. 모든 마일, 비자, 배지, 기록이 영구적으로 삭제됩니다.", deleteConfirmInstruction: "확인을 위해 이메일을 입력하세요:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "취소", deleteConfirmYes: "영구 삭제", deleting: "삭제 중...", deleteCountdown: "{n}초 대기...", deleteEmailMismatch: "이메일이 일치하지 않습니다", deleteWordConfirm: "삭제", deleteConfirmInstructionNoEmail: "확인을 위해 '삭제'를 입력하세요:", offlineCacheLabel: "오프라인 투어 캐시", clearCache: "비우기" },
    hi: { title: "bdai वैश्विक पासपोर्ट", subtitle: "डिजिटल घुमंतू आईडी", surname: "उपनाम", givenNames: "नाम", city: "शहर", country: "देश", age: "आयु", birthday: "जन्मदिन", save: "सहेजें", edit: "संपादित करें", logout: "लॉगआउट", stamps: "मेरे वीजा", badges: "बैज", rankBadges: "रैंक", achievementBadges: "उपलब्धियां", langLabel: "भाषा", rank: "रैंक", miles: "मील", admin: "व्यवस्थापक", streak: "लगातार", changeAvatar: "फोटो बदलें", email: "ईमेल पता", reportBug: "बग की रिपोर्ट करें", privacy: "गोपनीयता", terms: "नियम", deleteAccount: "खाता हटाएं (GDPR)", deleteConfirmTitle: "⚠️ खतरा क्षेत्र", deleteConfirmText: "यह क्रिया अपरिवर्तनीय है। आपकी सभी मील, वीजा, बैज और इतिहास हमेशा के लिए नष्ट हो जाएगा।", deleteConfirmInstruction: "पुष्टि के लिए अपना ईमेल लिखें:", deleteConfirmPlaceholder: "आपका@ईमेल.com", deleteConfirmCancel: "रद्द करें", deleteConfirmYes: "स्थायी रूप से हटाएं", deleting: "हटाया जा रहा है...", deleteCountdown: "{n}s प्रतीक्षा करें...", deleteEmailMismatch: "ईमेल मेल नहीं खाता", deleteWordConfirm: "हटाएं", deleteConfirmInstructionNoEmail: "पुष्टि के लिए हटाएं लिखें:", offlineCacheLabel: "ऑफ़लाइन टूर कैश", clearCache: "खाली करें" },
    tr: { title: "bdai Küresel Pasaport", subtitle: "Dijital Nomad Kimliği", surname: "Soyadı", givenNames: "İsimler", city: "Şehir", country: "Ülke", age: "Yaş", birthday: "Doğum", save: "Kaydet", edit: "Düzenle", logout: "Çıkış", stamps: "Vizelerim", badges: "Rozetler", rankBadges: "Rütbeler", achievementBadges: "Başarılar", langLabel: "Dil", rank: "RÜTBE", miles: "MİLLER", admin: "YÖNETİCİ", streak: "Seri", changeAvatar: "Fotoğraf Değiştir", email: "E-posta adresi", reportBug: "Hata Bildir", privacy: "Gizlilik", terms: "Koşullar", deleteAccount: "Hesabı Sil (GDPR)", deleteConfirmTitle: "⚠️ TEHLİKE BÖLGESİ", deleteConfirmText: "Bu işlem GERİ ALINAMAZ. Tüm millerinizi, vizelerinizi, rozetlerinizi ve geçmişinizi sonsuza kadar kaybedeceksiniz.", deleteConfirmInstruction: "Onaylamak için e-postanızı yazın:", deleteConfirmPlaceholder: "sizin@email.com", deleteConfirmCancel: "İptal", deleteConfirmYes: "Kalıcı olarak sil", deleting: "Siliniyor...", deleteCountdown: "{n}s bekleyin...", deleteEmailMismatch: "E-posta eşleşmiyor", deleteWordConfirm: "sil", deleteConfirmInstructionNoEmail: "Onaylamak için SİL yazın:", offlineCacheLabel: "Çevrimdışı Tur Önbelleği", clearCache: "Temizle" },
    nl: { title: "bdai Globaal Paspoort", subtitle: "Digital Nomad ID", surname: "Achternaam", givenNames: "Voornamen", city: "Stad", country: "Land", age: "Leeftijd", birthday: "Geboortedatum", save: "Opslaan", edit: "Bewerken", logout: "Uitloggen", stamps: "Mijn Visa", badges: "Badges", rankBadges: "Rangen", achievementBadges: "Prestaties", langLabel: "Taal", rank: "RANG", miles: "MIJL", admin: "ADMIN", streak: "Reeks", changeAvatar: "Foto wijzigen", email: "E-mailadres", reportBug: "Fout melden", privacy: "Privacy", terms: "Voorwaarden", deleteAccount: "Account verwijderen (GDPR)", deleteConfirmTitle: "⚠️ GEVARENZONE", deleteConfirmText: "Deze actie is ONOMKEERBAAR. U verliest permanent alle mijlen, visa, badges en geschiedenis.", deleteConfirmInstruction: "Typ uw e-mail ter bevestiging:", deleteConfirmPlaceholder: "uw@email.com", deleteConfirmCancel: "Annuleren", deleteConfirmYes: "Permanent verwijderen", deleting: "Verwijderen...", deleteCountdown: "Wacht {n}s...", deleteEmailMismatch: "E-mail komt niet overeen", deleteWordConfirm: "verwijderen", deleteConfirmInstructionNoEmail: "Typ VERWIJDEREN ter bevestiging:", offlineCacheLabel: "Offline Tour Cache", clearCache: "Leegmaken" },
    pl: { title: "Globalny Paszport bdai", subtitle: "ID Nomady", surname: "Nazwisko", givenNames: "Imiona", city: "Miasto", country: "Kraj", age: "Wiek", birthday: "Data urodzenia", save: "Zapisz", edit: "Edytuj", logout: "Wyloguj", stamps: "Wizy", badges: "Odznaki", rankBadges: "Rangi", achievementBadges: "Osiągnięcia", langLabel: "Język", rank: "RANGA", miles: "MILE", admin: "ADMIN", streak: "Seria", changeAvatar: "Zmień zdjęcie", email: "Adres e-mail", reportBug: "Zgłoś błąd", privacy: "Prywatność", terms: "Warunki", deleteAccount: "Usuń Konto (RODO)", deleteConfirmTitle: "⚠️ STREFA ZAGROŻENIA", deleteConfirmText: "Ta akcja jest NIEODWRACALNA. Stracisz na zawsze wszystkie mile, wizy, odznaki i historię.", deleteConfirmInstruction: "Wpisz swój email, aby potwierdzić:", deleteConfirmPlaceholder: "twoj@email.com", deleteConfirmCancel: "Anuluj", deleteConfirmYes: "Usuń trwale", deleting: "Usuwanie...", deleteCountdown: "Poczekaj {n}s...", deleteEmailMismatch: "Email nie pasuje", deleteWordConfirm: "usuń", deleteConfirmInstructionNoEmail: "Wpisz USUŃ, aby potwierdzić:", offlineCacheLabel: "Pamięć podręczna wycieczek offline", clearCache: "Wyczyść" },
    ca: { title: "Passaport Global bdai", subtitle: "ID Nòmada Digital", surname: "Cognoms", givenNames: "Noms", city: "Ciutat", country: "País", age: "Edat", birthday: "Naixement", save: "Desar", edit: "Editar", logout: "Sortir", stamps: "Els Meus Visats", badges: "Insígnies", rankBadges: "Rangs", achievementBadges: "Assoliments", langLabel: "Idioma", rank: "RANG", miles: "MILLES", admin: "ADMIN", streak: "Ratxa", changeAvatar: "Canviar Foto", email: "Adreça de correu", reportBug: "Informar d'un error", privacy: "Privacitat", terms: "Termes", deleteAccount: "Eliminar Compte (RGPD)", deleteConfirmTitle: "⚠️ ZONA DE PERILL", deleteConfirmText: "Aquesta acció és IRREVERSIBLE. Perdràs permanentment totes les milles, visats, insígnies i historial.", deleteConfirmInstruction: "Escriu el teu email per confirmar:", deleteConfirmPlaceholder: "el@teu.email", deleteConfirmCancel: "Cancel·lar", deleteConfirmYes: "Eliminar permanentment", deleting: "Eliminant...", deleteCountdown: "Espera {n}s...", deleteEmailMismatch: "L'email no coincideix", deleteWordConfirm: "eliminar", deleteConfirmInstructionNoEmail: "Escriu ELIMINAR per confirmar:", offlineCacheLabel: "Memòria cau de Tours Offline", clearCache: "Buida" },
    eu: { title: "bdai Pasaporte Globala", subtitle: "ID Nomada Digitala", surname: "Abizenak", givenNames: "Izenak", city: "Hiria", country: "Herrialdea", age: "Adina", birthday: "Jaioteguna", save: "Gorde", edit: "Editatu", logout: "Saioa Itxi", stamps: "Nire Visatuak", badges: "Intsigniak", rankBadges: "Mailak", achievementBadges: "Lorpenak", langLabel: "Hizkuntza", rank: "MAILA", miles: "MILIAK", admin: "ADMIN", streak: "Segida", changeAvatar: "Argazkia Aldatu", email: "Helbide elektronikoa", reportBug: "Akatsa jakinarazi", privacy: "Pribatutasuna", terms: "Baldintzak", deleteAccount: "Kontua Ezabatu (DBEO)", deleteConfirmTitle: "⚠️ ARRISKU EREMUA", deleteConfirmText: "Ekintza hau ITZULEZINA da. Zure milia, bisa, txapa eta historia guztiak betirako galduko dituzu.", deleteConfirmInstruction: "Idatzi zure emaila baieztatzeko:", deleteConfirmPlaceholder: "zure@emaila.com", deleteConfirmCancel: "Utzi", deleteConfirmYes: "Behin betiko ezabatu", deleting: "Ezabatzen...", deleteCountdown: "Itxaron {n}s...", deleteEmailMismatch: "Emaila ez dator bat", deleteWordConfirm: "ezabatu", deleteConfirmInstructionNoEmail: "Idatzi EZABATU berresteko:", offlineCacheLabel: "Lineaz kanpoko bisitaldien katxea", clearCache: "Hustu" },
    vi: { title: "Hộ chiếu Toàn cầu bdai", subtitle: "ID Du mục", surname: "Họ", givenNames: "Tên", city: "Thành phố", country: "Quốc gia", age: "Tuổi", birthday: "Ngày sinh", save: "Lưu", edit: "Chỉnh sửa", logout: "Đăng xuất", stamps: "Thị thực", badges: "Huy hiệu", rankBadges: "Cấp bậc", achievementBadges: "Thành tựu", langLabel: "Ngôn ngữ", rank: "CẤP BẬC", miles: "DẶM", admin: "QUẢN TRỊ", streak: "Chuỗi", changeAvatar: "Đổi ảnh", email: "Địa chỉ email", reportBug: "Báo cáo lỗi", privacy: "Quyền riêng tư", terms: "Điều khoản", deleteAccount: "Xóa Tài Khoản (GDPR)", deleteConfirmTitle: "⚠️ VÙNG NGUY HIỂM", deleteConfirmText: "Hành động này KHÔNG THỂ HOÀN TÁC. Bạn sẽ mất vĩnh viễn tất cả dặm, thị thực, huy hiệu và lịch sử.", deleteConfirmInstruction: "Nhập email của bạn để xác nhận:", deleteConfirmPlaceholder: "email@cua.ban", deleteConfirmCancel: "Hủy", deleteConfirmYes: "Xóa vĩnh viễn", deleting: "Đang xóa...", deleteCountdown: "Chờ {n}s...", deleteEmailMismatch: "Email không khớp", deleteWordConfirm: "xóa", deleteConfirmInstructionNoEmail: "Nhập XÓA để xác nhận:", offlineCacheLabel: "Bộ nhớ đệm Tour Ngoại tuyến", clearCache: "Xóa bộ nhớ đệm" },
    th: { title: "พาสปอร์ตทั่วโลก bdai", subtitle: "รหัสนักเดินทาง", surname: "นามสกุล", givenNames: "ชื่อ", city: "เมือง", country: "ประเทศ", age: "อายุ", birthday: "วันเกิด", save: "บันทึก", edit: "แก้ไข", logout: "ออก", stamps: "วีซ่า", badges: "เหรียญตรา", rankBadges: "อันดับ", achievementBadges: "ความสำเร็จ", langLabel: "ภาษา", rank: "อันดับ", miles: "ไมล์", admin: "ผู้ดูแล", streak: "สถิติ", changeAvatar: "เปลี่ยนรูป", email: "ที่อยู่อีเมล", reportBug: "รายงานปัญหา", privacy: "ความเป็นส่วนตัว", terms: "ข้อกำหนด", deleteAccount: "ลบบัญชี (GDPR)", deleteConfirmTitle: "⚠️ เขตอันตราย", deleteConfirmText: "การกระทำนี้ไม่สามารถยกเลิกได้ คุณจะสูญเสียไมล์ วีซ่า เหรียญตรา และประวัติทั้งหมดอย่างถาวร", deleteConfirmInstruction: "พิมพ์อีเมลของคุณเพื่อยืนยัน:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "ยกเลิก", deleteConfirmYes: "ลบถาวร", deleting: "กำลังลบ...", deleteCountdown: "รอ {n}s...", deleteEmailMismatch: "อีเมลไม่ตรงกัน", deleteWordConfirm: "ลบ", deleteConfirmInstructionNoEmail: "พิมพ์ ลบ เพื่อยืนยัน:", offlineCacheLabel: "แคชทัวร์ออฟไลน์", clearCache: "ล้างข้อมูล" }
};

const LangCircle: React.FC<{ code: string; label: string; isActive: boolean; onClick: () => void }> = ({ code, label, isActive, onClick }) => (
    <button onClick={onClick} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all active:scale-90 shrink-0 ${isActive ? 'bg-purple-600 border-purple-400 text-white font-black scale-110 shadow-lg' : 'bg-white border-slate-200 text-slate-400 font-bold hover:bg-slate-50'}`}>
        <span className="text-[8px] uppercase">{label}</span>
    </button>
);

const DeleteConfirmModal: React.FC<{ user: UserProfile; pt: (k: string) => string; onCancel: () => void; onConfirm: () => void; isDeleting: boolean }> = ({ user, pt, onCancel, onConfirm, isDeleting }) => {
    const [emailInput, setEmailInput] = useState('');
    const [countdown, setCountdown] = useState(5);
    const [countdownDone, setCountdownDone] = useState(false);

    useEffect(() => {
        if (countdown <= 0) { setCountdownDone(true); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    // Perfil anónimo: no hay email que escribir para confirmar, así que se pide la
    // palabra fija DELETE/ELIMINAR en su lugar (según idioma, para que instrucción y
    // palabra a escribir coincidan).
    const deleteWord = pt('deleteWordConfirm');
    const confirmTarget = user.email ? user.email.trim().toLowerCase() : deleteWord;
    const emailMatches = emailInput.trim().toLowerCase() === confirmTarget;
    const canDelete = emailMatches && countdownDone && !isDeleting;

    return (
        <div className="fixed inset-0 z-[999999] flex justify-center p-6 overflow-y-auto no-scrollbar bg-black/90 backdrop-blur-md" style={{ zIndex: 999999 }}>
            <div className="w-full max-w-[340px] my-auto shrink-0 h-fit bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl shadow-red-500/20">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mb-4">
                    <i className="fas fa-skull text-2xl text-red-500"></i>
                </div>
                <h3 className="text-white font-black text-base uppercase tracking-widest mb-3">{pt('deleteConfirmTitle')}</h3>
                <p className="text-slate-400 text-xs mb-5 leading-relaxed">{pt('deleteConfirmText')}</p>
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-2 w-full text-left">
                    {user.email ? pt('deleteConfirmInstruction') : pt('deleteConfirmInstructionNoEmail')}
                </p>
                <input type={user.email ? 'email' : 'text'} value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder={user.email || deleteWord.toUpperCase()}
                    className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-xs mb-1 focus:outline-none focus:border-red-500 transition-colors"
                    disabled={isDeleting} autoComplete="off" />
                {emailInput.length > 0 && !emailMatches && (
                    <p className="text-red-400 text-[9px] font-bold mb-3 w-full text-left">{pt('deleteEmailMismatch')}</p>
                )}
                {emailInput.length === 0 && <div className="mb-3"></div>}
                <div className="w-full flex gap-3 mt-2">
                    <button onClick={onCancel} disabled={isDeleting} className="flex-1 py-3 bg-white/5 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-colors">
                        {pt('deleteConfirmCancel')}
                    </button>
                    <button onClick={canDelete ? onConfirm : undefined} disabled={!canDelete}
                        className={`flex-[2] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${canDelete ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                        {isDeleting ? pt('deleting') : !countdownDone ? pt('deleteCountdown').replace('{n}', String(countdown)) : pt('deleteConfirmYes')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const isIOS = Capacitor.getPlatform() === 'ios';

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin, language, onLangChange }) => {
  const { handleLinkApple, handleLinkGoogle } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { cityName, badgeId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
      firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || 'traveler',
      city: user.city || '', country: user.country || '', avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01', language: user.language || 'es', gender: user.gender || 'unspecified'
  });

  useEffect(() => {
    setFormData({
      firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || 'traveler',
      city: user.city || '', country: user.country || '', avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01', language: user.language || 'es', gender: user.gender || 'unspecified'
    });
  }, [user]);

  const [showBragModal, setShowBragModal] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<{badge: Badge, isEarned: boolean} | null>(null);
  const [selectedVisa, setSelectedVisa] = useState<VisaStamp | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReportBug, setShowReportBug] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cacheSize, setCacheSize] = useState(() => tourCacheService.getCacheSize());
  const [isClearing, setIsClearing] = useState(false);

  // ✅ Sincronizar sub-rutas (visa/badge) con el estado interno
  useEffect(() => {
    if (cityName) {
      const stamp = user.stamps.find(s => s.city.toLowerCase() === cityName.toLowerCase());
      if (stamp) setSelectedVisa(stamp);
      else navigate('/profile', { replace: true });
    } else {
      setSelectedVisa(null);
    }
  }, [cityName, user.stamps, navigate]);

  useEffect(() => {
    if (badgeId) {
      const b = APP_BADGES.find(ab => ab.id === badgeId);
      if (b) {
        const isEarned = user.badges?.some(ub => ub.id === b.id);
        setSelectedBadge({ badge: b, isEarned: !!isEarned });
      } else {
        navigate('/profile', { replace: true });
      }
    } else {
      setSelectedBadge(null);
    }
  }, [badgeId, user.badges, navigate]);

  // Manejadores mejorados para navegación
  const closeVisa = () => navigate('/profile');
  const closeBadge = () => navigate('/profile');
  const openVisa = (s: VisaStamp) => navigate(`/profile/visa/${s.city.toLowerCase()}`);
  const openBadge = (bId: string) => navigate(`/profile/badge/${bId}`);

  const pt = (key: string) => {
    const lang = user.language || 'es';
    const dict = MODAL_TEXTS[lang] || MODAL_TEXTS['en'];
    const globalDict = translations[lang] || translations['en'];
    
    const extra: Record<string, Record<string, string>> = {
        es: { locked: "BLOQUEADO", unlockReq: "Requisito:", milesReq: "Millas restantes:", confirmShare: "Compartir", cancel: "Cerrar", image: "Guardar Imagen", share: "Compartir Enlace", backToPassport: "Volver al Pasaporte", statusVerified: "Estado: Verificado", missionAccomplished: "MISIÓN CUMPLIDA", locationIdentity: "Identidad de Ubicación", protocolReward: "Recompensa", currentRank: "Rango Actual", digitalAuth: "Autenticación", verified: "VERIFICADO", totalDistance: "Distancia Total", minting: "GENERANDO...", transmitting: "TRANSMITIENDO...", readyToShare: "LISTO PARA COMPARTIR", anonBannerTitle: "Progreso guardado solo en este dispositivo", anonBannerText: "Tus millas, insignias y ciudades visitadas viven únicamente en este móvil. Si desinstalas la app o cambias de dispositivo, se perderán para siempre. Vincula tu cuenta para guardarlas de forma segura.", linkApple: "Vincular con Apple", linkGoogle: "Vincular con Google", gender: "Sexo", male: "Hombre", female: "Mujer", unspecified: "Prefiero no decirlo", linkCopied: "🚀 ENLACE ÉPICO COPIADO AL PORTAPAPELES", mintingVisa: "🎨 GENERANDO VISADO...", visaSaved: "📸 ¡Visado guardado en Fotos! Abre Instagram o TikTok para compartirlo. ✨", badgeSaved: "📸 ¡Insignia guardada en Fotos! Abre Instagram o TikTok para compartirla. ✨", badgeDownloaded: "📸 ¡Insignia descargada! Compártela en tus redes. ✨", errorGenerating: "Error al generar la imagen", rankBadge: "Insignia de Rango", achievementBadge: "Logro", currentStatus: "Estado Actual", usernameLockConfirm: "Tu nombre de usuario quedará fijado como @{username} y no podrás cambiarlo después. ¿Continuar?", deleteSuccessToast: "Cuenta eliminada correctamente.", deleteErrorToast: "No se pudo eliminar la cuenta. Reintenta.", usernameLockWarning: "Solo se puede elegir una vez, no se podrá cambiar después." },
        en: { locked: "LOCKED", unlockReq: "Requirement:", milesReq: "Miles remaining:", confirmShare: "Share", cancel: "Close", image: "Save Image", share: "Share Link", backToPassport: "Back to Passport", statusVerified: "Status: Verified", missionAccomplished: "MISSION ACCOMPLISHED", locationIdentity: "Location Identity", protocolReward: "Protocol Reward", currentRank: "Current Rank", digitalAuth: "Autenticación", verified: "VERIFIED", totalDistance: "Total Distance", minting: "MINTING...", transmitting: "TRANSMITTING...", readyToShare: "READY TO SHARE", anonBannerTitle: "Progress saved only on this device", anonBannerText: "Your miles, badges and visited cities live only on this phone. If you uninstall the app or switch devices, they will be lost forever. Link your account to keep them safe.", linkApple: "Link with Apple", linkGoogle: "Link with Google", gender: "Gender", male: "Male", female: "Female", unspecified: "Prefer not to say", linkCopied: "🚀 EPIC LINK COPIED TO CLIPBOARD", mintingVisa: "🎨 MINTING VISA...", visaSaved: "📸 Visa saved to Photos! Open Instagram or TikTok to share it. ✨", badgeSaved: "📸 Badge saved to Photos! Open Instagram or TikTok to share it. ✨", badgeDownloaded: "📸 Badge downloaded! Share it on your socials. ✨", errorGenerating: "Error generating image", rankBadge: "Rank Badge", achievementBadge: "Achievement", currentStatus: "Current Status", usernameLockConfirm: "Your username will be set to @{username} and cannot be changed afterwards. Continue?", deleteSuccessToast: "Account deleted successfully.", deleteErrorToast: "Could not delete the account. Try again.", usernameLockWarning: "You can only set this once — it cannot be changed afterwards." },
        fr: { locked: "VERROUILLÉ", unlockReq: "Exigence :", milesReq: "Miles restants :", confirmShare: "Partager", cancel: "Fermer", image: "Enregistrer l'image", share: "Partager le lien", backToPassport: "Retour au passeport", statusVerified: "Statut : Vérifié", missionAccomplished: "MISSION ACCOMPLIE", locationIdentity: "Identité du lieu", protocolReward: "Récompense", currentRank: "Rang actuel", digitalAuth: "Authentification", verified: "VÉRIFIÉ", totalDistance: "Distance totale", minting: "CRÉATION...", transmitting: "TRANSMISSION...", readyToShare: "PRÊT À PARTAGER", anonBannerTitle: "Progression enregistrée uniquement sur cet appareil", anonBannerText: "Tes miles, badges et villes visitées ne vivent que sur ce téléphone. Si tu désinstalles l'application ou changes d'appareil, ils seront perdus à jamais. Lie ton compte pour les conserver en sécurité.", linkApple: "Lier avec Apple", linkGoogle: "Lier avec Google", gender: "Genre", male: "Homme", female: "Femme", unspecified: "Je préfère ne pas dire", linkCopied: "🚀 LIEN ÉPIQUE COPIÉ DANS LE PRESSE-PAPIERS", mintingVisa: "🎨 CRÉATION DU VISA...", visaSaved: "📸 Visa enregistré dans les Photos ! Ouvre Instagram ou TikTok pour le partager. ✨", badgeSaved: "📸 Badge enregistré dans les Photos ! Ouvre Instagram ou TikTok pour le partager. ✨", badgeDownloaded: "📸 Badge téléchargé ! Partage-le sur tes réseaux. ✨", errorGenerating: "Erreur lors de la génération de l'image", rankBadge: "Badge de rang", achievementBadge: "Succès", currentStatus: "Statut actuel", usernameLockConfirm: "Ton nom d'utilisateur sera fixé à @{username} et ne pourra plus être modifié ensuite. Continuer ?", deleteSuccessToast: "Compte supprimé avec succès.", deleteErrorToast: "Impossible de supprimer le compte. Réessayez.", usernameLockWarning: "Tu ne peux le choisir qu'une seule fois, il ne pourra pas être modifié ensuite." },
        de: { locked: "GESPERRT", unlockReq: "Anforderung:", milesReq: "Verbleibende Meilen:", confirmShare: "Teilen", cancel: "Schließen", image: "Bild speichern", share: "Link teilen", backToPassport: "Zurück zum Pass", statusVerified: "Status: Verifiziert", missionAccomplished: "MISSION ERFÜLLT", locationIdentity: "Standort-Identität", protocolReward: "Belohnung", currentRank: "Aktueller Rang", digitalAuth: "Authentifizierung", verified: "VERIFIZIERT", totalDistance: "Gesamtdistanz", minting: "WIRD ERSTELLT...", transmitting: "ÜBERTRAGUNG...", readyToShare: "BEREIT ZUM TEILEN", anonBannerTitle: "Fortschritt wird nur auf diesem Gerät gespeichert", anonBannerText: "Deine Meilen, Abzeichen und besuchten Städte existieren nur auf diesem Handy. Wenn du die App deinstallierst oder das Gerät wechselst, gehen sie für immer verloren. Verknüpfe dein Konto, um sie sicher zu speichern.", linkApple: "Mit Apple verknüpfen", linkGoogle: "Mit Google verknüpfen", gender: "Geschlecht", male: "Männlich", female: "Weiblich", unspecified: "Keine Angabe", linkCopied: "🚀 EPISCHER LINK IN DIE ZWISCHENABLAGE KOPIERT", mintingVisa: "🎨 VISUM WIRD ERSTELLT...", visaSaved: "📸 Visum in Fotos gespeichert! Öffne Instagram oder TikTok zum Teilen. ✨", badgeSaved: "📸 Abzeichen in Fotos gespeichert! Öffne Instagram oder TikTok zum Teilen. ✨", badgeDownloaded: "📸 Abzeichen heruntergeladen! Teile es in deinen sozialen Netzwerken. ✨", errorGenerating: "Fehler beim Erstellen des Bildes", rankBadge: "Rang-Abzeichen", achievementBadge: "Erfolg", currentStatus: "Aktueller Status", usernameLockConfirm: "Dein Benutzername wird auf @{username} festgelegt und kann danach nicht mehr geändert werden. Fortfahren?", deleteSuccessToast: "Konto erfolgreich gelöscht.", deleteErrorToast: "Konto konnte nicht gelöscht werden. Versuche es erneut.", usernameLockWarning: "Du kannst dies nur einmal festlegen — danach kann es nicht mehr geändert werden." },
        it: { locked: "BLOCCATO", unlockReq: "Requisito:", milesReq: "Miglia rimanenti:", confirmShare: "Condividi", cancel: "Chiudi", image: "Salva Immagine", share: "Condividi Link", backToPassport: "Torna al Passaporto", statusVerified: "Stato: Verificato", missionAccomplished: "MISSIONE COMPIUTA", locationIdentity: "Identità del Luogo", protocolReward: "Ricompensa", currentRank: "Grado Attuale", digitalAuth: "Autenticazione", verified: "VERIFICATO", totalDistance: "Distanza Totale", minting: "CREAZIONE...", transmitting: "TRASMISSIONE...", readyToShare: "PRONTO PER CONDIVIDERE", anonBannerTitle: "Progresso salvato solo su questo dispositivo", anonBannerText: "Le tue miglia, distintivi e città visitate vivono solo su questo telefono. Se disinstalli l'app o cambi dispositivo, andranno perse per sempre. Collega il tuo account per conservarle in sicurezza.", linkApple: "Collega con Apple", linkGoogle: "Collega con Google", gender: "Genere", male: "Uomo", female: "Donna", unspecified: "Preferisco non dirlo", linkCopied: "🚀 LINK EPICO COPIATO NEGLI APPUNTI", mintingVisa: "🎨 CREAZIONE VISTO...", visaSaved: "📸 Visto salvato nelle Foto! Apri Instagram o TikTok per condividerlo. ✨", badgeSaved: "📸 Distintivo salvato nelle Foto! Apri Instagram o TikTok per condividerlo. ✨", badgeDownloaded: "📸 Distintivo scaricato! Condividilo sui tuoi social. ✨", errorGenerating: "Errore nella generazione dell'immagine", rankBadge: "Distintivo di Grado", achievementBadge: "Obiettivo", currentStatus: "Stato Attuale", usernameLockConfirm: "Il tuo nome utente sarà impostato su @{username} e non potrà essere modificato in seguito. Continuare?", deleteSuccessToast: "Account eliminato correttamente.", deleteErrorToast: "Impossibile eliminare l'account. Riprova.", usernameLockWarning: "Puoi sceglierlo solo una volta, non potrà essere modificato in seguito." },
        pt: { locked: "BLOQUEADO", unlockReq: "Requisito:", milesReq: "Milhas restantes:", confirmShare: "Compartilhar", cancel: "Fechar", image: "Salvar Imagem", share: "Compartilhar Link", backToPassport: "Voltar ao Passaporte", statusVerified: "Status: Verificado", missionAccomplished: "MISSÃO CUMPRIDA", locationIdentity: "Identidade da Localização", protocolReward: "Recompensa", currentRank: "Ranking Atual", digitalAuth: "Autenticação", verified: "VERIFICADO", totalDistance: "Distância Total", minting: "GERANDO...", transmitting: "TRANSMITINDO...", readyToShare: "PRONTO PARA COMPARTILHAR", anonBannerTitle: "Progresso salvo apenas neste dispositivo", anonBannerText: "Suas milhas, insígnias e cidades visitadas vivem apenas neste celular. Se você desinstalar o app ou trocar de dispositivo, elas serão perdidas para sempre. Vincule sua conta para mantê-las seguras.", linkApple: "Vincular com Apple", linkGoogle: "Vincular com Google", gender: "Gênero", male: "Masculino", female: "Feminino", unspecified: "Prefiro não dizer", linkCopied: "🚀 LINK ÉPICO COPIADO PARA A ÁREA DE TRANSFERÊNCIA", mintingVisa: "🎨 GERANDO VISTO...", visaSaved: "📸 Visto salvo nas Fotos! Abra o Instagram ou TikTok para compartilhar. ✨", badgeSaved: "📸 Insígnia salva nas Fotos! Abra o Instagram ou TikTok para compartilhar. ✨", badgeDownloaded: "📸 Insígnia baixada! Compartilhe nas suas redes. ✨", errorGenerating: "Erro ao gerar a imagem", rankBadge: "Insígnia de Ranking", achievementBadge: "Conquista", currentStatus: "Status Atual", usernameLockConfirm: "Seu nome de usuário será definido como @{username} e não poderá ser alterado depois. Continuar?", deleteSuccessToast: "Conta eliminada com sucesso.", deleteErrorToast: "Não foi possível eliminar a conta. Tente novamente.", usernameLockWarning: "Só pode ser escolhido uma vez, não poderá ser alterado depois." },
        ro: { locked: "BLOCAT", unlockReq: "Cerință:", milesReq: "Mile rămase:", confirmShare: "Distribuie", cancel: "Închide", image: "Salvează Imaginea", share: "Distribuie Linkul", backToPassport: "Înapoi la Pașaport", statusVerified: "Stare: Verificat", missionAccomplished: "MISIUNE ÎNDEPLINITĂ", locationIdentity: "Identitatea Locației", protocolReward: "Recompensă", currentRank: "Rang Actual", digitalAuth: "Autentificare", verified: "VERIFICAT", totalDistance: "Distanță Totală", minting: "SE CREEAZĂ...", transmitting: "SE TRANSMITE...", readyToShare: "GATA DE DISTRIBUIRE", anonBannerTitle: "Progresul este salvat doar pe acest dispozitiv", anonBannerText: "Milele, insignele și orașele vizitate există doar pe acest telefon. Dacă dezinstalezi aplicația sau schimbi dispozitivul, se vor pierde pentru totdeauna. Conectează-ți contul pentru a le păstra în siguranță.", linkApple: "Conectează cu Apple", linkGoogle: "Conectează cu Google", gender: "Gen", male: "Bărbat", female: "Femeie", unspecified: "Prefer să nu spun", linkCopied: "🚀 LINK EPIC COPIAT ÎN CLIPBOARD", mintingVisa: "🎨 SE CREEAZĂ VIZA...", visaSaved: "📸 Vizavi salvată în Poze! Deschide Instagram sau TikTok pentru a o distribui. ✨", badgeSaved: "📸 Insignă salvată în Poze! Deschide Instagram sau TikTok pentru a o distribui. ✨", badgeDownloaded: "📸 Insignă descărcată! Distribuie-o pe rețelele tale. ✨", errorGenerating: "Eroare la generarea imaginii", rankBadge: "Insignă de Rang", achievementBadge: "Realizare", currentStatus: "Stare Actuală", usernameLockConfirm: "Numele tău de utilizator va fi setat la @{username} și nu va putea fi schimbat ulterior. Continui?", deleteSuccessToast: "Cont șters cu succes.", deleteErrorToast: "Contul nu a putut fi șters. Încearcă din nou.", usernameLockWarning: "Poate fi ales o singură dată, nu va putea fi schimbat ulterior." },
        zh: { locked: "已锁定", unlockReq: "要求：", milesReq: "剩余里程：", confirmShare: "分享", cancel: "关闭", image: "保存图片", share: "分享链接", backToPassport: "返回护照", statusVerified: "状态：已验证", missionAccomplished: "任务完成", locationIdentity: "位置身份", protocolReward: "奖励", currentRank: "当前等级", digitalAuth: "身份验证", verified: "已验证", totalDistance: "总距离", minting: "生成中...", transmitting: "传输中...", readyToShare: "准备分享", anonBannerTitle: "进度仅保存在此设备上", anonBannerText: "您的里程、徽章和已访问城市仅保存在此手机上。如果卸载应用或更换设备，这些数据将永久丢失。绑定账号以安全保存它们。", linkApple: "绑定 Apple", linkGoogle: "绑定 Google", gender: "性别", male: "男", female: "女", unspecified: "不愿透露", linkCopied: "🚀 史诗链接已复制到剪贴板", mintingVisa: "🎨 正在生成签证...", visaSaved: "📸 签证已保存到相册！打开 Instagram 或 TikTok 分享吧。✨", badgeSaved: "📸 徽章已保存到相册！打开 Instagram 或 TikTok 分享吧。✨", badgeDownloaded: "📸 徽章已下载！在社交媒体上分享吧。✨", errorGenerating: "生成图片时出错", rankBadge: "等级徽章", achievementBadge: "成就", currentStatus: "当前状态", usernameLockConfirm: "您的用户名将设置为 @{username}，之后无法更改。是否继续？", deleteSuccessToast: "账户已成功删除。", deleteErrorToast: "无法删除账户。请重试。", usernameLockWarning: "只能设置一次，之后将无法更改。" },
        ja: { locked: "ロック済み", unlockReq: "要件：", milesReq: "残りマイル：", confirmShare: "共有", cancel: "閉じる", image: "画像を保存", share: "リンクを共有", backToPassport: "パスポートに戻る", statusVerified: "ステータス：認証済み", missionAccomplished: "ミッション達成", locationIdentity: "位置情報", protocolReward: "報酬", currentRank: "現在のランク", digitalAuth: "認証", verified: "認証済み", totalDistance: "総距離", minting: "生成中...", transmitting: "送信中...", readyToShare: "共有準備完了", anonBannerTitle: "進捗はこの端末にのみ保存されます", anonBannerText: "獲得したマイル、バッジ、訪問した都市はこの端末にのみ保存されます。アプリをアンインストールしたり端末を変更したりすると、永久に失われます。アカウントを連携して安全に保存しましょう。", linkApple: "Appleと連携", linkGoogle: "Googleと連携", gender: "性別", male: "男性", female: "女性", unspecified: "回答しない", linkCopied: "🚀 エピックリンクをクリップボードにコピーしました", mintingVisa: "🎨 ビザを生成中...", visaSaved: "📸 ビザを写真に保存しました！InstagramやTikTokで共有しよう。✨", badgeSaved: "📸 バッジを写真に保存しました！InstagramやTikTokで共有しよう。✨", badgeDownloaded: "📸 バッジをダウンロードしました！SNSでシェアしよう。✨", errorGenerating: "画像の生成中にエラーが発生しました", rankBadge: "ランクバッジ", achievementBadge: "実績", currentStatus: "現在のステータス", usernameLockConfirm: "ユーザー名は @{username} に設定され、後で変更することはできません。続行しますか？", deleteSuccessToast: "アカウントを削除しました。", deleteErrorToast: "アカウントを削除できませんでした。もう一度お試しください。", usernameLockWarning: "これは一度だけ設定でき、その後変更することはできません。" },
        ru: { locked: "ЗАБЛОКИРОВАНО", unlockReq: "Требование:", milesReq: "Оставшиеся мили:", confirmShare: "Поделиться", cancel: "Закрыть", image: "Сохранить изображение", share: "Поделиться ссылкой", backToPassport: "Назад к паспорту", statusVerified: "Статус: Подтверждено", missionAccomplished: "МИССИЯ ВЫПОЛНЕНА", locationIdentity: "Идентификация места", protocolReward: "Награда", currentRank: "Текущий ранг", digitalAuth: "Аутентификация", verified: "ПОДТВЕРЖДЕНО", totalDistance: "Общее расстояние", minting: "СОЗДАНИЕ...", transmitting: "ПЕРЕДАЧА...", readyToShare: "ГОТОВО К ОТПРАВКЕ", anonBannerTitle: "Прогресс сохраняется только на этом устройстве", anonBannerText: "Ваши мили, значки и посещённые города хранятся только на этом телефоне. Если вы удалите приложение или смените устройство, они будут потеряны навсегда. Привяжите аккаунт, чтобы сохранить их надёжно.", linkApple: "Привязать Apple", linkGoogle: "Привязать Google", gender: "Пол", male: "Мужской", female: "Женский", unspecified: "Предпочитаю не указывать", linkCopied: "🚀 ЭПИЧЕСКАЯ ССЫЛКА СКОПИРОВАНА В БУФЕР ОБМЕНА", mintingVisa: "🎨 СОЗДАНИЕ ВИЗЫ...", visaSaved: "📸 Виза сохранена в Фото! Откройте Instagram или TikTok, чтобы поделиться. ✨", badgeSaved: "📸 Значок сохранён в Фото! Откройте Instagram или TikTok, чтобы поделиться. ✨", badgeDownloaded: "📸 Значок скачан! Поделитесь им в соцсетях. ✨", errorGenerating: "Ошибка при создании изображения", rankBadge: "Значок ранга", achievementBadge: "Достижение", currentStatus: "Текущий статус", usernameLockConfirm: "Ваше имя пользователя будет установлено как @{username} и не сможет быть изменено позже. Продолжить?", deleteSuccessToast: "Аккаунт успешно удалён.", deleteErrorToast: "Не удалось удалить аккаунт. Попробуйте снова.", usernameLockWarning: "Это можно выбрать только один раз, изменить позже будет нельзя." },
        ar: { locked: "مغلق", unlockReq: "المتطلبات:", milesReq: "الأميال المتبقية:", confirmShare: "مشاركة", cancel: "إغلاق", image: "حفظ الصورة", share: "مشاركة الرابط", backToPassport: "العودة إلى جواز السفر", statusVerified: "الحالة: موثّق", missionAccomplished: "تمت المهمة", locationIdentity: "هوية الموقع", protocolReward: "المكافأة", currentRank: "الرتبة الحالية", digitalAuth: "التوثيق", verified: "موثّق", totalDistance: "المسافة الإجمالية", minting: "جارٍ الإنشاء...", transmitting: "جارٍ الإرسال...", readyToShare: "جاهز للمشاركة", anonBannerTitle: "يُحفظ تقدمك على هذا الجهاز فقط", anonBannerText: "أميالك وأوسمتك والمدن التي زرتها تعيش فقط على هذا الهاتف. إذا قمت بإلغاء تثبيت التطبيق أو تغيير الجهاز، ستفقدها إلى الأبد. اربط حسابك للحفاظ عليها بأمان.", linkApple: "ربط مع Apple", linkGoogle: "ربط مع Google", gender: "الجنس", male: "ذكر", female: "أنثى", unspecified: "أفضل عدم الإفصاح", linkCopied: "🚀 تم نسخ الرابط الملحمي إلى الحافظة", mintingVisa: "🎨 جارٍ إنشاء التأشيرة...", visaSaved: "📸 تم حفظ التأشيرة في الصور! افتح Instagram أو TikTok لمشاركتها. ✨", badgeSaved: "📸 تم حفظ الوسام في الصور! افتح Instagram أو TikTok لمشاركته. ✨", badgeDownloaded: "📸 تم تنزيل الوسام! شاركه على شبكاتك الاجتماعية. ✨", errorGenerating: "خطأ في إنشاء الصورة", rankBadge: "وسام الرتبة", achievementBadge: "إنجاز", currentStatus: "الحالة الحالية", usernameLockConfirm: "سيتم تعيين اسم المستخدم الخاص بك كـ @{username} ولن تتمكن من تغييره لاحقًا. هل تريد المتابعة؟", deleteSuccessToast: "تم حذف الحساب بنجاح.", deleteErrorToast: "تعذر حذف الحساب. حاول مرة أخرى.", usernameLockWarning: "يمكن اختيار هذا مرة واحدة فقط، ولن يمكن تغييره لاحقًا." },
        hi: { locked: "लॉक किया गया", unlockReq: "आवश्यकता:", milesReq: "शेष मील:", confirmShare: "साझा करें", cancel: "बंद करें", image: "छवि सहेजें", share: "लिंक साझा करें", backToPassport: "पासपोर्ट पर वापस जाएं", statusVerified: "स्थिति: सत्यापित", missionAccomplished: "मिशन पूरा हुआ", locationIdentity: "स्थान पहचान", protocolReward: "इनाम", currentRank: "वर्तमान रैंक", digitalAuth: "प्रमाणीकरण", verified: "सत्यापित", totalDistance: "कुल दूरी", minting: "बनाया जा रहा है...", transmitting: "भेजा जा रहा है...", readyToShare: "साझा करने के लिए तैयार", anonBannerTitle: "प्रगति केवल इसी डिवाइस पर सहेजी जाएगी", anonBannerText: "आपकी मील, बैज और देखे गए शहर केवल इसी फ़ोन में रहेंगे। ऐप अनइंस्टॉल करने या डिवाइस बदलने पर ये हमेशा के लिए खो जाएंगे। इन्हें सुरक्षित रखने के लिए अपना खाता लिंक करें।", linkApple: "Apple से लिंक करें", linkGoogle: "Google से लिंक करें", gender: "लिंग", male: "पुरुष", female: "महिला", unspecified: "बताना नहीं चाहते", linkCopied: "🚀 महाकाव्य लिंक क्लिपबोर्ड पर कॉपी हो गया", mintingVisa: "🎨 वीज़ा बनाया जा रहा है...", visaSaved: "📸 वीज़ा फ़ोटो में सहेजा गया! इसे साझा करने के लिए Instagram या TikTok खोलें। ✨", badgeSaved: "📸 बैज फ़ोटो में सहेजा गया! इसे साझा करने के लिए Instagram या TikTok खोलें। ✨", badgeDownloaded: "📸 बैज डाउनलोड हो गया! इसे अपने सोशल पर साझा करें। ✨", errorGenerating: "छवि बनाने में त्रुटि", rankBadge: "रैंक बैज", achievementBadge: "उपलब्धि", currentStatus: "वर्तमान स्थिति", usernameLockConfirm: "आपका उपयोगकर्ता नाम @{username} पर सेट हो जाएगा और बाद में इसे बदला नहीं जा सकेगा। जारी रखें?", deleteSuccessToast: "खाता सफलतापूर्वक हटा दिया गया।", deleteErrorToast: "खाता हटाया नहीं जा सका। पुनः प्रयास करें।", usernameLockWarning: "इसे केवल एक बार चुना जा सकता है, बाद में बदला नहीं जा सकेगा।" },
        ko: { locked: "잠김", unlockReq: "요구 사항:", milesReq: "남은 마일:", confirmShare: "공유", cancel: "닫기", image: "이미지 저장", share: "링크 공유", backToPassport: "여권으로 돌아가기", statusVerified: "상태: 인증됨", missionAccomplished: "미션 완료", locationIdentity: "위치 정보", protocolReward: "보상", currentRank: "현재 등급", digitalAuth: "인증", verified: "인증됨", totalDistance: "총 거리", minting: "생성 중...", transmitting: "전송 중...", readyToShare: "공유 준비 완료", anonBannerTitle: "진행 상황은 이 기기에만 저장됩니다", anonBannerText: "획득한 마일, 배지, 방문한 도시는 이 휴대폰에만 저장됩니다. 앱을 삭제하거나 기기를 변경하면 영구적으로 사라집니다. 계정을 연결하여 안전하게 보관하세요.", linkApple: "Apple과 연결", linkGoogle: "Google과 연결", gender: "성별", male: "남성", female: "여성", unspecified: "밝히지 않음", linkCopied: "🚀 에픽 링크가 클립보드에 복사되었습니다", mintingVisa: "🎨 비자 생성 중...", visaSaved: "📸 비자가 사진에 저장되었습니다! Instagram이나 TikTok에서 공유해보세요. ✨", badgeSaved: "📸 배지가 사진에 저장되었습니다! Instagram이나 TikTok에서 공유해보세요. ✨", badgeDownloaded: "📸 배지가 다운로드되었습니다! SNS에서 공유해보세요. ✨", errorGenerating: "이미지 생성 중 오류가 발생했습니다", rankBadge: "등급 배지", achievementBadge: "업적", currentStatus: "현재 상태", usernameLockConfirm: "사용자 이름이 @{username}(으)로 설정되며 이후에는 변경할 수 없습니다. 계속하시겠습니까?", deleteSuccessToast: "계정이 성공적으로 삭제되었습니다.", deleteErrorToast: "계정을 삭제할 수 없습니다. 다시 시도하세요.", usernameLockWarning: "이것은 한 번만 설정할 수 있으며 이후에는 변경할 수 없습니다." },
        tr: { locked: "KİLİTLİ", unlockReq: "Gereksinim:", milesReq: "Kalan miller:", confirmShare: "Paylaş", cancel: "Kapat", image: "Görseli Kaydet", share: "Bağlantıyı Paylaş", backToPassport: "Pasaporta Dön", statusVerified: "Durum: Doğrulandı", missionAccomplished: "GÖREV TAMAMLANDI", locationIdentity: "Konum Kimliği", protocolReward: "Ödül", currentRank: "Mevcut Rütbe", digitalAuth: "Kimlik Doğrulama", verified: "DOĞRULANDI", totalDistance: "Toplam Mesafe", minting: "OLUŞTURULUYOR...", transmitting: "GÖNDERİLİYOR...", readyToShare: "PAYLAŞIMA HAZIR", anonBannerTitle: "İlerlemen yalnızca bu cihazda kaydedilir", anonBannerText: "Millerin, rozetlerin ve ziyaret ettiğin şehirler yalnızca bu telefonda saklanır. Uygulamayı kaldırır veya cihaz değiştirirsen sonsuza dek kaybolurlar. Güvende tutmak için hesabını bağla.", linkApple: "Apple ile Bağla", linkGoogle: "Google ile Bağla", gender: "Cinsiyet", male: "Erkek", female: "Kadın", unspecified: "Belirtmek istemiyorum", linkCopied: "🚀 EFSANE BAĞLANTI PANOYA KOPYALANDI", mintingVisa: "🎨 VİZE OLUŞTURULUYOR...", visaSaved: "📸 Vize Fotoğraflar'a kaydedildi! Paylaşmak için Instagram veya TikTok'u aç. ✨", badgeSaved: "📸 Rozet Fotoğraflar'a kaydedildi! Paylaşmak için Instagram veya TikTok'u aç. ✨", badgeDownloaded: "📸 Rozet indirildi! Sosyal medyanda paylaş. ✨", errorGenerating: "Görsel oluşturulurken hata oluştu", rankBadge: "Rütbe Rozeti", achievementBadge: "Başarı", currentStatus: "Mevcut Durum", usernameLockConfirm: "Kullanıcı adın @{username} olarak ayarlanacak ve daha sonra değiştirilemeyecek. Devam edilsin mi?", deleteSuccessToast: "Hesap başarıyla silindi.", deleteErrorToast: "Hesap silinemedi. Tekrar deneyin.", usernameLockWarning: "Bu yalnızca bir kez seçilebilir, sonradan değiştirilemez." },
        pl: { locked: "ZABLOKOWANE", unlockReq: "Wymaganie:", milesReq: "Pozostałe mile:", confirmShare: "Udostępnij", cancel: "Zamknij", image: "Zapisz Obraz", share: "Udostępnij Link", backToPassport: "Powrót do Paszportu", statusVerified: "Status: Zweryfikowano", missionAccomplished: "MISJA WYKONANA", locationIdentity: "Tożsamość Lokalizacji", protocolReward: "Nagroda", currentRank: "Aktualna Ranga", digitalAuth: "Uwierzytelnianie", verified: "ZWERYFIKOWANO", totalDistance: "Całkowity Dystans", minting: "TWORZENIE...", transmitting: "WYSYŁANIE...", readyToShare: "GOTOWE DO UDOSTĘPNIENIA", anonBannerTitle: "Postęp jest zapisywany tylko na tym urządzeniu", anonBannerText: "Twoje mile, odznaki i odwiedzone miasta istnieją tylko na tym telefonie. Jeśli odinstalujesz aplikację lub zmienisz urządzenie, zostaną utracone na zawsze. Połącz konto, aby zachować je bezpiecznie.", linkApple: "Połącz z Apple", linkGoogle: "Połącz z Google", gender: "Płeć", male: "Mężczyzna", female: "Kobieta", unspecified: "Wolę nie podawać", linkCopied: "🚀 EPICKI LINK SKOPIOWANY DO SCHOWKA", mintingVisa: "🎨 TWORZENIE WIZY...", visaSaved: "📸 Wiza zapisana w Zdjęciach! Otwórz Instagram lub TikTok, aby się nią podzielić. ✨", badgeSaved: "📸 Odznaka zapisana w Zdjęciach! Otwórz Instagram lub TikTok, aby się nią podzielić. ✨", badgeDownloaded: "📸 Odznaka pobrana! Udostępnij ją w swoich mediach społecznościowych. ✨", errorGenerating: "Błąd podczas generowania obrazu", rankBadge: "Odznaka Rangi", achievementBadge: "Osiągnięcie", currentStatus: "Aktualny Status", usernameLockConfirm: "Twoja nazwa użytkownika zostanie ustawiona na @{username} i nie będzie można jej później zmienić. Kontynuować?", deleteSuccessToast: "Konto zostało pomyślnie usunięte.", deleteErrorToast: "Nie udało się usunąć konta. Spróbuj ponownie.", usernameLockWarning: "Można to wybrać tylko raz, później nie będzie można tego zmienić." },
        nl: { locked: "VERGRENDELD", unlockReq: "Vereiste:", milesReq: "Resterende mijlen:", confirmShare: "Delen", cancel: "Sluiten", image: "Afbeelding Opslaan", share: "Link Delen", backToPassport: "Terug naar Paspoort", statusVerified: "Status: Geverifieerd", missionAccomplished: "MISSIE VOLBRACHT", locationIdentity: "Locatie-identiteit", protocolReward: "Beloning", currentRank: "Huidige Rang", digitalAuth: "Authenticatie", verified: "GEVERIFIEERD", totalDistance: "Totale Afstand", minting: "AANMAKEN...", transmitting: "VERZENDEN...", readyToShare: "KLAAR OM TE DELEN", anonBannerTitle: "Voortgang wordt alleen op dit apparaat opgeslagen", anonBannerText: "Je mijlen, badges en bezochte steden bestaan alleen op deze telefoon. Als je de app verwijdert of van apparaat wisselt, gaan ze voorgoed verloren. Koppel je account om ze veilig te bewaren.", linkApple: "Koppelen met Apple", linkGoogle: "Koppelen met Google", gender: "Geslacht", male: "Man", female: "Vrouw", unspecified: "Zeg ik liever niet", linkCopied: "🚀 EPISCHE LINK GEKOPIEERD NAAR KLEMBORD", mintingVisa: "🎨 VISUM WORDT AANGEMAAKT...", visaSaved: "📸 Visum opgeslagen in Foto's! Open Instagram of TikTok om te delen. ✨", badgeSaved: "📸 Badge opgeslagen in Foto's! Open Instagram of TikTok om te delen. ✨", badgeDownloaded: "📸 Badge gedownload! Deel hem op je sociale media. ✨", errorGenerating: "Fout bij het genereren van de afbeelding", rankBadge: "Rangbadge", achievementBadge: "Prestatie", currentStatus: "Huidige Status", usernameLockConfirm: "Je gebruikersnaam wordt ingesteld op @{username} en kan daarna niet meer worden gewijzigd. Doorgaan?", deleteSuccessToast: "Account succesvol verwijderd.", deleteErrorToast: "Account kon niet worden verwijderd. Probeer opnieuw.", usernameLockWarning: "Dit kan maar één keer worden ingesteld — het kan daarna niet meer worden gewijzigd." },
        ca: { locked: "BLOQUEJAT", unlockReq: "Requisit:", milesReq: "Milles restants:", confirmShare: "Comparteix", cancel: "Tanca", image: "Desa la Imatge", share: "Comparteix l'Enllaç", backToPassport: "Torna al Passaport", statusVerified: "Estat: Verificat", missionAccomplished: "MISSIÓ COMPLERTA", locationIdentity: "Identitat de la Ubicació", protocolReward: "Recompensa", currentRank: "Rang Actual", digitalAuth: "Autenticació", verified: "VERIFICAT", totalDistance: "Distància Total", minting: "CREANT...", transmitting: "TRANSMETENT...", readyToShare: "LLEST PER COMPARTIR", anonBannerTitle: "El progrés es desa només en aquest dispositiu", anonBannerText: "Les teves milles, insígnies i ciutats visitades viuen només en aquest mòbil. Si desinstal·les l'app o canvies de dispositiu, es perdran per sempre. Vincula el teu compte per mantenir-les segures.", linkApple: "Vincula amb Apple", linkGoogle: "Vincula amb Google", gender: "Gènere", male: "Home", female: "Dona", unspecified: "Prefereixo no dir-ho", linkCopied: "🚀 ENLLAÇ ÈPIC COPIAT AL PORTAPAPERS", mintingVisa: "🎨 CREANT EL VISAT...", visaSaved: "📸 Visat desat a Fotos! Obre Instagram o TikTok per compartir-lo. ✨", badgeSaved: "📸 Insígnia desada a Fotos! Obre Instagram o TikTok per compartir-la. ✨", badgeDownloaded: "📸 Insígnia descarregada! Comparteix-la a les teves xarxes. ✨", errorGenerating: "Error en generar la imatge", rankBadge: "Insígnia de Rang", achievementBadge: "Assoliment", currentStatus: "Estat Actual", usernameLockConfirm: "El teu nom d'usuari quedarà fixat com a @{username} i no podràs canviar-lo després. Continuar?", deleteSuccessToast: "Compte eliminat correctament.", deleteErrorToast: "No s'ha pogut eliminar el compte. Torna-ho a provar.", usernameLockWarning: "Només es pot triar una vegada, no es podrà canviar després." },
        eu: { locked: "BLOKEATUTA", unlockReq: "Baldintza:", milesReq: "Geratzen diren miliak:", confirmShare: "Partekatu", cancel: "Itxi", image: "Gorde Irudia", share: "Partekatu Esteka", backToPassport: "Itzuli Pasaportera", statusVerified: "Egoera: Egiaztatuta", missionAccomplished: "MISIOA BETE DA", locationIdentity: "Kokapenaren Identitatea", protocolReward: "Saria", currentRank: "Uneko Maila", digitalAuth: "Autentifikazioa", verified: "EGIAZTATUTA", totalDistance: "Distantzia Osoa", minting: "SORTZEN...", transmitting: "BIDALTZEN...", readyToShare: "PARTEKATZEKO PRÊT", anonBannerTitle: "Aurrerapena gailu honetan bakarrik gordeko da", anonBannerText: "Zure miliak, insigniak eta bisitatutako hiriak telefono honetan bakarrik daude. Aplikazioa desinstalatzen baduzu edo gailuz aldatzen baduzu, betiko galduko dira. Lotu zure kontua seguru mantentzeko.", linkApple: "Lotu Apple-rekin", linkGoogle: "Lotu Google-rekin", gender: "Generoa", male: "Gizona", female: "Emakumea", unspecified: "Nahiago dut ez esan", linkCopied: "🚀 ESTEKA EPIKOA ARBELEAN KOPIATU DA", mintingVisa: "🎨 BISATUA SORTZEN...", visaSaved: "📸 Bisatua Argazkietan gorde da! Ireki Instagram edo TikTok partekatzeko. ✨", badgeSaved: "📸 Insignia Argazkietan gorde da! Ireki Instagram edo TikTok partekatzeko. ✨", badgeDownloaded: "📸 Insignia deskargatu da! Partekatu zure sareetan. ✨", errorGenerating: "Errorea irudia sortzean", rankBadge: "Maila Insignia", achievementBadge: "Lorpena", currentStatus: "Uneko Egoera", usernameLockConfirm: "Zure erabiltzaile-izena @{username} gisa finkatuko da eta ezingo duzu geroago aldatu. Jarraitu?", deleteSuccessToast: "Kontua behar bezala ezabatu da.", deleteErrorToast: "Ezin izan da kontua ezabatu. Saiatu berriro.", usernameLockWarning: "Behin bakarrik hauta daiteke, ezingo da geroago aldatu." },
        vi: { locked: "ĐÃ KHÓA", unlockReq: "Yêu cầu:", milesReq: "Số dặm còn lại:", confirmShare: "Chia sẻ", cancel: "Đóng", image: "Lưu Hình Ảnh", share: "Chia Sẻ Liên Kết", backToPassport: "Quay Lại Hộ Chiếu", statusVerified: "Trạng thái: Đã xác minh", missionAccomplished: "NHIỆM VỤ HOÀN THÀNH", locationIdentity: "Danh Tính Địa Điểm", protocolReward: "Phần Thưởng", currentRank: "Cấp Bậc Hiện Tại", digitalAuth: "Xác Thực", verified: "ĐÃ XÁC MINH", totalDistance: "Tổng Quãng Đường", minting: "ĐANG TẠO...", transmitting: "ĐANG TRUYỀN...", readyToShare: "SẴN SÀNG CHIA SẺ", anonBannerTitle: "Tiến trình chỉ được lưu trên thiết bị này", anonBannerText: "Số dặm, huy hiệu và các thành phố bạn đã ghé thăm chỉ tồn tại trên điện thoại này. Nếu bạn gỡ cài đặt ứng dụng hoặc đổi thiết bị, chúng sẽ mất vĩnh viễn. Liên kết tài khoản để giữ chúng an toàn.", linkApple: "Liên kết với Apple", linkGoogle: "Liên kết với Google", gender: "Giới tính", male: "Nam", female: "Nữ", unspecified: "Không muốn tiết lộ", linkCopied: "🚀 ĐÃ SAO CHÉP LIÊN KẾT VÀO BỘ NHỚ TẠM", mintingVisa: "🎨 ĐANG TẠO VISA...", visaSaved: "📸 Visa đã lưu vào Ảnh! Mở Instagram hoặc TikTok để chia sẻ. ✨", badgeSaved: "📸 Huy hiệu đã lưu vào Ảnh! Mở Instagram hoặc TikTok để chia sẻ. ✨", badgeDownloaded: "📸 Huy hiệu đã tải xuống! Chia sẻ trên mạng xã hội của bạn. ✨", errorGenerating: "Lỗi khi tạo hình ảnh", rankBadge: "Huy Hiệu Cấp Bậc", achievementBadge: "Thành Tựu", currentStatus: "Trạng Thái Hiện Tại", usernameLockConfirm: "Tên người dùng của bạn sẽ được đặt thành @{username} và không thể thay đổi sau đó. Tiếp tục?", deleteSuccessToast: "Xóa tài khoản thành công.", deleteErrorToast: "Không thể xóa tài khoản. Vui lòng thử lại.", usernameLockWarning: "Chỉ có thể chọn một lần, không thể thay đổi sau đó." },
        th: { locked: "ล็อคแล้ว", unlockReq: "ข้อกำหนด:", milesReq: "ไมล์ที่เหลือ:", confirmShare: "แชร์", cancel: "ปิด", image: "บันทึกภาพ", share: "แชร์ลิงก์", backToPassport: "กลับไปที่พาสปอร์ต", statusVerified: "สถานะ: ยืนยันแล้ว", missionAccomplished: "ภารกิจสำเร็จ", locationIdentity: "ข้อมูลสถานที่", protocolReward: "รางวัล", currentRank: "อันดับปัจจุบัน", digitalAuth: "การยืนยันตัวตน", verified: "ยืนยันแล้ว", totalDistance: "ระยะทางรวม", minting: "กำลังสร้าง...", transmitting: "กำลังส่ง...", readyToShare: "พร้อมแชร์", anonBannerTitle: "ความคืบหน้าจะถูกบันทึกไว้บนอุปกรณ์นี้เท่านั้น", anonBannerText: "ไมล์ เหรียญตรา และเมืองที่คุณไปเยือนจะอยู่บนโทรศัพท์เครื่องนี้เท่านั้น หากคุณถอนการติดตั้งแอปหรือเปลี่ยนอุปกรณ์ ข้อมูลจะสูญหายอย่างถาวร เชื่อมบัญชีของคุณเพื่อเก็บรักษาไว้อย่างปลอดภัย", linkApple: "เชื่อมต่อกับ Apple", linkGoogle: "เชื่อมต่อกับ Google", gender: "เพศ", male: "ชาย", female: "หญิง", unspecified: "ไม่ระบุ", linkCopied: "🚀 คัดลอกลิงก์สุดพิเศษไปยังคลิปบอร์ดแล้ว", mintingVisa: "🎨 กำลังสร้างวีซ่า...", visaSaved: "📸 บันทึกวีซ่าลงในรูปภาพแล้ว! เปิด Instagram หรือ TikTok เพื่อแชร์ ✨", badgeSaved: "📸 บันทึกเหรียญตราลงในรูปภาพแล้ว! เปิด Instagram หรือ TikTok เพื่อแชร์ ✨", badgeDownloaded: "📸 ดาวน์โหลดเหรียญตราแล้ว! แชร์บนโซเชียลของคุณ ✨", errorGenerating: "เกิดข้อผิดพลาดในการสร้างภาพ", rankBadge: "เหรียญตราอันดับ", achievementBadge: "ความสำเร็จ", currentStatus: "สถานะปัจจุบัน", usernameLockConfirm: "ชื่อผู้ใช้ของคุณจะถูกตั้งเป็น @{username} และไม่สามารถเปลี่ยนแปลงได้ภายหลัง ดำเนินการต่อหรือไม่?", deleteSuccessToast: "ลบบัญชีสำเร็จแล้ว", deleteErrorToast: "ไม่สามารถลบบัญชีได้ กรุณาลองอีกครั้ง", usernameLockWarning: "เลือกได้เพียงครั้งเดียวเท่านั้น จะไม่สามารถเปลี่ยนแปลงได้ภายหลัง" }
    };
    const extraDict = extra[lang] || extra['en'];

    return dict[key] || globalDict[key] || extraDict[key] || key;
  };

  const isAdmin = user.email === 'travelbdai@gmail.com' || user.isAdmin;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          const b64 = reader.result as string;
          setFormData(prev => ({ ...prev, avatar: b64 }));
          if (!isEditing && onUpdateUser) { const u = { ...user, avatar: b64 }; onUpdateUser(u); queueProfileSync(u); }
      };
      reader.readAsDataURL(file);
  };

  const handleSave = async () => {
      setIsSyncing(true);
      // El username solo se puede fijar UNA vez: mientras no esté bloqueado, cada guardado
      // intenta reservarlo (vía RPC con índice único en Supabase, no un simple check-then-write
      // en el cliente, que tendría ventana de carrera con otro usuario guardando a la vez).
      if (!user.usernameLocked) {
          const confirmed = window.confirm(pt('usernameLockConfirm').replace('{username}', formData.username));
          if (!confirmed) { setIsSyncing(false); return; }
          try {
              await setUsername(formData.username);
          } catch (e) {
              if (e instanceof UsernameTakenError) {
                  // Sugerencia derivada de lo que el usuario escribió (como hace Gmail con un
                  // email ya en uso: "javier92", no un nombre random sin relación) — un
                  // traveler_N genérico no ayuda a nadie a reconocer su propio intento.
                  const base = formData.username.slice(0, 16); // deja hueco para el sufijo, máx. 20
                  const suggestion = `${base}${Math.floor(100 + Math.random() * 900)}`;
                  setFormData(prev => ({ ...prev, username: suggestion }));
                  toast(`Ese nombre ya está en uso. Te sugerimos @${suggestion} — pulsa guardar de nuevo si te vale.`, 'error');
              } else {
                  toast('No se pudo guardar el nombre de usuario. Reintenta.', 'error');
              }
              setIsSyncing(false);
              return;
          }
      }
      // Optimista: el perfil local ya está a salvo (Preferences en nativo) y el próximo login
      // hace flush de cualquier pendiente antes de leer de Supabase, así que no hace falta
      // bloquear la UI esperando a la red — queueProfileSync reintenta en segundo plano.
      const age = new Date().getFullYear() - new Date(formData.birthday).getFullYear();
      const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`.trim(), age, usernameLocked: true };
      if (onUpdateUser) onUpdateUser(updatedUser);
      queueProfileSync(updatedUser);
      setIsEditing(false);
      setIsSyncing(false);
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // Anonimiza en vez de borrar la fila: la persona deja de ser identificable (email,
      // nombre, avatar, bio, fecha de nacimiento exacta y fotos desaparecen; se borra también
      // su cuenta de Supabase Auth), pero millas/insignias/visados/tours/ciudades/edad/sexo
      // se conservan para las estadísticas agregadas — sí ocurrieron, solo dejan de poder
      // atribuirse a esa persona.
      const { error } = await supabase.rpc('delete_account_rpc');
      if (error) throw error;
      toast(pt('deleteSuccessToast'), 'success');
      await supabase.auth.signOut().catch(() => {});
      setShowDeleteConfirm(false);
      // Recarga completa en vez de crear nosotros la cuenta anónima nueva: así el siguiente
      // arranque pasa por el mismo camino que un primer uso real de la app (mismo bootstrap,
      // sin código especial para este caso) — se ve como "salir y volver a entrar", no como
      // seguir en la misma sesión con una cuenta distinta por debajo sin que se note.
      setTimeout(() => window.location.reload(), 1200);
    } catch (e: any) {
      console.error("Error deleting account", e);
      toast(e.message || pt('deleteErrorToast'), 'error');
    }
    finally { setIsDeleting(false); }
  };

  const handleShareRank = async () => {
    const message = pt('shareRankMessage').replace('{rank}', user.rank).replace('{miles}', user.miles.toLocaleString());
    if (navigator.share) { try { await navigator.share({ title: 'BDAI Rank', text: message, url: 'https://app.bdai.travel' }); } catch (e) {} }
    else { navigator.clipboard.writeText(message); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start overflow-y-auto no-scrollbar bg-slate-950/98 backdrop-blur-2xl">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl animate-bounce">
          <i className="fas fa-check-circle mr-2"></i> {pt('copiedToClipboard')}
        </div>
      )}

      <div className="w-full max-w-sm px-4 pt-safe-iphone">
        <div className="flex justify-between items-center mb-6 w-full px-2">
            {/* Cerrar sesión no tiene sentido para un perfil anónimo: no hay otra cuenta a la
                que "volver", y perdería el progreso local sin el aviso de la zona de peligro. */}
            {!user.isAnonymous && (
                <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-red-500/20">
                    <i className="fas fa-sign-out-alt"></i> {pt('logout')}
                </button>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/5 active:scale-90 shadow-lg ml-auto"><i className="fas fa-times"></i></button>
        </div>

        {user.isAnonymous && (
            <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 mb-6">
                <div className="flex items-start gap-3 mb-4">
                    <i className="fas fa-triangle-exclamation text-amber-500 text-sm mt-0.5"></i>
                    <div>
                        <p className="text-amber-500 font-black text-[11px] uppercase tracking-widest leading-tight mb-1">{pt('anonBannerTitle')}</p>
                        <p className="text-slate-300 text-[11px] leading-relaxed">{pt('anonBannerText')}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isIOS ? (
                        <button onClick={handleLinkApple} className="flex-1 h-12 bg-black border border-white/10 text-white rounded-2xl font-semibold text-[13px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                            <AppleLogo className="w-[15px] h-[15px]" color="#FFFFFF" />
                            {pt('linkApple')}
                        </button>
                    ) : (
                        <button onClick={handleLinkGoogle} className="flex-1 h-12 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg">
                            <i className="fab fa-google text-purple-600"></i>{pt('linkGoogle')}
                        </button>
                    )}
                </div>
            </div>
        )}

        <div className="bg-[#f3f0e6] w-full rounded-[2.5rem] overflow-hidden shadow-2xl relative border-[3px] border-[#d7d2c3] flex flex-col text-slate-900 mb-64">
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
            <div className="bg-[#8b2b2b] p-6 flex justify-between items-center shrink-0 border-b-2 border-[#d7d2c3]">
                <div>
                    <h2 className="text-yellow-500 font-black text-[11px] uppercase tracking-widest leading-none">{pt('title')}</h2>
                    <p className="text-white/40 text-[7px] font-bold uppercase tracking-widest mt-1.5">{pt('subtitle')}</p>
                </div>
                <div className="flex gap-2">
                    {isEditing && (
                        <button 
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || 'traveler',
                                    city: user.city || '', country: user.country || '', avatar: user.avatar || AVATARS[0],
                                    birthday: user.birthday || '1995-01-01', language: user.language || 'es', gender: user.gender || 'unspecified'
                                });
                            }} 
                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 text-white transition-all shadow-lg"
                        >
                            <i className="fas fa-times-circle text-xs"></i>
                        </button>
                    )}
                    <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEditing ? 'bg-blue-600' : 'bg-white/10'} text-white transition-all shadow-lg`}>
                        {isSyncing ? <i className="fas fa-spinner fa-spin text-xs"></i> : <i className={`fas ${isEditing ? 'fa-save' : 'fa-edit'} text-xs`}></i>}
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-8">
                <div className="flex gap-6 items-start">
                    <div onClick={() => fileInputRef.current?.click()} className="shrink-0 w-28 h-36 bg-white border-2 border-[#d7d2c3] rounded-xl shadow-lg overflow-hidden p-1 relative cursor-pointer group">
                        <img src={formData.avatar} className="w-full h-full object-cover grayscale contrast-125 saturate-0" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[8px] font-black text-center px-2 opacity-0 group-hover:opacity-100 transition-opacity">{pt('changeAvatar')}</div>
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="pb-2 border-b border-slate-200">
                            <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">ID_NOMAD</p>
                            <div className="flex items-center gap-2">
                                {isEditing && !user.usernameLocked ? (
                                    <div className="w-full">
                                        <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px]" placeholder="username" maxLength={20} />
                                        <p className="text-[7px] text-amber-600 font-bold mt-1 flex items-center gap-1">
                                            <i className="fas fa-triangle-exclamation"></i>
                                            {pt('usernameLockWarning')}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="font-black text-slate-900 uppercase text-xs truncate leading-none flex items-center gap-1.5">
                                        @{formData.username}
                                        {user.usernameLocked && <i className="fas fa-lock text-[8px] text-slate-400" title="El nombre de usuario ya no se puede cambiar"></i>}
                                    </p>
                                )}
                                {!isEditing && formData.country && (
                                    <img src={`https://flagsapi.com/${formData.country.length === 2 ? formData.country.toUpperCase() : formData.country.substring(0,2).toUpperCase()}/flat/64.png`} className="w-3 h-3 rounded-full" alt="" />
                                )}
                            </div>
                        </div>
                        <div className="pb-2 border-b border-slate-200">
                            <p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('email')}</p>
                            <p className="font-bold text-slate-600 text-[8px] truncate leading-none">{user.email}</p>
                        </div>
                        <div><p className="text-[7px] text-slate-400 font-black uppercase mb-1 tracking-widest">{pt('rank')}</p><p className="font-black text-purple-600 text-[9px] uppercase">{user.rank}</p></div>
                        <div className="border-t border-slate-200 pt-3">
                            <div><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('miles')}</p><p className="font-black text-slate-900 text-[9px] mt-1">{user.miles.toLocaleString()}</p></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    {[['givenNames','firstName'],['surname','lastName'],['city','city'],['country','country'],['birthday','birthday']].map(([label, field]) => (
                        <div key={field} className="space-y-1">
                            <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt(label)}</p>
                            {isEditing ? (
                                <input type={field === 'birthday' ? 'date' : 'text'} value={formData[field as keyof typeof formData]} onChange={e => setFormData({...formData, [field]: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" />
                            ) : (
                                <p className="font-bold text-slate-800 text-[10px] uppercase">{formData[field as keyof typeof formData] || '---'}</p>
                            )}
                        </div>
                    ))}
                    <div className="space-y-1 col-span-2">
                        <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('gender')}</p>
                        {isEditing ? (
                            <div className="flex gap-2">
                                {(['male', 'female', 'unspecified'] as const).map(g => (
                                    <button key={g} type="button" onClick={() => setFormData({ ...formData, gender: g })}
                                        className={`flex-1 py-1.5 rounded text-[8px] font-black uppercase tracking-wider transition-all ${formData.gender === g ? 'bg-purple-600 text-white' : 'bg-white/50 border border-slate-300 text-slate-600'}`}>
                                        {pt(g)}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="font-bold text-slate-800 text-[10px] uppercase">{formData.gender && formData.gender !== 'unspecified' ? pt(formData.gender) : '---'}</p>
                        )}
                    </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-slate-300">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-4 tracking-widest">{pt('stamps')}</p>
                    <div className="grid grid-cols-4 gap-3">
                        {user.stamps.length > 0 ? user.stamps.map((s, i) => {
                            let dateStr = '';
                            if (s.date) {
                                const d = new Date(s.date);
                                if (!isNaN(d.getTime())) {
                                    dateStr = d.toLocaleDateString();
                                }
                            }
                            return (
                            <div key={i} onClick={() => openVisa(s)} className="aspect-square bg-white border-2 border-slate-300 rounded-2xl flex flex-col items-center justify-center p-1.5 shadow-sm transform rotate-[-4deg] hover:rotate-0 transition-transform cursor-pointer">
                                <i className="fas fa-stamp text-lg mb-1" style={{ color: s.color }}></i>
                                <span className="text-[6px] font-black text-slate-900 uppercase truncate w-full text-center">{s.city}</span>
                                <span className="text-[5px] font-bold text-slate-600 uppercase truncate w-full text-center">{s.country}</span>
                                {dateStr && <span className="text-[4px] font-bold text-slate-500 uppercase truncate w-full text-center mt-0.5">{dateStr}</span>}
                            </div>
                        )}) : [1,2,3,4].map(i => <div key={i} className="aspect-square bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl"></div>)}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                    <p className="text-[8px] font-black text-slate-500 mb-4 tracking-widest uppercase">{pt('rankBadges')}</p>
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {APP_BADGES.filter(b => b.category === 'rank').map((b) => {
                            const isEarned = user.badges?.some(ub => ub.id === b.id);
                            return (
                                <div key={b.id} onClick={() => openBadge(b.id)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border transition-all ${isEarned ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.3)] scale-105 cursor-pointer' : 'bg-slate-900/50 border-slate-800 opacity-30 grayscale cursor-pointer hover:opacity-50'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${isEarned ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : 'bg-slate-800 text-slate-600'}`}>
                                        <i className={`fas ${b.icon} text-sm`}></i>
                                    </div>
                                    <span className={`text-[7px] font-black uppercase text-center leading-tight mb-1 ${isEarned ? 'text-slate-900' : 'text-slate-500'}`}>{b.name}</span>
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={() => setShowBragModal(true)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 border border-white/5">
                        <i className="fas fa-bullhorn text-purple-400"></i>{pt('shareRank')}
                    </button>
                </div>

                <div className="pt-6 border-t border-slate-200">
                    <p className="text-[8px] font-black text-slate-500 mb-4 tracking-widest uppercase">{pt('achievementBadges')}</p>
                    <div className="grid grid-cols-3 gap-3">
                        {APP_BADGES.filter(b => b.category !== 'rank').map((b) => {
                            const isEarned = user.badges?.some(ub => ub.id === b.id);
                            return (
                                <div key={b.id} onClick={() => openBadge(b.id)} className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border transition-all ${isEarned ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.3)] scale-105 cursor-pointer' : 'bg-slate-900/50 border-slate-800 opacity-30 grayscale cursor-pointer hover:opacity-50'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${isEarned ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : 'bg-slate-800 text-slate-600'}`}>
                                        <i className={`fas ${b.icon} text-sm`}></i>
                                    </div>
                                    <span className={`text-[7px] font-black uppercase text-center leading-tight mb-1 ${isEarned ? 'text-slate-900' : 'text-slate-500'}`}>{b.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-6">
                    <p className="text-[8px] font-black text-slate-500 uppercase mb-4 tracking-widest">{pt('langLabel')}</p>
                    <div className="flex flex-wrap gap-2 mb-20">
                        {LANGUAGES.map(lang => (
                            <LangCircle key={lang.code} label={lang.name} code={lang.code} isActive={user.language === lang.code} onClick={() => onLangChange?.(lang.code)} />
                        ))}
                    </div>
                    {isAdmin && (
                        <div className="flex gap-2 mb-3">
                            <button onClick={onOpenAdmin} className="flex-1 py-4 bg-slate-900 text-yellow-500 text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95 shadow-lg">
                                <i className="fas fa-tools text-xs"></i> {pt('admin')}
                            </button>
                            <button onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('open-partner-dashboard')); }} className="flex-1 py-4 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95 shadow-lg">
                                <i className="fas fa-chart-line text-xs"></i> PARTNER
                            </button>
                        </div>
                    )}
                    {!user.isAnonymous && (
                        <button onClick={() => { if (onLogout) onLogout(); else { supabase.auth.signOut().catch(() => {}); onClose(); } }} className="w-full py-4 bg-red-600/10 border border-red-500/30 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all mb-4">
                            <i className="fas fa-sign-out-alt"></i>{pt('logout')}
                        </button>
                    )}
                    <div className="flex justify-center gap-4 mb-6">
                        <button onClick={() => setShowLegal('privacy')} className="text-[9px] text-slate-500 uppercase tracking-widest hover:text-purple-500 transition-colors font-black">{pt('privacy')}</button>
                        <span className="text-slate-700">•</span>
                        <button onClick={() => setShowLegal('terms')} className="text-[9px] text-slate-500 uppercase tracking-widest hover:text-purple-500 transition-colors font-black">{pt('terms')}</button>
                    </div>
                    <button onClick={() => setShowReportBug(true)} className="w-full py-3 mb-2 bg-transparent text-slate-500 hover:text-purple-500 rounded-2xl font-black text-[9px] tracking-widest flex items-center justify-center gap-2 transition-all">
                        <i className="fas fa-bug"></i>{pt('reportBug')}
                    </button>
                    <div className="w-full flex items-center justify-between px-2 py-3 mb-2 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-database text-slate-600 text-[10px]"></i>
                            <span className="text-slate-600 text-[9px] font-black uppercase tracking-widest">
                                {pt('offlineCacheLabel')}
                            </span>
                            <span className="text-purple-500 text-[9px] font-bold">
                                {(cacheSize / (1024 * 1024)).toFixed(1)} MB
                            </span>
                        </div>
                        <button
                            disabled={isClearing || cacheSize === 0}
                            onClick={async () => {
                                setIsClearing(true);
                                await tourCacheService.clearAudioCache();
                                setCacheSize(0);
                                setIsClearing(false);
                            }}
                            className="text-[9px] font-black text-red-400 uppercase tracking-widest active:scale-90 disabled:opacity-30 transition-all"
                        >
                            {isClearing ? '...' : pt('clearCache')}
                        </button>
                    </div>
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 bg-transparent text-slate-600 hover:text-red-400 rounded-2xl font-bold text-[9px] tracking-widest flex items-center justify-center gap-2 transition-all">
                        <i className="fas fa-trash-alt"></i>{pt('deleteAccount')}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {showBragModal && ReactDOM.createPortal(
        <ShareableBadge 
          rank={user.rank} 
          miles={user.miles} 
          onClose={() => setShowBragModal(false)} 
          pt={pt}
        />,
        document.body
      )}

      {selectedBadge && ReactDOM.createPortal(
        <ShareableBadge 
          badge={selectedBadge.badge}
          isEarned={selectedBadge.isEarned}
          badgeDescription={pt(selectedBadge.badge.description)}
          onClose={closeBadge} 
          pt={pt}
          miles={user.miles}
        />,
        document.body
      )}

      {selectedVisa && ReactDOM.createPortal(
        <ShareableVisa 
          cityName={selectedVisa.city}
          milesEarned={0} // We don't have this in the stamp directly, could fetch if needed
          stampDate={selectedVisa.date ? new Date(selectedVisa.date).toLocaleDateString() : ''}
          rank={user.rank}
          onClose={closeVisa} 
          pt={pt}
        />,
        document.body
      )}

      {showLegal && ReactDOM.createPortal(
        <LegalModal type={showLegal} onClose={() => setShowLegal(null)} language={user.language || 'es'} />,
        document.body
      )}

      {showReportBug && ReactDOM.createPortal(
        <ReportBugModal onClose={() => setShowReportBug(false)} language={language || user.language || 'es'} userEmail={user.email} />,
        document.body
      )}

      {showDeleteConfirm && ReactDOM.createPortal(
        <DeleteConfirmModal user={user} pt={pt} onCancel={() => setShowDeleteConfirm(false)} onConfirm={handleDeleteAccount} isDeleting={isDeleting} />,
        document.body
      )}
    </div>
  );
};

