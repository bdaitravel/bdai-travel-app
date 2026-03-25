import React from 'react';
import { ReportBugModal } from './ReportBugModal';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  language?: string;
}

/**
 * Captura errores de renderizado de React y muestra una pantalla de fallback
 * con el botón de "Reportar Error" ya relleno con los detalles del fallo.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  private buildAutoReport(): string {
    const { error, errorInfo } = this.state;
    const lines: string[] = [
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
    ];
    return lines.join('\n');
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const lang = this.props.language || 'es';

    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center p-8 z-[99999]">
        <div className="w-20 h-20 bg-red-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-red-500/20">
          <i className="fas fa-triangle-exclamation text-3xl text-red-500"></i>
        </div>
        <h1 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">
          {lang === 'es' ? 'Algo salió mal' : 'Something went wrong'}
        </h1>
        <p className="text-slate-500 text-xs text-center max-w-xs mb-8 leading-relaxed">
          {lang === 'es'
            ? 'DAI ha chocado contra algo inesperado. Recarga la app o reporta el fallo.'
            : "DAI hit something unexpected. Reload the app or report the issue."}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
          >
            <i className="fas fa-rotate-right mr-2"></i>
            {lang === 'es' ? 'Recargar' : 'Reload'}
          </button>
          <button
            onClick={() => this.setState(s => ({ ...s, showReport: true } as any))}
            className="px-6 py-4 bg-red-600 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
          >
            <i className="fas fa-bug mr-2"></i>
            {lang === 'es' ? 'Reportar fallo' : 'Report bug'}
          </button>
        </div>

        {(this.state as any).showReport && (
          <ReportBugModal
            language={lang}
            prefillText={this.buildAutoReport()}
            onClose={() => this.setState(s => ({ ...s, showReport: false } as any))}
          />
        )}
      </div>
    );
  }
}
