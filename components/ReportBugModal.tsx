import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface ReportBugModalProps {
    onClose: () => void;
    language: string;
    prefillText?: string;
}

const BUG_TEXTS: Record<string, any> = {
    es: { title: "Reportar Error", desc: "Describe el problema que has encontrado. Tu reporte se enviará a ", placeholder: "¿Qué ha fallado? Ej: El mapa no carga...", cancel: "Cancelar", send: "Enviar", sentTitle: "¡Enviado!", sentDesc: "Gracias por ayudarnos a mejorar. Revisaremos tu reporte lo antes posible." },
    en: { title: "Report Bug", desc: "Describe the issue you found. Your report will be sent to ", placeholder: "What went wrong? Ex: The map is not loading...", cancel: "Cancel", send: "Send", sentTitle: "Sent!", sentDesc: "Thanks for helping us improve. We will review your report as soon as possible." },
    fr: { title: "Signaler un Bug", desc: "Décrivez le problème rencontré. Votre rapport sera envoyé à ", placeholder: "Qu'est-ce qui s'est passé? Ex: La carte ne charge pas...", cancel: "Annuler", send: "Envoyer", sentTitle: "Envoyé!", sentDesc: "Merci de nous aider à nous améliorer. Nous examinerons votre rapport dès que possible." },
    de: { title: "Fehler melden", desc: "Beschreiben Sie das gefundene Problem. Ihr Bericht wird gesendet an ", placeholder: "Was ist schiefgelaufen? Bsp: Die Karte lädt nicht...", cancel: "Abbrechen", send: "Senden", sentTitle: "Gesendet!", sentDesc: "Danke für Ihre Hilfe. Wir werden Ihren Bericht so schnell wie möglich prüfen." },
    it: { title: "Segnala un Bug", desc: "Descrivi il problema trovato. Il tuo report verrà inviato a ", placeholder: "Cosa è andato storto? Es: La mappa non carica...", cancel: "Annulla", send: "Invia", sentTitle: "Inviato!", sentDesc: "Grazie per aiutarci a migliorare. Esamineremo il tuo report il prima possibile." },
    pt: { title: "Reportar Erro", desc: "Descreva o problema encontrado. O seu relatório será enviado para ", placeholder: "O que correu mal? Ex: O mapa não carrega...", cancel: "Cancelar", send: "Enviar", sentTitle: "Enviado!", sentDesc: "Obrigado por nos ajudar a melhorar. Iremos rever o seu relatório o mais brevemente possível." },
    ro: { title: "Raportați o Eroare", desc: "Descrieți problema găsită. Raportul dvs. va fi trimis la ", placeholder: "Ce nu a funcționat? Ex: Harta nu se încarcă...", cancel: "Anulare", send: "Trimite", sentTitle: "Trimis!", sentDesc: "Vă mulțumim că ne ajutați să ne îmbunătățim. Vom revizui raportul dvs. cât mai curând posibil." },
    ru: { title: "Сообщить об ошибке", desc: "Опишите найденную проблему. Ваш отчёт будет отправлен на ", placeholder: "Что пошло не так? Пример: Карта не загружается...", cancel: "Отмена", send: "Отправить", sentTitle: "Отправлено!", sentDesc: "Спасибо за помощь. Мы рассмотрим ваш отчёт как можно скорее." },
    ar: { title: "الإبلاغ عن خطأ", desc: "صف المشكلة التي وجدتها. سيتم إرسال تقريرك إلى ", placeholder: "ما الذي حدث؟ مثال: الخريطة لا تحمّل...", cancel: "إلغاء", send: "إرسال", sentTitle: "تم الإرسال!", sentDesc: "شكراً لمساعدتنا في التحسين. سنراجع تقريرك في أقرب وقت ممكن." },
    zh: { title: "报告错误", desc: "描述您发现的问题。您的报告将发送至 ", placeholder: "出了什么问题？例如：地图无法加载...", cancel: "取消", send: "发送", sentTitle: "已发送！", sentDesc: "感谢您帮助我们改进。我们将尽快审查您的报告。" },
    ja: { title: "バグを報告", desc: "見つけた問題を説明してください。レポートは以下に送信されます ", placeholder: "何が問題でしたか？例：マップが読み込まれない...", cancel: "キャンセル", send: "送信", sentTitle: "送信されました！", sentDesc: "改善にご協力いただきありがとうございます。できる限り早くレポートを確認します。" },
    ko: { title: "버그 신고", desc: "발견한 문제를 설명해 주세요. 보고서가 다음으로 전송됩니다 ", placeholder: "무엇이 잘못되었나요? 예: 지도가 로드되지 않습니다...", cancel: "취소", send: "전송", sentTitle: "전송되었습니다!", sentDesc: "개선에 도움을 주셔서 감사합니다. 가능한 빨리 보고서를 검토하겠습니다." },
    hi: { title: "बग रिपोर्ट करें", desc: "मिली समस्या का वर्णन करें। आपकी रिपोर्ट भेजी जाएगी ", placeholder: "क्या गलत हुआ? उदा: नक्शा लोड नहीं हो रहा...", cancel: "रद्द करें", send: "भेजें", sentTitle: "भेज दिया!", sentDesc: "हमें बेहतर बनाने में मदद के लिए धन्यवाद। हम जल्द से जल्द आपकी रिपोर्ट की समीक्षा करेंगे।" },
    tr: { title: "Hata Bildir", desc: "Bulduğunuz sorunu açıklayın. Raporunuz şuraya gönderilecek ", placeholder: "Ne yanlış gitti? Örn: Harita yüklenmiyor...", cancel: "İptal", send: "Gönder", sentTitle: "Gönderildi!", sentDesc: "Gelişmemize yardımcı olduğunuz için teşekkürler. Raporunuzu en kısa sürede inceleyeceğiz." },
    nl: { title: "Fout melden", desc: "Beschrijf het gevonden probleem. Uw rapport wordt verzonden naar ", placeholder: "Wat ging er mis? Bijv: De kaart laadt niet...", cancel: "Annuleren", send: "Verzenden", sentTitle: "Verzonden!", sentDesc: "Bedankt voor uw hulp. We zullen uw rapport zo snel mogelijk bekijken." },
    pl: { title: "Zgłoś błąd", desc: "Opisz znaleziony problem. Twój raport zostanie wysłany do ", placeholder: "Co poszło nie tak? Np: Mapa się nie ładuje...", cancel: "Anuluj", send: "Wyślij", sentTitle: "Wysłano!", sentDesc: "Dziękujemy za pomoc w ulepszaniu. Przejrzymy raport tak szybko, jak to możliwe." },
    ca: { title: "Informar d'un Error", desc: "Descriu el problema trobat. El teu informe s'enviarà a ", placeholder: "Què ha fallat? Ex: El mapa no carrega...", cancel: "Cancel·lar", send: "Enviar", sentTitle: "Enviat!", sentDesc: "Gràcies per ajudar-nos a millorar. Revisarem el teu informe tan aviat com sigui possible." },
    eu: { title: "Akatsa Jakinarazi", desc: "Aurkitutako arazoa deskribatu. Zure txostena honetara bidaliko da ", placeholder: "Zer joan da gaizki? Adib: Mapa ez da kargatzen...", cancel: "Utzi", send: "Bidali", sentTitle: "Bidalita!", sentDesc: "Eskerrik asko hobetzen laguntzeagatik. Zure txostena ahalik eta lasterren aztertuko dugu." },
    vi: { title: "Báo cáo lỗi", desc: "Mô tả vấn đề bạn tìm thấy. Báo cáo của bạn sẽ được gửi tới ", placeholder: "Điều gì đã xảy ra? Ví dụ: Bản đồ không tải...", cancel: "Hủy", send: "Gửi", sentTitle: "Đã gửi!", sentDesc: "Cảm ơn bạn đã giúp chúng tôi cải thiện. Chúng tôi sẽ xem xét báo cáo của bạn sớm nhất có thể." },
    th: { title: "รายงานปัญหา", desc: "อธิบายปัญหาที่พบ รายงานของคุณจะถูกส่งไปยัง ", placeholder: "เกิดอะไรขึ้น? เช่น: แผนที่ไม่โหลด...", cancel: "ยกเลิก", send: "ส่ง", sentTitle: "ส่งแล้ว!", sentDesc: "ขอบคุณที่ช่วยเราปรับปรุง เราจะตรวจสอบรายงานของคุณโดยเร็วที่สุด" }
};

const getText = (lang: string) => BUG_TEXTS[lang] || BUG_TEXTS['en'];

export const ReportBugModal: React.FC<ReportBugModalProps> = ({ onClose, language, prefillText }) => {
    const [text, setText] = useState(prefillText || '');
    const [sent, setSent] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const t = getText(language);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const { error } = await supabase.from('bug_reports').insert([{ description: text, language }]);
            if (!error) { setSent(true); setTimeout(onClose, 2500); }
        } catch (error) {
            console.error("Error sending bug report:", error);
        } finally { setIsSending(false); }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 border border-slate-700">
                {sent ? (
                    <div className="text-center py-8 animate-fade-in">
                        <i className="fas fa-check-circle text-5xl text-emerald-500 mb-4"></i>
                        <h3 className="text-white font-black uppercase tracking-widest text-lg mb-2">{t.sentTitle}</h3>
                        <p className="text-slate-400 text-xs leading-relaxed">{t.sentDesc}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col animate-fade-in">
                        <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 text-red-500 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <i className="fas fa-bug text-2xl"></i>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">{t.title}</h3>
                        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                            {t.desc}<span className="text-purple-400 font-bold">support@bdai.travel</span>
                        </p>
                        <textarea
                            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white text-sm mb-6 h-32 resize-none focus:outline-none focus:border-purple-500 transition-colors placeholder:text-slate-600"
                            placeholder={t.placeholder}
                            value={text}
                            onChange={e => setText(e.target.value)}
                            required
                        />
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} disabled={isSending} className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-300 font-black uppercase text-[10px] tracking-widest hover:bg-slate-700 transition-colors active:scale-95">
                                {t.cancel}
                            </button>
                            <button type="submit" disabled={isSending || !text.trim()} className="flex-1 py-4 rounded-2xl bg-purple-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-purple-500/30 hover:bg-purple-500 transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSending ? <i className="fas fa-circle-notch fa-spin"></i> : t.send}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};
