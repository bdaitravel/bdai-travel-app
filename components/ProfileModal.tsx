import ReactDOM from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, APP_BADGES } from '../types';
import { syncUserProfile, supabase } from '../services/supabaseClient';
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

const MODAL_TEXTS: any = {
    es: { title: "Pasaporte Global bdai", subtitle: "Nómada Digital ID", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País", age: "Edad", birthday: "Nacimiento", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión", stamps: "Mis Visados", badges: "Insignias", rankBadges: "Rangos", achievementBadges: "Logros", langLabel: "Idioma", rank: "RANGO", miles: "MILLAS", admin: "ADMIN", streak: "Racha", changeAvatar: "Cambiar Foto", email: "Correo Electrónico", reportBug: "Reportar Error", privacy: "Privacidad", terms: "Términos", deleteAccount: "Eliminar Cuenta (GDPR)", deleteConfirmTitle: "⚠️ ZONA DE PELIGRO", deleteConfirmText: "Esta acción es IRREVERSIBLE. Perderás todas tus millas, visados, insignias e historial para siempre.", deleteConfirmInstruction: "Escribe tu email para confirmar:", deleteConfirmPlaceholder: "tu@email.com", deleteConfirmCancel: "Cancelar", deleteConfirmYes: "Eliminar permanentemente", deleting: "Borrando...", deleteCountdown: "Espera {n}s...", deleteEmailMismatch: "El email no coincide" },
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad ID", surname: "Surname", givenNames: "Given Names", city: "City", country: "Country", age: "Age", birthday: "Birthdate", save: "Save", edit: "Edit", logout: "Logout", stamps: "My Visas", badges: "Badges", rankBadges: "Ranks", achievementBadges: "Achievements", langLabel: "Language", rank: "RANK", miles: "MILES", admin: "ADMIN", streak: "Streak", changeAvatar: "Change Photo", email: "Email Address", reportBug: "Report Bug", privacy: "Privacy", terms: "Terms", deleteAccount: "Delete Account (GDPR)", deleteConfirmTitle: "⚠️ DANGER ZONE", deleteConfirmText: "This action is IRREVERSIBLE. You will permanently lose all your miles, visas, badges and history.", deleteConfirmInstruction: "Type your email to confirm:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "Cancel", deleteConfirmYes: "Permanently delete", deleting: "Deleting...", deleteCountdown: "Wait {n}s...", deleteEmailMismatch: "Email doesn't match" },
    fr: { title: "Passeport Global bdai", subtitle: "ID Nomade Numérique", surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays", age: "Âge", birthday: "Naissance", save: "Enregistrer", edit: "Modifier", logout: "Déconnexion", stamps: "Mes Visas", badges: "Badges", rankBadges: "Rangs", achievementBadges: "Réalisations", langLabel: "Langue", rank: "RANG", miles: "MILES", admin: "ADMIN", streak: "Série", changeAvatar: "Changer Photo", email: "Adresse e-mail", reportBug: "Signaler un bug", privacy: "Confidentialité", terms: "Conditions", deleteAccount: "Supprimer le Compte (RGPD)", deleteConfirmTitle: "⚠️ ZONE DANGEREUSE", deleteConfirmText: "Cette action est IRRÉVERSIBLE. Vous perdrez définitivement tous vos miles, visas, badges et historique.", deleteConfirmInstruction: "Tapez votre email pour confirmer:", deleteConfirmPlaceholder: "votre@email.com", deleteConfirmCancel: "Annuler", deleteConfirmYes: "Supprimer définitivement", deleting: "Suppression...", deleteCountdown: "Attendez {n}s...", deleteEmailMismatch: "L'email ne correspond pas" },
    de: { title: "bdai Globaler Pass", subtitle: "Digital Nomad ID", surname: "Nachname", givenNames: "Vornamen", city: "Stadt", country: "Land", age: "Alter", birthday: "Geburtstag", save: "Speichern", edit: "Bearbeiten", logout: "Abmelden", stamps: "Meine Visa", badges: "Abzeichen", rankBadges: "Ränge", achievementBadges: "Erfolge", langLabel: "Sprache", rank: "RANG", miles: "MEILEN", admin: "ADMIN", streak: "Serie", changeAvatar: "Foto ändern", email: "E-Mail-Adresse", reportBug: "Fehler melden", privacy: "Datenschutz", terms: "Nutzungsbedingungen", deleteAccount: "Konto löschen (DSGVO)", deleteConfirmTitle: "⚠️ GEFAHRENZONE", deleteConfirmText: "Diese Aktion ist UNWIDERRUFLICH. Sie verlieren alle Meilen, Visa, Abzeichen und den Verlauf dauerhaft.", deleteConfirmInstruction: "E-Mail zur Bestätigung eingeben:", deleteConfirmPlaceholder: "ihre@email.com", deleteConfirmCancel: "Abbrechen", deleteConfirmYes: "Dauerhaft löschen", deleting: "Löschen...", deleteCountdown: "Warten {n}s...", deleteEmailMismatch: "E-Mail stimmt nicht überein" },
    it: { title: "Passaporto Globale bdai", subtitle: "ID Nomade Digitale", surname: "Cognome", givenNames: "Nomi", city: "Città", country: "Paese", age: "Età", birthday: "F. Nascita", save: "Salva", edit: "Modifica", logout: "Esci", stamps: "I Miei Visti", badges: "Distintivi", rankBadges: "Gradi", achievementBadges: "Risultati", langLabel: "Lingua", rank: "RANGO", miles: "MIGLIA", admin: "ADMIN", streak: "Serie", changeAvatar: "Cambia Foto", email: "Indirizzo email", reportBug: "Segnala un bug", privacy: "Privacy", terms: "Termini", deleteAccount: "Elimina Account (GDPR)", deleteConfirmTitle: "⚠️ ZONA PERICOLOSA", deleteConfirmText: "Questa azione è IRREVERSIBILE. Perderai definitivamente tutte le miglia, visti, distintivi e cronologia.", deleteConfirmInstruction: "Digita la tua email per confermare:", deleteConfirmPlaceholder: "tua@email.com", deleteConfirmCancel: "Annulla", deleteConfirmYes: "Elimina definitivamente", deleting: "Eliminazione...", deleteCountdown: "Aspetta {n}s...", deleteEmailMismatch: "L'email non corrisponde" },
    pt: { title: "Passaporte Global bdai", subtitle: "ID Nómada Digital", surname: "Apelido", givenNames: "Nomes", city: "Cidade", country: "País", age: "Idade", birthday: "Nascimento", save: "Guardar", edit: "Editar", logout: "Sair", stamps: "Meus Vistos", badges: "Distintivos", rankBadges: "Classificações", achievementBadges: "Conquistas", langLabel: "Idioma", rank: "RANKING", miles: "MILHAS", admin: "ADMIN", streak: "Sequência", changeAvatar: "Mudar Foto", email: "Endereço de email", reportBug: "Reportar Erro", privacy: "Privacidade", terms: "Termos", deleteAccount: "Eliminar Conta (RGPD)", deleteConfirmTitle: "⚠️ ZONA DE PERIGO", deleteConfirmText: "Esta ação é IRREVERSÍVEL. Perderá permanentemente todas as suas milhas, vistos, emblemas e histórico.", deleteConfirmInstruction: "Escreva o seu email para confirmar:", deleteConfirmPlaceholder: "seu@email.com", deleteConfirmCancel: "Cancelar", deleteConfirmYes: "Eliminar permanentemente", deleting: "Eliminando...", deleteCountdown: "Aguarde {n}s...", deleteEmailMismatch: "O email não corresponde" },
    ro: { title: "Pașaport Global bdai", subtitle: "ID Nomad Digital", surname: "Nume", givenNames: "Prenume", city: "Oraș", country: "Țară", age: "Vârstă", birthday: "Naștere", save: "Salvare", edit: "Editare", logout: "Deconectare", stamps: "Vizele Mele", badges: "Insigne", rankBadges: "Ranguri", achievementBadges: "Realizări", langLabel: "Limbă", rank: "RANG", miles: "MILE", admin: "ADMIN", streak: "Serie", changeAvatar: "Schimbă Foto", email: "Adresă email", reportBug: "Raportează o eroare", privacy: "Confidențialitate", terms: "Termeni", deleteAccount: "Șterge Contul (GDPR)", deleteConfirmTitle: "⚠️ ZONĂ PERICULOASĂ", deleteConfirmText: "Această acțiune este IREVERSIBILĂ. Veți pierde definitiv toate milele, vizele, insignele și istoricul.", deleteConfirmInstruction: "Introduceți emailul pentru confirmare:", deleteConfirmPlaceholder: "email@tau.com", deleteConfirmCancel: "Anulare", deleteConfirmYes: "Șterge definitiv", deleting: "Ștergere...", deleteCountdown: "Așteptați {n}s...", deleteEmailMismatch: "Emailul nu se potrivește" },
    ru: { title: "Глобальный паспорт bdai", subtitle: "ID кочевника", surname: "Фамилия", givenNames: "Имя", city: "Город", country: "Страна", age: "Возраст", birthday: "Рождение", save: "Сохранить", edit: "Править", logout: "Выйти", stamps: "Визы", badges: "Значки", rankBadges: "Ранги", achievementBadges: "Достижения", langLabel: "Язык", rank: "РАНГ", miles: "МИЛИ", admin: "АДМИН", streak: "Серия", changeAvatar: "Сменить фото", email: "Электронная почта", reportBug: "Сообщить об ошибке", privacy: "Конфиденциальность", terms: "Условия", deleteAccount: "Удалить Аккаунт (GDPR)", deleteConfirmTitle: "⚠️ ОПАСНАЯ ЗОНА", deleteConfirmText: "Это действие НЕОБРАТИМО. Вы навсегда потеряете все мили, визы, значки и историю.", deleteConfirmInstruction: "Введите email для подтверждения:", deleteConfirmPlaceholder: "ваш@email.com", deleteConfirmCancel: "Отмена", deleteConfirmYes: "Удалить навсегда", deleting: "Удаление...", deleteCountdown: "Подождите {n}с...", deleteEmailMismatch: "Email не совпадает" },
    ar: { title: "جواز سفر bdai العالمي", subtitle: "هوية البدوي الرقمي", surname: "اللقب", givenNames: "الأسماء", city: "المدينة", country: "البلد", age: "العمر", birthday: "الميلاد", save: "حفظ", edit: "تعديل", logout: "خروج", stamps: "تأشيراتي", badges: "الأوسمة", rankBadges: "الرتب", achievementBadges: "الإنجازات", langLabel: "اللغة", rank: "الرتبة", miles: "الأميال", admin: "مسؤول", streak: "سلسلة", changeAvatar: "تغيير الصورة", email: "البريد الإلكتروني", reportBug: "الإبلاغ عن خطأ", privacy: "الخصوصية", terms: "الشروط", deleteAccount: "حذف الحساب (GDPR)", deleteConfirmTitle: "⚠️ منطقة الخطر", deleteConfirmText: "هذا الإجراء لا رجعة فيه. ستفقد جميع أميالك وتأشيراتك وأوسمتك وسجلك إلى الأبد.", deleteConfirmInstruction: "اكتب بريدك الإلكتروني للتأكيد:", deleteConfirmPlaceholder: "بريدك@email.com", deleteConfirmCancel: "إلغاء", deleteConfirmYes: "حذف نهائياً", deleting: "جارٍ الحذف...", deleteCountdown: "انتظر {n}ث...", deleteEmailMismatch: "البريد الإلكتروني لا يتطابق" },
    zh: { title: "bdai 全球护照", subtitle: "数字游民 ID", surname: "姓", givenNames: "名", city: "城市", country: "国家", age: "年龄", birthday: "生日", save: "保存", edit: "编辑", logout: "登出", stamps: "我的签证", badges: "奖章", rankBadges: "等级", achievementBadges: "成就", langLabel: "语言", rank: "等级", miles: "里程", admin: "管理", streak: "连续", changeAvatar: "更换照片", email: "电子邮件", reportBug: "报告错误", privacy: "隐私", terms: "条款", deleteAccount: "删除账户 (GDPR)", deleteConfirmTitle: "⚠️ 危险区域", deleteConfirmText: "此操作不可逆。您将永久失去所有里程、签证、徽章和历史记录。", deleteConfirmInstruction: "输入您的邮箱以确认:", deleteConfirmPlaceholder: "您的@邮箱.com", deleteConfirmCancel: "取消", deleteConfirmYes: "永久删除", deleting: "删除中...", deleteCountdown: "等待 {n}秒...", deleteEmailMismatch: "邮箱不匹配" },
    ja: { title: "bdai パスポート", subtitle: "デジタルノマド ID", surname: "姓", givenNames: "名", city: "都市", country: "国", age: "年齢", birthday: "誕生日", save: "保存", edit: "編集", logout: "ログアウト", stamps: "ビザ", badges: "バッジ", rankBadges: "ランク", achievementBadges: "実績", langLabel: "言語", rank: "ランク", miles: "マイル", admin: "管理", streak: "記録", changeAvatar: "写真変更", email: "メールアドレス", reportBug: "バグを報告", privacy: "プライバシー", terms: "利用規約", deleteAccount: "アカウント削除 (GDPR)", deleteConfirmTitle: "⚠️ 危険ゾーン", deleteConfirmText: "この操作は元に戻せません。すべてのマイル、ビザ、バッジ、履歴が永久に失われます。", deleteConfirmInstruction: "確認のためメールアドレスを入力:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "キャンセル", deleteConfirmYes: "完全に削除する", deleting: "削除中...", deleteCountdown: "{n}秒待機中...", deleteEmailMismatch: "メールアドレスが一致しません" },
    ko: { title: "bdai 글로벌 여권", subtitle: "디지털 노마드 ID", surname: "성", givenNames: "이름", city: "도시", country: "국가", age: "나이", birthday: "생일", save: "저장", edit: "편집", logout: "로그아웃", stamps: "내 비자", badges: "배지", rankBadges: "등급", achievementBadges: "업적", langLabel: "언어", rank: "등급", miles: "마일", admin: "관리자", streak: "연속", changeAvatar: "사진 변경", email: "이메일 주소", reportBug: "버그 신고", privacy: "개인정보", terms: "이용약관", deleteAccount: "계정 삭제 (GDPR)", deleteConfirmTitle: "⚠️ 위험 구역", deleteConfirmText: "이 작업은 되돌릴 수 없습니다. 모든 마일, 비자, 배지, 기록이 영구적으로 삭제됩니다.", deleteConfirmInstruction: "확인을 위해 이메일을 입력하세요:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "취소", deleteConfirmYes: "영구 삭제", deleting: "삭제 중...", deleteCountdown: "{n}초 대기...", deleteEmailMismatch: "이메일이 일치하지 않습니다" },
    hi: { title: "bdai वैश्विक पासपोर्ट", subtitle: "डिजिटल घुमंतू आईडी", surname: "उपनाम", givenNames: "नाम", city: "शहर", country: "देश", age: "आयु", birthday: "जन्मदिन", save: "सहेजें", edit: "संपादित करें", logout: "लॉगआउट", stamps: "मेरे वीजा", badges: "बैज", rankBadges: "रैंक", achievementBadges: "उपलब्धियां", langLabel: "भाषा", rank: "रैंक", miles: "मील", admin: "व्यवस्थापक", streak: "लगातार", changeAvatar: "फोटो बदलें", email: "ईमेल पता", reportBug: "बग की रिपोर्ट करें", privacy: "गोपनीयता", terms: "नियम", deleteAccount: "खाता हटाएं (GDPR)", deleteConfirmTitle: "⚠️ खतरा क्षेत्र", deleteConfirmText: "यह क्रिया अपरिवर्तनीय है। आपकी सभी मील, वीजा, बैज और इतिहास हमेशा के लिए नष्ट हो जाएगा।", deleteConfirmInstruction: "पुष्टि के लिए अपना ईमेल लिखें:", deleteConfirmPlaceholder: "आपका@ईमेल.com", deleteConfirmCancel: "रद्द करें", deleteConfirmYes: "स्थायी रूप से हटाएं", deleting: "हटाया जा रहा है...", deleteCountdown: "{n}s प्रतीक्षा करें...", deleteEmailMismatch: "ईमेल मेल नहीं खाता" },
    tr: { title: "bdai Küresel Pasaport", subtitle: "Dijital Nomad Kimliği", surname: "Soyadı", givenNames: "İsimler", city: "Şehir", country: "Ülke", age: "Yaş", birthday: "Doğum", save: "Kaydet", edit: "Düzenle", logout: "Çıkış", stamps: "Vizelerim", badges: "Rozetler", rankBadges: "Rütbeler", achievementBadges: "Başarılar", langLabel: "Dil", rank: "RÜTBE", miles: "MİLLER", admin: "YÖNETİCİ", streak: "Seri", changeAvatar: "Fotoğraf Değiştir", email: "E-posta adresi", reportBug: "Hata Bildir", privacy: "Gizlilik", terms: "Koşullar", deleteAccount: "Hesabı Sil (GDPR)", deleteConfirmTitle: "⚠️ TEHLİKE BÖLGESİ", deleteConfirmText: "Bu işlem GERİ ALINAMAZ. Tüm millerinizi, vizelerinizi, rozetlerinizi ve geçmişinizi sonsuza kadar kaybedeceksiniz.", deleteConfirmInstruction: "Onaylamak için e-postanızı yazın:", deleteConfirmPlaceholder: "sizin@email.com", deleteConfirmCancel: "İptal", deleteConfirmYes: "Kalıcı olarak sil", deleting: "Siliniyor...", deleteCountdown: "{n}s bekleyin...", deleteEmailMismatch: "E-posta eşleşmiyor" },
    nl: { title: "bdai Globaal Paspoort", subtitle: "Digital Nomad ID", surname: "Achternaam", givenNames: "Voornamen", city: "Stad", country: "Land", age: "Leeftijd", birthday: "Geboortedatum", save: "Opslaan", edit: "Bewerken", logout: "Uitloggen", stamps: "Mijn Visa", badges: "Badges", rankBadges: "Rangen", achievementBadges: "Prestaties", langLabel: "Taal", rank: "RANG", miles: "MIJL", admin: "ADMIN", streak: "Reeks", changeAvatar: "Foto wijzigen", email: "E-mailadres", reportBug: "Fout melden", privacy: "Privacy", terms: "Voorwaarden", deleteAccount: "Account verwijderen (GDPR)", deleteConfirmTitle: "⚠️ GEVARENZONE", deleteConfirmText: "Deze actie is ONOMKEERBAAR. U verliest permanent alle mijlen, visa, badges en geschiedenis.", deleteConfirmInstruction: "Typ uw e-mail ter bevestiging:", deleteConfirmPlaceholder: "uw@email.com", deleteConfirmCancel: "Annuleren", deleteConfirmYes: "Permanent verwijderen", deleting: "Verwijderen...", deleteCountdown: "Wacht {n}s...", deleteEmailMismatch: "E-mail komt niet overeen" },
    pl: { title: "Globalny Paszport bdai", subtitle: "ID Nomady", surname: "Nazwisko", givenNames: "Imiona", city: "Miasto", country: "Kraj", age: "Wiek", birthday: "Data urodzenia", save: "Zapisz", edit: "Edytuj", logout: "Wyloguj", stamps: "Wizy", badges: "Odznaki", rankBadges: "Rangi", achievementBadges: "Osiągnięcia", langLabel: "Język", rank: "RANGA", miles: "MILE", admin: "ADMIN", streak: "Seria", changeAvatar: "Zmień zdjęcie", email: "Adres e-mail", reportBug: "Zgłoś błąd", privacy: "Prywatność", terms: "Warunki", deleteAccount: "Usuń Konto (RODO)", deleteConfirmTitle: "⚠️ STREFA ZAGROŻENIA", deleteConfirmText: "Ta akcja jest NIEODWRACALNA. Stracisz na zawsze wszystkie mile, wizy, odznaki i historię.", deleteConfirmInstruction: "Wpisz swój email, aby potwierdzić:", deleteConfirmPlaceholder: "twoj@email.com", deleteConfirmCancel: "Anuluj", deleteConfirmYes: "Usuń trwale", deleting: "Usuwanie...", deleteCountdown: "Poczekaj {n}s...", deleteEmailMismatch: "Email nie pasuje" },
    ca: { title: "Passaport Global bdai", subtitle: "ID Nòmada Digital", surname: "Cognoms", givenNames: "Noms", city: "Ciutat", country: "País", age: "Edat", birthday: "Naixement", save: "Desar", edit: "Editar", logout: "Sortir", stamps: "Els Meus Visats", badges: "Insígnies", rankBadges: "Rangs", achievementBadges: "Assoliments", langLabel: "Idioma", rank: "RANG", miles: "MILLES", admin: "ADMIN", streak: "Ratxa", changeAvatar: "Canviar Foto", email: "Adreça de correu", reportBug: "Informar d'un error", privacy: "Privacitat", terms: "Termes", deleteAccount: "Eliminar Compte (RGPD)", deleteConfirmTitle: "⚠️ ZONA DE PERILL", deleteConfirmText: "Aquesta acció és IRREVERSIBLE. Perdràs permanentment totes les milles, visats, insígnies i historial.", deleteConfirmInstruction: "Escriu el teu email per confirmar:", deleteConfirmPlaceholder: "el@teu.email", deleteConfirmCancel: "Cancel·lar", deleteConfirmYes: "Eliminar permanentment", deleting: "Eliminant...", deleteCountdown: "Espera {n}s...", deleteEmailMismatch: "L'email no coincideix" },
    eu: { title: "bdai Pasaporte Globala", subtitle: "ID Nomada Digitala", surname: "Abizenak", givenNames: "Izenak", city: "Hiria", country: "Herrialdea", age: "Adina", birthday: "Jaioteguna", save: "Gorde", edit: "Editatu", logout: "Saioa Itxi", stamps: "Nire Visatuak", badges: "Intsigniak", rankBadges: "Mailak", achievementBadges: "Lorpenak", langLabel: "Hizkuntza", rank: "MAILA", miles: "MILIAK", admin: "ADMIN", streak: "Segida", changeAvatar: "Argazkia Aldatu", email: "Helbide elektronikoa", reportBug: "Akatsa jakinarazi", privacy: "Pribatutasuna", terms: "Baldintzak", deleteAccount: "Kontua Ezabatu (DBEO)", deleteConfirmTitle: "⚠️ ARRISKU EREMUA", deleteConfirmText: "Ekintza hau ITZULEZINA da. Zure milia, bisa, txapa eta historia guztiak betirako galduko dituzu.", deleteConfirmInstruction: "Idatzi zure emaila baieztatzeko:", deleteConfirmPlaceholder: "zure@emaila.com", deleteConfirmCancel: "Utzi", deleteConfirmYes: "Behin betiko ezabatu", deleting: "Ezabatzen...", deleteCountdown: "Itxaron {n}s...", deleteEmailMismatch: "Emaila ez dator bat" },
    vi: { title: "Hộ chiếu Toàn cầu bdai", subtitle: "ID Du mục", surname: "Họ", givenNames: "Tên", city: "Thành phố", country: "Quốc gia", age: "Tuổi", birthday: "Ngày sinh", save: "Lưu", edit: "Chỉnh sửa", logout: "Đăng xuất", stamps: "Thị thực", badges: "Huy hiệu", rankBadges: "Cấp bậc", achievementBadges: "Thành tựu", langLabel: "Ngôn ngữ", rank: "CẤP BẬC", miles: "DẶM", admin: "QUẢN TRỊ", streak: "Chuỗi", changeAvatar: "Đổi ảnh", email: "Địa chỉ email", reportBug: "Báo cáo lỗi", privacy: "Quyền riêng tư", terms: "Điều khoản", deleteAccount: "Xóa Tài Khoản (GDPR)", deleteConfirmTitle: "⚠️ VÙNG NGUY HIỂM", deleteConfirmText: "Hành động này KHÔNG THỂ HOÀN TÁC. Bạn sẽ mất vĩnh viễn tất cả dặm, thị thực, huy hiệu và lịch sử.", deleteConfirmInstruction: "Nhập email của bạn để xác nhận:", deleteConfirmPlaceholder: "email@cua.ban", deleteConfirmCancel: "Hủy", deleteConfirmYes: "Xóa vĩnh viễn", deleting: "Đang xóa...", deleteCountdown: "Chờ {n}s...", deleteEmailMismatch: "Email không khớp" },
    th: { title: "พาสปอร์ตทั่วโลก bdai", subtitle: "รหัสนักเดินทาง", surname: "นามสกุล", givenNames: "ชื่อ", city: "เมือง", country: "ประเทศ", age: "อายุ", birthday: "วันเกิด", save: "บันทึก", edit: "แก้ไข", logout: "ออก", stamps: "วีซ่า", badges: "เหรียญตรา", rankBadges: "อันดับ", achievementBadges: "ความสำเร็จ", langLabel: "ภาษา", rank: "อันดับ", miles: "ไมล์", admin: "ผู้ดูแล", streak: "สถิติ", changeAvatar: "เปลี่ยนรูป", email: "ที่อยู่อีเมล", reportBug: "รายงานปัญหา", privacy: "ความเป็นส่วนตัว", terms: "ข้อกำหนด", deleteAccount: "ลบบัญชี (GDPR)", deleteConfirmTitle: "⚠️ เขตอันตราย", deleteConfirmText: "การกระทำนี้ไม่สามารถยกเลิกได้ คุณจะสูญเสียไมล์ วีซ่า เหรียญตรา และประวัติทั้งหมดอย่างถาวร", deleteConfirmInstruction: "พิมพ์อีเมลของคุณเพื่อยืนยัน:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "ยกเลิก", deleteConfirmYes: "ลบถาวร", deleting: "กำลังลบ...", deleteCountdown: "รอ {n}s...", deleteEmailMismatch: "อีเมลไม่ตรงกัน" }
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

    const emailMatches = emailInput.trim().toLowerCase() === user.email.trim().toLowerCase();
    const canDelete = emailMatches && countdownDone && !isDeleting;

    return (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" style={{ zIndex: 999999 }}>
            <div className="w-full max-w-[340px] bg-slate-900 border-2 border-red-500/50 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl shadow-red-500/20">
                <div className="w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mb-4">
                    <i className="fas fa-skull text-2xl text-red-500"></i>
                </div>
                <h3 className="text-white font-black text-base uppercase tracking-widest mb-3">{pt('deleteConfirmTitle')}</h3>
                <p className="text-slate-400 text-xs mb-5 leading-relaxed">{pt('deleteConfirmText')}</p>
                <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest mb-2 w-full text-left">{pt('deleteConfirmInstruction')}</p>
                <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} placeholder={user.email}
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

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin, language, onLangChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
      firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || 'traveler',
      city: user.city || '', country: user.country || '', avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01', language: user.language || 'es'
  });

  useEffect(() => {
    setFormData({
      firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || 'traveler',
      city: user.city || '', country: user.country || '', avatar: user.avatar || AVATARS[0],
      birthday: user.birthday || '1995-01-01', language: user.language || 'es'
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

  const pt = (key: string) => {
    const lang = user.language || 'es';
    const dict = MODAL_TEXTS[lang] || MODAL_TEXTS['en'];
    const globalDict = translations[lang] || translations['en'];
    
    const extra: any = {
        es: { locked: "BLOQUEADO", unlockReq: "Requisito:", milesReq: "Millas necesarias:", confirmShare: "Compartir", cancel: "Cerrar", image: "Guardar Imagen", share: "Compartir Enlace", backToPassport: "Volver al Pasaporte", statusVerified: "Estado: Verificado", missionAccomplished: "MISIÓN CUMPLIDA", locationIdentity: "Identidad de Ubicación", protocolReward: "Recompensa", currentRank: "Rango Actual", digitalAuth: "Autenticación", verified: "VERIFICADO", totalDistance: "Distancia Total", minting: "GENERANDO...", transmitting: "TRANSMITIENDO...", readyToShare: "LISTO PARA COMPARTIR" },
        en: { locked: "LOCKED", unlockReq: "Requirement:", milesReq: "Miles needed:", confirmShare: "Share", cancel: "Close", image: "Save Image", share: "Share Link", backToPassport: "Back to Passport", statusVerified: "Status: Verified", missionAccomplished: "MISSION ACCOMPLISHED", locationIdentity: "Location Identity", protocolReward: "Protocol Reward", currentRank: "Current Rank", digitalAuth: "Digital Auth", verified: "VERIFIED", totalDistance: "Total Distance", minting: "MINTING...", transmitting: "TRANSMITTING...", readyToShare: "READY TO SHARE" }
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
          if (!isEditing && onUpdateUser) { const u = { ...user, avatar: b64 }; onUpdateUser(u); syncUserProfile(u); }
      };
      reader.readAsDataURL(file);
  };

  const handleSave = async () => {
      setIsSyncing(true);
      try {
          const age = new Date().getFullYear() - new Date(formData.birthday).getFullYear();
          const updatedUser = { ...user, ...formData, name: `${formData.firstName} ${formData.lastName}`.trim(), age };
          await syncUserProfile(updatedUser);
          if (onUpdateUser) onUpdateUser(updatedUser);
          setIsEditing(false);
      } catch (e) {} finally { setIsSyncing(false); }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await supabase.from('profiles').delete().eq('email', user.email);
      await supabase.auth.signOut();
      if (onLogout) onLogout();
    } catch (e) { console.error("Error deleting account", e); }
    finally { setIsDeleting(false); }
  };

  const handleShareRank = async () => {
    const message = pt('shareRankMessage').replace('{rank}', user.rank).replace('{miles}', user.miles.toLocaleString());
    if (navigator.share) { try { await navigator.share({ title: 'BDAI Rank', text: message, url: 'https://www.bdai.travel' }); } catch (e) {} }
    else { navigator.clipboard.writeText(message); setShowToast(true); setTimeout(() => setShowToast(false), 3000); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start overflow-y-auto no-scrollbar bg-slate-950/98 backdrop-blur-2xl">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl animate-bounce">
          <i className="fas fa-check-circle mr-2"></i> {pt('copiedToClipboard')}
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
                <div className="flex gap-2">
                    {isEditing && (
                        <button 
                            onClick={() => {
                                setIsEditing(false);
                                setFormData({
                                    firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || 'traveler',
                                    city: user.city || '', country: user.country || '', avatar: user.avatar || AVATARS[0],
                                    birthday: user.birthday || '1995-01-01', language: user.language || 'es'
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
                                {isEditing ? (
                                    <input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px]" placeholder="username" maxLength={20} />
                                ) : (
                                    <p className="font-black text-slate-900 uppercase text-xs truncate leading-none">@{formData.username}</p>
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
                        <div className="flex justify-between border-t border-slate-200 pt-3">
                            <div><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('miles')}</p><p className="font-black text-slate-900 text-[9px] mt-1">{user.miles.toLocaleString()}</p></div>
                            <div className="text-right"><p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt('streak')}</p><p className="font-black text-orange-600 text-[9px] mt-1"><i className="fas fa-fire mr-1"></i> {user.stats.streakDays}</p></div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                    {[['givenNames','firstName'],['surname','lastName'],['city','city'],['birthday','birthday']].map(([label, field]) => (
                        <div key={field} className="space-y-1">
                            <p className="text-[7px] text-slate-400 font-black uppercase tracking-widest">{pt(label)}</p>
                            {isEditing ? (
                                <input type={field === 'birthday' ? 'date' : 'text'} value={(formData as any)[field]} onChange={e => setFormData({...formData, [field]: e.target.value})} className="w-full bg-white/50 border border-slate-300 rounded px-2 py-1 text-[10px] uppercase" />
                            ) : (
                                <p className="font-bold text-slate-800 text-[10px] uppercase">{(formData as any)[field] || '---'}</p>
                            )}
                        </div>
                    ))}
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
                            <div key={i} onClick={() => setSelectedVisa(s)} className="aspect-square bg-white border-2 border-slate-300 rounded-2xl flex flex-col items-center justify-center p-1.5 shadow-sm transform rotate-[-4deg] hover:rotate-0 transition-transform cursor-pointer">
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
                    <div className="grid grid-cols-3 gap-3">
                        {APP_BADGES.filter(b => b.category === 'rank').map((b) => {
                            const isEarned = user.badges?.some(ub => ub.id === b.id);
                            return (
                                <div key={b.id} onClick={() => setSelectedBadge({badge: b, isEarned})} className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border transition-all ${isEarned ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.3)] scale-105 cursor-pointer' : 'bg-slate-900/50 border-slate-800 opacity-30 grayscale cursor-pointer hover:opacity-50'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${isEarned ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : 'bg-slate-800 text-slate-600'}`}>
                                        <i className={`fas ${b.icon} text-sm`}></i>
                                    </div>
                                    <span className={`text-[7px] font-black uppercase text-center leading-tight mb-1 ${isEarned ? 'text-slate-900' : 'text-slate-500'}`}>{b.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                    <p className="text-[8px] font-black text-slate-500 mb-4 tracking-widest uppercase">{pt('achievementBadges')}</p>
                    <div className="grid grid-cols-3 gap-3">
                        {APP_BADGES.filter(b => b.category !== 'rank').map((b) => {
                            const isEarned = user.badges?.some(ub => ub.id === b.id);
                            return (
                                <div key={b.id} onClick={() => setSelectedBadge({badge: b, isEarned})} className={`aspect-square rounded-2xl flex flex-col items-center justify-center p-2 border transition-all ${isEarned ? 'bg-purple-600/20 border-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.3)] scale-105 cursor-pointer' : 'bg-slate-900/50 border-slate-800 opacity-30 grayscale cursor-pointer hover:opacity-50'}`}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${isEarned ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : 'bg-slate-800 text-slate-600'}`}>
                                        <i className={`fas ${b.icon} text-sm`}></i>
                                    </div>
                                    <span className={`text-[7px] font-black uppercase text-center leading-tight mb-1 ${isEarned ? 'text-slate-900' : 'text-slate-500'}`}>{b.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-4">
                    <button onClick={() => setShowBragModal(true)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:scale-95 border border-white/5">
                        <i className="fas fa-bullhorn text-purple-400"></i>{pt('shareRank')}
                    </button>
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
                            <button onClick={() => { onClose(); (window as any).dispatchEvent(new CustomEvent('open-partner-dashboard')); }} className="flex-1 py-4 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 rounded-2xl active:scale-95 shadow-lg">
                                <i className="fas fa-chart-line text-xs"></i> PARTNER
                            </button>
                        </div>
                    )}
                    <button onClick={() => { if (onLogout) onLogout(); else { supabase.auth.signOut().catch(() => {}); onClose(); } }} className="w-full py-4 bg-red-600/10 border border-red-500/30 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all mb-4">
                        <i className="fas fa-sign-out-alt"></i>{pt('logout')}
                    </button>
                    <div className="flex justify-center gap-4 mb-6">
                        <button onClick={() => setShowLegal('privacy')} className="text-[9px] text-slate-500 uppercase tracking-widest hover:text-purple-500 transition-colors font-black">{pt('privacy')}</button>
                        <span className="text-slate-700">•</span>
                        <button onClick={() => setShowLegal('terms')} className="text-[9px] text-slate-500 uppercase tracking-widest hover:text-purple-500 transition-colors font-black">{pt('terms')}</button>
                    </div>
                    <button onClick={() => setShowReportBug(true)} className="w-full py-3 mb-2 bg-transparent text-slate-400 hover:text-orange-500 rounded-2xl font-bold text-[9px] tracking-widest flex items-center justify-center gap-2 transition-all">
                        <i className="fas fa-bug"></i>{pt('reportBug')}
                    </button>
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
          onClose={() => setSelectedBadge(null)} 
          pt={pt}
        />,
        document.body
      )}

      {selectedVisa && ReactDOM.createPortal(
        <ShareableVisa 
          cityName={selectedVisa.city}
          milesEarned={0} // We don't have this in the stamp directly, could fetch if needed
          stampDate={selectedVisa.date ? new Date(selectedVisa.date).toLocaleDateString() : ''}
          rank={user.rank}
          onClose={() => setSelectedVisa(null)} 
          pt={pt}
        />,
        document.body
      )}

      {showLegal && ReactDOM.createPortal(
        <LegalModal type={showLegal} onClose={() => setShowLegal(null)} language={user.language || 'es'} />,
        document.body
      )}

      {showReportBug && ReactDOM.createPortal(
        <ReportBugModal onClose={() => setShowReportBug(false)} language={language || user.language || 'es'} />,
        document.body
      )}

      {showDeleteConfirm && ReactDOM.createPortal(
        <DeleteConfirmModal user={user} pt={pt} onCancel={() => setShowDeleteConfirm(false)} onConfirm={handleDeleteAccount} isDeleting={isDeleting} />,
        document.body
      )}
    </div>
  );
};

