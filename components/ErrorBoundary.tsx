import React from 'react';
import { ReportBugModal } from './ReportBugModal';
import { logAutoError } from '../services/errorService';

const TEXTS: Record<string, { title: string; subtitle: string; reload: string; addDetails: string }> = {
  es: { title: "Algo salió mal", subtitle: "DAI ha chocado contra algo inesperado. Ya hemos registrado el fallo automáticamente.", reload: "Recargar", addDetails: "Añadir detalles" },
  en: { title: "Something went wrong", subtitle: "DAI hit something unexpected. The crash has been logged automatically.", reload: "Reload", addDetails: "Add details" },
  fr: { title: "Une erreur est survenue", subtitle: "DAI a rencontré un problème inattendu. L'incident a été enregistré automatiquement.", reload: "Recharger", addDetails: "Ajouter des détails" },
  de: { title: "Etwas ist schiefgelaufen", subtitle: "DAI ist auf etwas Unerwartetes gestoßen. Der Absturz wurde automatisch protokolliert.", reload: "Neu laden", addDetails: "Details hinzufügen" },
  it: { title: "Qualcosa è andato storto", subtitle: "DAI ha incontrato un problema imprevisto. L'errore è stato registrato automaticamente.", reload: "Ricarica", addDetails: "Aggiungi dettagli" },
  pt: { title: "Algo deu errado", subtitle: "O DAI encontrou algo inesperado. O erro já foi registrado automaticamente.", reload: "Recarregar", addDetails: "Adicionar detalhes" },
  ro: { title: "Ceva a mers greșit", subtitle: "DAI a întâmpinat ceva neașteptat. Eroarea a fost înregistrată automat.", reload: "Reîncarcă", addDetails: "Adaugă detalii" },
  pl: { title: "Coś poszło nie tak", subtitle: "DAI napotkał coś nieoczekiwanego. Awaria została automatycznie zarejestrowana.", reload: "Odśwież", addDetails: "Dodaj szczegóły" },
  nl: { title: "Er is iets misgegaan", subtitle: "DAI is iets onverwachts tegengekomen. De crash is automatisch geregistreerd.", reload: "Herladen", addDetails: "Details toevoegen" },
  ru: { title: "Что-то пошло не так", subtitle: "DAI столкнулся с чем-то неожиданным. Сбой уже зарегистрирован автоматически.", reload: "Перезагрузить", addDetails: "Добавить подробности" },
  zh: { title: "出了点问题", subtitle: "DAI 遇到了意外情况。崩溃已自动记录。", reload: "重新加载", addDetails: "添加详情" },
  ja: { title: "問題が発生しました", subtitle: "DAIが予期しない問題に遭遇しました。エラーは自動的に記録されました。", reload: "再読み込み", addDetails: "詳細を追加" },
  ko: { title: "문제가 발생했습니다", subtitle: "DAI가 예기치 않은 문제에 부딪혔습니다. 오류는 자동으로 기록되었습니다.", reload: "새로고침", addDetails: "세부 정보 추가" },
  ar: { title: "حدث خطأ ما", subtitle: "واجه DAI شيئًا غير متوقع. تم تسجيل العطل تلقائيًا بالفعل.", reload: "إعادة التحميل", addDetails: "إضافة تفاصيل" },
  hi: { title: "कुछ गलत हो गया", subtitle: "DAI को कुछ अप्रत्याशित मिला। क्रैश स्वचालित रूप से लॉग कर दिया गया है।", reload: "पुनः लोड करें", addDetails: "विवरण जोड़ें" },
  tr: { title: "Bir şeyler yanlış gitti", subtitle: "DAI beklenmedik bir şeyle karşılaştı. Hata otomatik olarak kaydedildi.", reload: "Yeniden yükle", addDetails: "Ayrıntı ekle" },
  ca: { title: "Alguna cosa ha fallat", subtitle: "DAI ha xocat amb alguna cosa inesperada. Ja hem registrat l'error automàticament.", reload: "Recarrega", addDetails: "Afegeix detalls" },
  eu: { title: "Zerbait gaizki joan da", subtitle: "DAI-k ustekabeko zerbaitekin egin du topo. Erroreak automatikoki erregistratu dira.", reload: "Birkargatu", addDetails: "Xehetasunak gehitu" },
  vi: { title: "Đã xảy ra lỗi", subtitle: "DAI đã gặp phải điều gì đó không mong muốn. Sự cố đã được ghi lại tự động.", reload: "Tải lại", addDetails: "Thêm chi tiết" },
  th: { title: "มีบางอย่างผิดพลาด", subtitle: "DAI พบสิ่งที่ไม่คาดคิด ระบบได้บันทึกข้อผิดพลาดนี้โดยอัตโนมัติแล้ว", reload: "โหลดใหม่", addDetails: "เพิ่มรายละเอียด" }
};

interface ErrorBoundaryState {
  hasError: boolean;
  showReport: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  language?: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, showReport: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    // Auto-submit silencioso sin acción del usuario
    logAutoError({ error, componentStack: errorInfo.componentStack ?? undefined }).catch(() => {});
  }

  private buildAutoReport(): string {
    const { error, errorInfo } = this.state;
    return [
      `🔴 ERROR AUTOMÁTICO CAPTURADO`,
      `──────────────────────────────`,
      `Mensaje: ${error?.message || 'Desconocido'}`,
      ``,
      `Stack del componente:`,
      errorInfo?.componentStack?.trim() || 'No disponible',
      ``,
      `Stack técnico:`,
      error?.stack?.split('\n').slice(0, 6).join('\n') || 'No disponible',
      ``,
      `──────────────────────────────`,
      `URL: ${window.location.href}`,
      `Hora: ${new Date().toISOString()}`,
      `Agent: ${navigator.userAgent}`,
    ].join('\n');
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const lang = this.props.language || 'es';
    const t = TEXTS[lang] || TEXTS.en;

    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center p-8 z-[99999]">
        <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-red-500/20">
          <i className="fas fa-triangle-exclamation text-3xl text-red-500"></i>
        </div>
        <h1 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">
          {t.title}
        </h1>
        <p className="text-slate-500 text-xs text-center max-w-xs mb-8 leading-relaxed">
          {t.subtitle}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            <i className="fas fa-rotate-right mr-2"></i>
            {t.reload}
          </button>
          <button
            onClick={() => this.setState(s => ({ ...s, showReport: true }))}
            className="px-6 py-4 bg-red-600 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
          >
            <i className="fas fa-bug mr-2"></i>
            {t.addDetails}
          </button>
        </div>

        {this.state.showReport && (
          <ReportBugModal
            language={lang}
            prefillText={this.buildAutoReport()}
            onClose={() => this.setState(s => ({ ...s, showReport: false }))}
          />
        )}
      </div>
    );
  }
}
