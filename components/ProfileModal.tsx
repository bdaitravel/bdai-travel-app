import ReactDOM from 'react-dom';
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, LANGUAGES, AVATARS, APP_BADGES } from '../types';
import { syncUserProfile, supabase } from '../services/supabaseClient';
import { translations } from '../data/translations';
import { LegalModal } from './LegalModal';
import { ReportBugModal } from './ReportBugModal';
import { ShareableBadge } from './ShareableBadge';
import { VisaShare } from './VisaShare';

interface ProfileModalProps {
  user: UserProfile;
  onClose: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  language?: string;
  onLangChange?: (code: string) => void;
  onNavigateToCity?: (cityName: string, country: string) => void;
}

const MODAL_TEXTS: any = {
    es: { title: "Pasaporte Global bdai", subtitle: "Nómada Digital ID", surname: "Apellidos", givenNames: "Nombres", city: "Ciudad", country: "País", age: "Edad", birthday: "Nacimiento", save: "Guardar", edit: "Editar", logout: "Cerrar Sesión", stamps: "Mis Visados", badges: "Insignias", langLabel: "Idioma", rank: "RANGO", miles: "MILLAS", admin: "ADMIN", streak: "Racha", changeAvatar: "Cambiar Foto", email: "Correo Electrónico", reportBug: "Reportar Error", privacy: "Privacidad", terms: "Términos", deleteAccount: "Eliminar Cuenta (GDPR)", deleteConfirmTitle: "⚠️ ZONA DE PELIGRO", deleteConfirmText: "Esta acción es IRREVERSIBLE. Perderás todas tus millas, visados, insignias e historial para siempre.", deleteConfirmInstruction: "Escribe tu email para confirmar:", deleteConfirmPlaceholder: "tu@email.com", deleteConfirmCancel: "Cancelar", deleteConfirmYes: "Eliminar permanentemente", deleting: "Borrando...", deleteCountdown: "Espera {n}s...", deleteEmailMismatch: "El email no coincide", rankBadges: "Rangos", achievementBadges: "Logros", returnToCity: "Volver a la ciudad", shareVisa: "Compartir Visado" },
    en: { title: "bdai Global Passport", subtitle: "Digital Nomad ID", surname: "Surname", givenNames: "Given Names", city: "City", country: "Country", age: "Age", birthday: "Birthdate", save: "Save", edit: "Edit", logout: "Logout", stamps: "My Visas", badges: "Badges", langLabel: "Language", rank: "RANK", miles: "MILES", admin: "ADMIN", streak: "Streak", changeAvatar: "Change Photo", email: "Email Address", reportBug: "Report Bug", privacy: "Privacy", terms: "Terms", deleteAccount: "Delete Account (GDPR)", deleteConfirmTitle: "⚠️ DANGER ZONE", deleteConfirmText: "This action is IRREVERSIBLE. You will permanently lose all your miles, visas, badges and history.", deleteConfirmInstruction: "Type your email to confirm:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "Cancel", deleteConfirmYes: "Permanently delete", deleting: "Deleting...", deleteCountdown: "Wait {n}s...", deleteEmailMismatch: "Email doesn't match", rankBadges: "Ranks", achievementBadges: "Achievements", returnToCity: "Return to city", shareVisa: "Share Visa" },
    fr: { title: "Passeport Global bdai", subtitle: "ID Nomade Numérique", surname: "Nom", givenNames: "Prénoms", city: "Ville", country: "Pays", age: "Âge", birthday: "Naissance", save: "Enregistrer", edit: "Modifier", logout: "Déconnexion", stamps: "Mes Visas", badges: "Badges", langLabel: "Langue", rank: "RANG", miles: "MILES", admin: "ADMIN", streak: "Série", changeAvatar: "Changer Photo", email: "Adresse e-mail", reportBug: "Signaler un bug", privacy: "Confidentialité", terms: "Conditions", deleteAccount: "Supprimer le Compte (RGPD)", deleteConfirmTitle: "⚠️ ZONE DANGEREUSE", deleteConfirmText: "Cette action est IRRÉVERSIBLE.", deleteConfirmInstruction: "Tapez votre email pour confirmer:", deleteConfirmPlaceholder: "votre@email.com", deleteConfirmCancel: "Annuler", deleteConfirmYes: "Supprimer définitivement", deleting: "Suppression...", deleteCountdown: "Attendez {n}s...", deleteEmailMismatch: "L'email ne correspond pas", rankBadges: "Rangs", achievementBadges: "Succès", returnToCity: "Retour à la ville", shareVisa: "Partager Visa" },
    de: { title: "bdai Globaler Pass", subtitle: "Digital Nomad ID", surname: "Nachname", givenNames: "Vornamen", city: "Stadt", country: "Land", age: "Alter", birthday: "Geburtstag", save: "Speichern", edit: "Bearbeiten", logout: "Abmelden", stamps: "Meine Visa", badges: "Abzeichen", langLabel: "Sprache", rank: "RANG", miles: "MEILEN", admin: "ADMIN", streak: "Serie", changeAvatar: "Foto ändern", email: "E-Mail-Adresse", reportBug: "Fehler melden", privacy: "Datenschutz", terms: "Nutzungsbedingungen", deleteAccount: "Konto löschen (DSGVO)", deleteConfirmTitle: "⚠️ GEFAHRENZONE", deleteConfirmText: "Diese Aktion ist UNWIDERRUFLICH.", deleteConfirmInstruction: "E-Mail zur Bestätigung eingeben:", deleteConfirmPlaceholder: "ihre@email.com", deleteConfirmCancel: "Abbrechen", deleteConfirmYes: "Dauerhaft löschen", deleting: "Löschen...", deleteCountdown: "Warten {n}s...", deleteEmailMismatch: "E-Mail stimmt nicht überein", rankBadges: "Ränge", achievementBadges: "Erfolge", returnToCity: "Zur Stadt", shareVisa: "Visum teilen" },
    it: { title: "Passaporto Globale bdai", subtitle: "ID Nomade Digitale", surname: "Cognome", givenNames: "Nomi", city: "Città", country: "Paese", age: "Età", birthday: "F. Nascita", save: "Salva", edit: "Modifica", logout: "Esci", stamps: "I Miei Visti", badges: "Distintivi", langLabel: "Lingua", rank: "RANGO", miles: "MIGLIA", admin: "ADMIN", streak: "Serie", changeAvatar: "Cambia Foto", email: "Indirizzo email", reportBug: "Segnala un bug", privacy: "Privacy", terms: "Termini", deleteAccount: "Elimina Account (GDPR)", deleteConfirmTitle: "⚠️ ZONA PERICOLOSA", deleteConfirmText: "Questa azione è IRREVERSIBILE.", deleteConfirmInstruction: "Digita la tua email per confermare:", deleteConfirmPlaceholder: "tua@email.com", deleteConfirmCancel: "Annulla", deleteConfirmYes: "Elimina definitivamente", deleting: "Eliminazione...", deleteCountdown: "Aspetta {n}s...", deleteEmailMismatch: "L'email non corrisponde", rankBadges: "Ranghi", achievementBadges: "Successi", returnToCity: "Torna alla città", shareVisa: "Condividi Visto" },
    pt: { title: "Passaporte Global bdai", subtitle: "ID Nómada Digital", surname: "Apelido", givenNames: "Nomes", city: "Cidade", country: "País", age: "Idade", birthday: "Nascimento", save: "Guardar", edit: "Editar", logout: "Sair", stamps: "Meus Vistos", badges: "Distintivos", langLabel: "Idioma", rank: "RANKING", miles: "MILHAS", admin: "ADMIN", streak: "Sequência", changeAvatar: "Mudar Foto", email: "Endereço de email", reportBug: "Reportar Erro", privacy: "Privacidade", terms: "Termos", deleteAccount: "Eliminar Conta (RGPD)", deleteConfirmTitle: "⚠️ ZONA DE PERIGO", deleteConfirmText: "Esta ação é IRREVERSÍVEL.", deleteConfirmInstruction: "Escreva o seu email para confirmar:", deleteConfirmPlaceholder: "seu@email.com", deleteConfirmCancel: "Cancelar", deleteConfirmYes: "Eliminar permanentemente", deleting: "Eliminando...", deleteCountdown: "Aguarde {n}s...", deleteEmailMismatch: "O email não corresponde", rankBadges: "Ranks", achievementBadges: "Conquistas", returnToCity: "Voltar à cidade", shareVisa: "Partilhar Visto" },
    ro: { title: "Pașaport Global bdai", subtitle: "ID Nomad Digital", surname: "Nume", givenNames: "Prenume", city: "Oraș", country: "Țară", age: "Vârstă", birthday: "Naștere", save: "Salvare", edit: "Editare", logout: "Deconectare", stamps: "Vizele Mele", badges: "Insigne", langLabel: "Limbă", rank: "RANG", miles: "MILE", admin: "ADMIN", streak: "Serie", changeAvatar: "Schimbă Foto", email: "Adresă email", reportBug: "Raportează o eroare", privacy: "Confidențialitate", terms: "Termeni", deleteAccount: "Șterge Contul (GDPR)", deleteConfirmTitle: "⚠️ ZONĂ PERICULOASĂ", deleteConfirmText: "Această acțiune este IREVERSIBILĂ.", deleteConfirmInstruction: "Introduceți emailul pentru confirmare:", deleteConfirmPlaceholder: "email@tau.com", deleteConfirmCancel: "Anulare", deleteConfirmYes: "Șterge definitiv", deleting: "Ștergere...", deleteCountdown: "Așteptați {n}s...", deleteEmailMismatch: "Emailul nu se potrivește", rankBadges: "Ranguri", achievementBadges: "Realizări", returnToCity: "Înapoi la oraș", shareVisa: "Distribuie Viza" },
    ru: { title: "Глобальный паспорт bdai", subtitle: "ID кочевника", surname: "Фамилия", givenNames: "Имя", city: "Город", country: "Страна", age: "Возраст", birthday: "Рождение", save: "Сохранить", edit: "Править", logout: "Выйти", stamps: "Визы", badges: "Значки", langLabel: "Язык", rank: "РАНГ", miles: "МИЛИ", admin: "АДМИН", streak: "Серия", changeAvatar: "Сменить фото", email: "Электронная почта", reportBug: "Сообщить об ошибке", privacy: "Конфиденциальность", terms: "Условия", deleteAccount: "Удалить Аккаунт (GDPR)", deleteConfirmTitle: "⚠️ ОПАСНАЯ ЗОНА", deleteConfirmText: "Это действие НЕОБРАТИМО.", deleteConfirmInstruction: "Введите email для подтверждения:", deleteConfirmPlaceholder: "ваш@email.com", deleteConfirmCancel: "Отмена", deleteConfirmYes: "Удалить навсегда", deleting: "Удаление...", deleteCountdown: "Подождите {n}с...", deleteEmailMismatch: "Email не совпадает", rankBadges: "Ранги", achievementBadges: "Достижения", returnToCity: "Вернуться в город", shareVisa: "Поделиться Визой" },
    ar: { title: "جواز سفر bdai العالمي", subtitle: "هوية البدوي الرقمي", surname: "اللقب", givenNames: "الأسماء", city: "المدينة", country: "البلد", age: "العمر", birthday: "الميلاد", save: "حفظ", edit: "تعديل", logout: "خروج", stamps: "تأشيراتي", badges: "الأوسمة", langLabel: "اللغة", rank: "الرتبة", miles: "الأميال", admin: "مسؤول", streak: "سلسلة", changeAvatar: "تغيير الصورة", email: "البريد الإلكتروني", reportBug: "الإبلاغ عن خطأ", privacy: "الخصوصية", terms: "الشروط", deleteAccount: "حذف الحساب (GDPR)", deleteConfirmTitle: "⚠️ منطقة الخطر", deleteConfirmText: "هذا الإجراء لا رجعة فيه.", deleteConfirmInstruction: "اكتب بريدك الإلكتروني للتأكيد:", deleteConfirmPlaceholder: "بريدك@email.com", deleteConfirmCancel: "إلغاء", deleteConfirmYes: "حذف نهائياً", deleting: "جارٍ الحذف...", deleteCountdown: "انتظر {n}ث...", deleteEmailMismatch: "البريد الإلكتروني لا يتطابق", rankBadges: "الرتب", achievementBadges: "الإنجازات", returnToCity: "العودة إلى المدينة", shareVisa: "مشاركة التأشيرة" },
    zh: { title: "bdai 全球护照", subtitle: "数字游民 ID", surname: "姓", givenNames: "名", city: "城市", country: "国家", age: "年龄", birthday: "生日", save: "保存", edit: "编辑", logout: "登出", stamps: "我的签证", badges: "奖章", langLabel: "语言", rank: "等级", miles: "里程", admin: "管理", streak: "连续", changeAvatar: "更换照片", email: "电子邮件", reportBug: "报告错误", privacy: "隐私", terms: "条款", deleteAccount: "删除账户 (GDPR)", deleteConfirmTitle: "⚠️ 危险区域", deleteConfirmText: "此操作不可逆。", deleteConfirmInstruction: "输入您的邮箱以确认:", deleteConfirmPlaceholder: "您的@邮箱.com", deleteConfirmCancel: "取消", deleteConfirmYes: "永久删除", deleting: "删除中...", deleteCountdown: "等待 {n}秒...", deleteEmailMismatch: "邮箱不匹配", rankBadges: "等级", achievementBadges: "成就", returnToCity: "返回城市", shareVisa: "分享签证" },
    ja: { title: "bdai パスポート", subtitle: "デジタルノマド ID", surname: "姓", givenNames: "名", city: "都市", country: "国", age: "年齢", birthday: "誕生日", save: "保存", edit: "編集", logout: "ログアウト", stamps: "ビザ", badges: "バッジ", langLabel: "言語", rank: "ランク", miles: "マイル", admin: "管理", streak: "記録", changeAvatar: "写真変更", email: "メールアドレス", reportBug: "バグを報告", privacy: "プライバシー", terms: "利用規約", deleteAccount: "アカウント削除 (GDPR)", deleteConfirmTitle: "⚠️ 危険ゾーン", deleteConfirmText: "この操作は元に戻せません。", deleteConfirmInstruction: "確認のためメールアドレスを入力:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "キャンセル", deleteConfirmYes: "完全に削除する", deleting: "削除中...", deleteCountdown: "{n}秒待機中...", deleteEmailMismatch: "メールアドレスが一致しません", rankBadges: "ランク", achievementBadges: "実績", returnToCity: "都市に戻る", shareVisa: "ビザをシェア" },
    ko: { title: "bdai 글로벌 여권", subtitle: "디지털 노마드 ID", surname: "성", givenNames: "이름", city: "도시", country: "국가", age: "나이", birthday: "생일", save: "저장", edit: "편집", logout: "로그아웃", stamps: "내 비자", badges: "배지", langLabel: "언어", rank: "등급", miles: "마일", admin: "관리자", streak: "연속", changeAvatar: "사진 변경", email: "이메일 주소", reportBug: "버그 신고", privacy: "개인정보", terms: "이용약관", deleteAccount: "계정 삭제 (GDPR)", deleteConfirmTitle: "⚠️ 위험 구역", deleteConfirmText: "이 작업은 되돌릴 수 없습니다.", deleteConfirmInstruction: "확인을 위해 이메일을 입력하세요:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "취소", deleteConfirmYes: "영구 삭제", deleting: "삭제 중...", deleteCountdown: "{n}초 대기...", deleteEmailMismatch: "이메일이 일치하지 않습니다", rankBadges: "등급", achievementBadges: "업적", returnToCity: "도시로 돌아가기", shareVisa: "비자 공유" },
    hi: { title: "bdai वैश्विक पासपोर्ट", subtitle: "डिजिटल घुमंतू आईडी", surname: "उपनाम", givenNames: "नाम", city: "शहर", country: "देश", age: "आयु", birthday: "जन्मदिन", save: "सहेजें", edit: "संपादित करें", logout: "लॉगआउट", stamps: "मेरे वीजा", badges: "बैज", langLabel: "भाषा", rank: "रैंक", miles: "मील", admin: "व्यवस्थापक", streak: "लगातार", changeAvatar: "फोटो बदलें", email: "ईमेल पता", reportBug: "बग की रिपोर्ट करें", privacy: "गोपनीयता", terms: "नियम", deleteAccount: "खाता हटाएं (GDPR)", deleteConfirmTitle: "⚠️ खतरा क्षेत्र", deleteConfirmText: "यह क्रिया अपरिवर्तनीय है।", deleteConfirmInstruction: "पुष्टि के लिए अपना ईमेल लिखें:", deleteConfirmPlaceholder: "आपका@ईमेल.com", deleteConfirmCancel: "रद्द करें", deleteConfirmYes: "स्थायी रूप से हटाएं", deleting: "हटाया जा रहा है...", deleteCountdown: "{n}s प्रतीक्षा करें...", deleteEmailMismatch: "ईमेल मेल नहीं खाता", rankBadges: "रैंक", achievementBadges: "उपलब्धियां", returnToCity: "शहर वापस जाएं", shareVisa: "वीज़ा शेयर करें" },
    tr: { title: "bdai Küresel Pasaport", subtitle: "Dijital Nomad Kimliği", surname: "Soyadı", givenNames: "İsimler", city: "Şehir", country: "Ülke", age: "Yaş", birthday: "Doğum", save: "Kaydet", edit: "Düzenle", logout: "Çıkış", stamps: "Vizelerim", badges: "Rozetler", langLabel: "Dil", rank: "RÜTBE", miles: "MİLLER", admin: "YÖNETİCİ", streak: "Seri", changeAvatar: "Fotoğraf Değiştir", email: "E-posta adresi", reportBug: "Hata Bildir", privacy: "Gizlilik", terms: "Koşullar", deleteAccount: "Hesabı Sil (GDPR)", deleteConfirmTitle: "⚠️ TEHLİKE BÖLGESİ", deleteConfirmText: "Bu işlem GERİ ALINAMAZ.", deleteConfirmInstruction: "Onaylamak için e-postanızı yazın:", deleteConfirmPlaceholder: "sizin@email.com", deleteConfirmCancel: "İptal", deleteConfirmYes: "Kalıcı olarak sil", deleting: "Siliniyor...", deleteCountdown: "{n}s bekleyin...", deleteEmailMismatch: "E-posta eşleşmiyor", rankBadges: "Rütbeler", achievementBadges: "Başarılar", returnToCity: "Şehre dön", shareVisa: "Vize paylaş" },
    nl: { title: "bdai Globaal Paspoort", subtitle: "Digital Nomad ID", surname: "Achternaam", givenNames: "Voornamen", city: "Stad", country: "Land", age: "Leeftijd", birthday: "Geboortedatum", save: "Opslaan", edit: "Bewerken", logout: "Uitloggen", stamps: "Mijn Visa", badges: "Badges", langLabel: "Taal", rank: "RANG", miles: "MIJL", admin: "ADMIN", streak: "Reeks", changeAvatar: "Foto wijzigen", email: "E-mailadres", reportBug: "Fout melden", privacy: "Privacy", terms: "Voorwaarden", deleteAccount: "Account verwijderen (GDPR)", deleteConfirmTitle: "⚠️ GEVARENZONE", deleteConfirmText: "Deze actie is ONOMKEERBAAR.", deleteConfirmInstruction: "Typ uw e-mail ter bevestiging:", deleteConfirmPlaceholder: "uw@email.com", deleteConfirmCancel: "Annuleren", deleteConfirmYes: "Permanent verwijderen", deleting: "Verwijderen...", deleteCountdown: "Wacht {n}s...", deleteEmailMismatch: "E-mail komt niet overeen", rankBadges: "Rangen", achievementBadges: "Prestaties", returnToCity: "Terug naar stad", shareVisa: "Visum delen" },
    pl: { title: "Globalny Paszport bdai", subtitle: "ID Nomady", surname: "Nazwisko", givenNames: "Imiona", city: "Miasto", country: "Kraj", age: "Wiek", birthday: "Data urodzenia", save: "Zapisz", edit: "Edytuj", logout: "Wyloguj", stamps: "Wizy", badges: "Odznaki", langLabel: "Język", rank: "RANGA", miles: "MILE", admin: "ADMIN", streak: "Seria", changeAvatar: "Zmień zdjęcie", email: "Adres e-mail", reportBug: "Zgłoś błąd", privacy: "Prywatność", terms: "Warunki", deleteAccount: "Usuń Konto (RODO)", deleteConfirmTitle: "⚠️ STREFA ZAGROŻENIA", deleteConfirmText: "Ta akcja jest NIEODWRACALNA.", deleteConfirmInstruction: "Wpisz swój email, aby potwierdzić:", deleteConfirmPlaceholder: "twoj@email.com", deleteConfirmCancel: "Anuluj", deleteConfirmYes: "Usuń trwale", deleting: "Usuwanie...", deleteCountdown: "Poczekaj {n}s...", deleteEmailMismatch: "Email nie pasuje", rankBadges: "Rangi", achievementBadges: "Osiągnięcia", returnToCity: "Wróć do miasta", shareVisa: "Udostępnij wizę" },
    ca: { title: "Passaport Global bdai", subtitle: "ID Nòmada Digital", surname: "Cognoms", givenNames: "Noms", city: "Ciutat", country: "País", age: "Edat", birthday: "Naixement", save: "Desar", edit: "Editar", logout: "Sortir", stamps: "Els Meus Visats", badges: "Insígnies", langLabel: "Idioma", rank: "RANG", miles: "MILLES", admin: "ADMIN", streak: "Ratxa", changeAvatar: "Canviar Foto", email: "Adreça de correu", reportBug: "Informar d'un error", privacy: "Privacitat", terms: "Termes", deleteAccount: "Eliminar Compte (RGPD)", deleteConfirmTitle: "⚠️ ZONA DE PERILL", deleteConfirmText: "Aquesta acció és IRREVERSIBLE.", deleteConfirmInstruction: "Escriu el teu email per confirmar:", deleteConfirmPlaceholder: "el@teu.email", deleteConfirmCancel: "Cancel·lar", deleteConfirmYes: "Eliminar permanentment", deleting: "Eliminant...", deleteCountdown: "Espera {n}s...", deleteEmailMismatch: "L'email no coincideix", rankBadges: "Rangs", achievementBadges: "Assoliments", returnToCity: "Tornar a la ciutat", shareVisa: "Compartir Visat" },
    eu: { title: "bdai Pasaporte Globala", subtitle: "ID Nomada Digitala", surname: "Abizenak", givenNames: "Izenak", city: "Hiria", country: "Herrialdea", age: "Adina", birthday: "Jaioteguna", save: "Gorde", edit: "Editatu", logout: "Saioa Itxi", stamps: "Nire Visatuak", badges: "Intsigniak", langLabel: "Hizkuntza", rank: "MAILA", miles: "MILIAK", admin: "ADMIN", streak: "Segida", changeAvatar: "Argazkia Aldatu", email: "Helbide elektronikoa", reportBug: "Akatsa jakinarazi", privacy: "Pribatutasuna", terms: "Baldintzak", deleteAccount: "Kontua Ezabatu (DBEO)", deleteConfirmTitle: "⚠️ ARRISKU EREMUA", deleteConfirmText: "Ekintza hau ITZULEZINA da.", deleteConfirmInstruction: "Idatzi zure emaila baieztatzeko:", deleteConfirmPlaceholder: "zure@emaila.com", deleteConfirmCancel: "Utzi", deleteConfirmYes: "Behin betiko ezabatu", deleting: "Ezabatzen...", deleteCountdown: "Itxaron {n}s...", deleteEmailMismatch: "Emaila ez dator bat", rankBadges: "Mailak", achievementBadges: "Lorpenak", returnToCity: "Hirira itzuli", shareVisa: "Bisa partekatu" },
    vi: { title: "Hộ chiếu Toàn cầu bdai", subtitle: "ID Du mục", surname: "Họ", givenNames: "Tên", city: "Thành phố", country: "Quốc gia", age: "Tuổi", birthday: "Ngày sinh", save: "Lưu", edit: "Chỉnh sửa", logout: "Đăng xuất", stamps: "Thị thực", badges: "Huy hiệu", langLabel: "Ngôn ngữ", rank: "CẤP BẬC", miles: "DẶM", admin: "QUẢN TRỊ", streak: "Chuỗi", changeAvatar: "Đổi ảnh", email: "Địa chỉ email", reportBug: "Báo cáo lỗi", privacy: "Quyền riêng tư", terms: "Điều khoản", deleteAccount: "Xóa Tài Khoản (GDPR)", deleteConfirmTitle: "⚠️ VÙNG NGUY HIỂM", deleteConfirmText: "Hành động này KHÔNG THỂ HOÀN TÁC.", deleteConfirmInstruction: "Nhập email của bạn để xác nhận:", deleteConfirmPlaceholder: "email@cua.ban", deleteConfirmCancel: "Hủy", deleteConfirmYes: "Xóa vĩnh viễn", deleting: "Đang xóa...", deleteCountdown: "Chờ {n}s...", deleteEmailMismatch: "Email không khớp", rankBadges: "Cấp bậc", achievementBadges: "Thành tích", returnToCity: "Quay lại thành phố", shareVisa: "Chia sẻ Thị thực" },
    th: { title: "พาสปอร์ตทั่วโลก bdai", subtitle: "รหัสนักเดินทาง", surname: "นามสกุล", givenNames: "ชื่อ", city: "เมือง", country: "ประเทศ", age: "อายุ", birthday: "วันเกิด", save: "บันทึก", edit: "แก้ไข", logout: "ออก", stamps: "วีซ่า", badges: "เหรียญตรา", langLabel: "ภาษา", rank: "อันดับ", miles: "ไมล์", admin: "ผู้ดูแล", streak: "สถิติ", changeAvatar: "เปลี่ยนรูป", email: "ที่อยู่อีเมล", reportBug: "รายงานปัญหา", privacy: "ความเป็นส่วนตัว", terms: "ข้อกำหนด", deleteAccount: "ลบบัญชี (GDPR)", deleteConfirmTitle: "⚠️ เขตอันตราย", deleteConfirmText: "การกระทำนี้ไม่สามารถยกเลิกได้", deleteConfirmInstruction: "พิมพ์อีเมลของคุณเพื่อยืนยัน:", deleteConfirmPlaceholder: "your@email.com", deleteConfirmCancel: "ยกเลิก", deleteConfirmYes: "ลบถาวร", deleting: "กำลังลบ...", deleteCountdown: "รอ {n}s...", deleteEmailMismatch: "อีเมลไม่ตรงกัน", rankBadges: "อันดับ", achievementBadges: "ความสำเร็จ", returnToCity: "กลับไปที่เมือง", shareVisa: "แชร์วีซ่า" }
};

// IDs of rank-type badges
const RANK_BADGE_IDS = ['badge_zero', 'badge_scout', 'badge_rover', 'badge_titan', 'badge_zenith'];

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

export const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose, onUpdateUser, onLogout, onOpenAdmin, language, onLangChange, onNavigateToCity }) => {
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

  const pt = (key: string) => {
    const lang = user.language || 'es';
    const dict = MODAL_TEXTS[lang] || MODAL_TEXTS['en'];
    const globalDict = translations[lang] || translations['en'];
    return dict[key] || globalDict[key] || key;
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


