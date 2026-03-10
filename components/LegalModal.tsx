import React, { useState } from 'react';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';
import { showToast } from '../services/errorService';

interface LegalModalProps {
  user: UserProfile;
  onClose: () => void;
  language?: string;
}

type LegalTab = 'privacy' | 'terms' | 'gdpr';

export const LegalModal: React.FC<LegalModalProps> = ({ user, onClose, language = 'es' }) => {
  const [tab, setTab] = useState<LegalTab>('privacy');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'BORRAR') {
      showToast.warning('Escribe BORRAR para confirmar');
      return;
    }
    setIsDeleting(true);
    try {
      // Borra datos del perfil en Supabase
      await supabase.from('profiles').delete().eq('email', user.email);
      await supabase.from('community_posts').delete().eq('user_email', user.email);
      await supabase.from('tours_cache').delete(); // No borramos cache global

      // Cierra sesión
      await supabase.auth.signOut();
      localStorage.clear();
      showToast.success('Cuenta eliminada', 'Tus datos han sido borrados.');
      onClose();
    } catch (e) {
      showToast.error('Error', 'No se pudo eliminar la cuenta. Contacta support@bdai.travel');
    } finally {
      setIsDeleting(false);
    }
  };

  const TABS: { id: LegalTab; label: string; icon: string }[] = [
    { id: 'privacy', label: 'Privacidad', icon: 'fa-shield-halved' },
    { id: 'terms',   label: 'Términos',   icon: 'fa-file-contract' },
    { id: 'gdpr',    label: 'Tus datos',  icon: 'fa-user-shield' },
  ];

  return (
    <div className="fixed inset-0 z-[9998] bg-slate-950/98 backdrop-blur-xl flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 pt-safe-iphone border-b border-white/5">
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center active:scale-90">
          <i className="fas fa-arrow-left text-xs"></i>
        </button>
        <div>
          <h2 className="text-base font-black uppercase tracking-tighter text-white">Legal & Privacidad</h2>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest">bdai · Better Destinations AI</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white/[0.02] border-b border-white/5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${
              tab === t.id ? 'text-purple-400 border-b-2 border-purple-500' : 'text-slate-600'
            }`}
          >
            <i className={`fas ${t.icon} text-xs`}></i>
            <span className="text-[8px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 py-6 space-y-6 text-slate-400 text-[12px] leading-relaxed">

        {tab === 'privacy' && (
          <>
            <Section title="Política de Privacidad" date="Última actualización: Enero 2025">
              <p>bdai (Better Destinations AI) es una aplicación desarrollada con el objetivo de democratizar el acceso a guías turísticas de alta calidad. Esta política explica cómo gestionamos tu información personal.</p>
            </Section>

            <Section title="Datos que recopilamos">
              <ul className="space-y-2">
                {[
                  ['Email', 'Para identificarte y enviarte tu código de acceso.'],
                  ['Ubicación GPS', 'Solo mientras usas la app, para mostrarte la distancia a las paradas.'],
                  ['Historial de tours', 'Para calcular tus millas y personalizar recomendaciones.'],
                  ['Fotos (opcional)', 'Solo si publicas en la comunidad. Las almacenamos en Supabase Storage.'],
                ].map(([key, val]) => (
                  <li key={key} className="flex gap-2"><span className="text-purple-400 font-black shrink-0">·</span><span><strong className="text-white">{key}:</strong> {val}</span></li>
                ))}
              </ul>
            </Section>

            <Section title="Cómo usamos tus datos">
              <p>Tus datos se usan exclusivamente para:</p>
              <ul className="space-y-1 mt-2">
                {['Personalizar los tours generados por IA', 'Calcular tu ranking y millas', 'Mostrarte contenido de la comunidad', 'Mejorar la experiencia de la app'].map(i => (
                  <li key={i} className="flex gap-2"><i className="fas fa-check text-emerald-500 text-[10px] mt-1 shrink-0"></i>{i}</li>
                ))}
              </ul>
              <p className="mt-3 text-slate-500">Nunca vendemos tus datos a terceros. Nunca.</p>
            </Section>

            <Section title="Servicios de terceros">
              <p>bdai usa los siguientes servicios externos:</p>
              <ul className="space-y-1 mt-2">
                {[
                  'Google Gemini AI — Generación de tours y audio',
                  'Supabase — Base de datos y autenticación',
                  'Vercel — Hosting de la aplicación',
                  'DiceBear — Avatares generados',
                  'FlagsAPI — Banderas de países',
                ].map(s => (
                  <li key={s} className="flex gap-2"><span className="text-purple-400 shrink-0">·</span>{s}</li>
                ))}
              </ul>
            </Section>

            <Section title="Contacto">
              <p>Para cualquier consulta sobre privacidad: <span className="text-purple-400">support@bdai.travel</span></p>
            </Section>
          </>
        )}

        {tab === 'terms' && (
          <>
            <Section title="Términos de Uso" date="Última actualización: Enero 2025">
              <p>Al usar bdai aceptas estos términos. Si no estás de acuerdo, por favor no uses la aplicación.</p>
            </Section>

            <Section title="Uso permitido">
              <ul className="space-y-1">
                {[
                  'Usar bdai para explorar ciudades y descubrir lugares de interés.',
                  'Compartir fotos y experiencias en la comunidad de forma respetuosa.',
                  'Guardar tours para uso personal offline.',
                ].map(i => (
                  <li key={i} className="flex gap-2"><i className="fas fa-check text-emerald-500 text-[10px] mt-1 shrink-0"></i>{i}</li>
                ))}
              </ul>
            </Section>

            <Section title="Uso prohibido">
              <ul className="space-y-1">
                {[
                  'Publicar contenido ofensivo, ilegal o spam en la comunidad.',
                  'Intentar acceder a datos de otros usuarios.',
                  'Usar la app para fines comerciales sin autorización.',
                  'Hacer scraping o uso automatizado de la API.',
                ].map(i => (
                  <li key={i} className="flex gap-2"><i className="fas fa-xmark text-red-500 text-[10px] mt-1 shrink-0"></i>{i}</li>
                ))}
              </ul>
            </Section>

            <Section title="Contenido generado por IA">
              <p>Los tours son generados por Google Gemini AI. bdai hace su mejor esfuerzo para garantizar la precisión, pero <strong className="text-white">no garantizamos la exactitud de la información</strong>. Siempre verifica datos importantes antes de tu visita.</p>
            </Section>

            <Section title="Limitación de responsabilidad">
              <p>bdai no se hace responsable de decisiones tomadas basándose en el contenido generado por la IA, ni de incidentes ocurridos durante la realización de los tours.</p>
            </Section>

            <Section title="Contacto">
              <p>¿Preguntas? <span className="text-purple-400">support@bdai.travel</span></p>
            </Section>
          </>
        )}

        {tab === 'gdpr' && (
          <>
            <Section title="Tus derechos (RGPD/GDPR)" date="">
              <p>Si resides en Europa, tienes los siguientes derechos sobre tus datos personales:</p>
            </Section>

            <div className="space-y-3">
              {[
                { icon: 'fa-eye', title: 'Acceso', desc: 'Puedes solicitar una copia de todos tus datos en cualquier momento.' },
                { icon: 'fa-pen', title: 'Rectificación', desc: 'Puedes corregir tus datos desde el perfil de la app.' },
                { icon: 'fa-trash', title: 'Eliminación', desc: 'Puedes borrar tu cuenta y todos tus datos permanentemente.' },
                { icon: 'fa-ban', title: 'Oposición', desc: 'Puedes oponerte al tratamiento de tus datos contactando support@bdai.travel.' },
                { icon: 'fa-file-export', title: 'Portabilidad', desc: 'Solicita tus datos en formato JSON enviando un email.' },
              ].map(right => (
                <div key={right.title} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center shrink-0">
                    <i className={`fas ${right.icon} text-purple-400 text-sm`}></i>
                  </div>
                  <div>
                    <p className="text-white font-black text-[11px] uppercase mb-1">{right.title}</p>
                    <p className="text-[11px]">{right.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delete Account */}
            <div className="border border-red-500/20 rounded-3xl p-5 mt-4 bg-red-500/5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <i className="fas fa-skull text-red-400 text-sm"></i>
                </div>
                <div>
                  <p className="text-red-400 font-black text-[11px] uppercase">Eliminar cuenta</p>
                  <p className="text-[10px] text-slate-500">Acción irreversible. Todos tus datos serán borrados.</p>
                </div>
              </div>

              {user.isLoggedIn ? (
                !showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full h-12 bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Quiero borrar mi cuenta
                  </button>
                ) : (
                  <div className="space-y-3 animate-fade-in">
                    <p className="text-[11px] text-slate-400">Escribe <strong className="text-red-400">BORRAR</strong> para confirmar:</p>
                    <input
                      type="text"
                      value={deleteInput}
                      onChange={e => setDeleteInput(e.target.value)}
                      placeholder="BORRAR"
                      className="w-full bg-white/5 border border-red-500/30 rounded-xl px-4 py-3 text-white font-black tracking-widest outline-none text-center"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                        className="flex-1 h-12 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black text-[10px] uppercase">
                        Cancelar
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteInput !== 'BORRAR'}
                        className="flex-[2] h-12 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase disabled:opacity-30 active:scale-95 transition-all"
                      >
                        {isDeleting ? <i className="fas fa-spinner fa-spin"></i> : 'Confirmar borrado'}
                      </button>
                    </div>
                  </div>
                )
              ) : (
                <p className="text-[11px] text-slate-500 text-center">Inicia sesión para gestionar tu cuenta.</p>
              )}
            </div>

            <div className="text-center pb-4">
              <p className="text-[10px] text-slate-600">¿Preguntas sobre tus datos?</p>
              <p className="text-purple-400 font-black text-[10px]">support@bdai.travel</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; date?: string; children: React.ReactNode }> = ({ title, date, children }) => (
  <div>
    <h3 className="text-white font-black text-[12px] uppercase tracking-wider mb-2">{title}</h3>
    {date && <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-3">{date}</p>}
    <div className="text-slate-400 text-[12px] leading-relaxed space-y-2">{children}</div>
  </div>
);
