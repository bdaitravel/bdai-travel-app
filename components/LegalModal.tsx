import React, { useState } from 'react';

interface LegalModalProps {
  type: 'privacy' | 'terms';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const isPrivacy = type === 'privacy';
  const title = isPrivacy ? 'Política de Privacidad' : 'Términos de Uso';

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-start overflow-y-auto no-scrollbar bg-slate-950/98 backdrop-blur-2xl p-6 pt-12">
      <div className="w-full max-w-md flex justify-between items-center mb-8">
        <h2 className="text-white font-black text-xl uppercase tracking-widest">{title}</h2>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center border border-white/5 active:scale-90 shadow-lg">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-6 text-slate-300 text-sm leading-relaxed space-y-6">
        {isPrivacy ? (
          <>
            <p><strong>Última actualización:</strong> 14 de Marzo de 2026</p>
            <p>
              En bdai (better destinations by ai), respetamos su privacidad y estamos comprometidos a proteger sus datos personales. Esta política de privacidad le informará sobre cómo cuidamos sus datos personales cuando visita nuestra aplicación y le informará sobre sus derechos de privacidad y cómo la ley lo protege.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">1. Información que recopilamos</h3>
            <p>
              Recopilamos y procesamos datos personales que usted nos proporciona directamente, como su nombre, dirección de correo electrónico, edad, ciudad, país e idioma de preferencia al crear una cuenta. También recopilamos datos de ubicación (GPS) cuando utiliza la aplicación para desbloquear paradas y ganar millas.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">2. Cómo usamos su información</h3>
            <p>
              Utilizamos su información para proporcionarle y mejorar nuestros servicios, personalizar su experiencia (por ejemplo, traduciendo contenido a su idioma), gestionar su cuenta, y para fines de gamificación (cálculo de millas y rankings).
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">3. Compartir su información</h3>
            <p>
              No vendemos sus datos personales a terceros. Podemos compartir información anonimizada y agregada con ayuntamientos y comercios locales (B2B/B2G) para mejorar la experiencia turística, sin identificarle personalmente.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">4. Sus derechos (RGPD)</h3>
            <p>
              De acuerdo con el Reglamento General de Protección de Datos (RGPD), usted tiene derecho a acceder, rectificar, oponerse al tratamiento y solicitar la eliminación de sus datos personales. Puede ejercer su derecho al olvido eliminando su cuenta directamente desde la sección de perfil de la aplicación o contactándonos.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">5. Contacto</h3>
            <p>
              Para cualquier consulta relacionada con la privacidad o para ejercer sus derechos, puede contactarnos en:
              <br/><br/>
              <strong>Daysi Chong Zambrano</strong><br/>
              NIF: 16648955Z<br/>
              Calle Calvo Sotelo 34<br/>
              Logroño, La Rioja 26003<br/>
              Email: info@bdai.travel
            </p>
          </>
        ) : (
          <>
            <p><strong>Última actualización:</strong> 14 de Marzo de 2026</p>
            <p>
              Bienvenido a bdai. Al acceder o utilizar nuestra aplicación, usted acepta estar sujeto a estos Términos de Uso.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">1. Uso de la Aplicación</h3>
            <p>
              bdai es un ecosistema de datos turísticos y gamificación. Usted se compromete a utilizar la aplicación solo para fines legales y de acuerdo con estos términos. No debe utilizar la aplicación de ninguna manera que pueda dañar, deshabilitar, sobrecargar o deteriorar nuestros servidores o redes.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">2. Cuentas de Usuario</h3>
            <p>
              Para acceder a ciertas funciones, debe crear una cuenta. Usted es responsable de mantener la confidencialidad de su información de inicio de sesión y de todas las actividades que ocurran bajo su cuenta.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">3. Contenido Generado por el Usuario</h3>
            <p>
              Al aportar "Secretos" o cualquier otro contenido a la comunidad, usted nos otorga una licencia no exclusiva, libre de regalías y mundial para utilizar, reproducir y modificar dicho contenido para enriquecer los tours y mejorar el servicio.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">4. Gamificación y Recompensas</h3>
            <p>
              Las "millas" y recompensas obtenidas en la aplicación no tienen valor monetario real y no pueden ser canjeadas por dinero en efectivo. Nos reservamos el derecho de modificar o cancelar el programa de recompensas en cualquier momento.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">5. Limitación de Responsabilidad</h3>
            <p>
              La aplicación se proporciona "tal cual". No garantizamos que la aplicación sea ininterrumpida o libre de errores. En la medida máxima permitida por la ley, no seremos responsables de ningún daño indirecto, incidental o consecuente que surja del uso de la aplicación.
            </p>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs">6. Contacto</h3>
            <p>
              Si tiene alguna pregunta sobre estos Términos, contáctenos en:<br/><br/>
              <strong>Daysi Chong Zambrano</strong><br/>
              NIF: 16648955Z<br/>
              Calle Calvo Sotelo 34<br/>
              Logroño, La Rioja 26003<br/>
              Email: info@bdai.travel
            </p>
          </>
        )}
      </div>
    </div>
  );
};
