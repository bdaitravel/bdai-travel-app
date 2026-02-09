
import React, { useState } from 'react';
import { BdaiLogo } from './BdaiLogo';

interface OnboardingProps {
    onComplete: () => void;
    language: string;
}

const CONTENT: any = {
    es: { title: "Bienvenido a bdai", subtitle: "Tu Masterclass de Viajes", btnNext: "Siguiente", btnBack: "Atrás", btnStart: "¡Comenzar!", btnSkip: "Saltar", steps: [
        { title: "Tours Gratis e Ilimitados", desc: "Explora cualquier rincón del mundo en tu idioma. Si no ves tu ciudad en la home, búscala. Los tours son gratuitos e ilimitados.", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai: Tu Guía Personal", desc: "Dai te susurra secretos y curiosidades técnicas. Además, te dará el 'Dai Shot': el tip experto para la foto perfecta.", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "Tú Tienes el Control", desc: "Usa el mapa con GPS. Elige entre 'Play' para audio o lee los secretos a tu ritmo. Tú decides cómo explorar.", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "Millas e Insignias", desc: "Gana millas en cada parada para subir en el ranking mundial. Consigue insignias según tus intereses (Historia, Arte, Gastro...).", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "Pasaporte y Visados", desc: "Tus datos se guardan siempre. El Visado indica que has completado una ciudad. Pausa hoy y termina cuando quieras.", icon: "fa-passport", color: "text-orange-500" },
        { title: "Marketplace de Viaje", desc: "Equípate en nuestra tienda para tus aventuras. Cambia tus datos y mejora tu nivel de explorador.", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    en: { title: "Welcome to bdai", subtitle: "Your Travel Masterclass", btnNext: "Next", btnBack: "Back", btnStart: "Start!", btnSkip: "Skip", steps: [
        { title: "Free & Unlimited Tours", desc: "Explore the world in your language. Search for any city. Tours are free and unlimited.", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai: Your Personal Guide", desc: "Dai reveals secrets and technical curiosities. Get the 'Dai Shot' for the perfect photo.", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "You Are in Control", desc: "Use the GPS map. Choose 'Play' for audio or read at your own pace. You decide.", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "Miles & Badges", desc: "Earn miles to climb the global rankings. Collect badges based on your interests.", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "Passport & Visas", desc: "Your progress is saved. The Visa shows you completed a city. Start today, finish whenever.", icon: "fa-passport", color: "text-orange-500" },
        { title: "Travel Marketplace", desc: "Gear up in our store. Update your data and level up your explorer status.", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    it: { title: "Benvenuto in bdai", subtitle: "La tua Masterclass di Viaggio", btnNext: "Avanti", btnBack: "Indietro", btnStart: "Inizia!", btnSkip: "Salta", steps: [
        { title: "Tour Gratuiti e Illimitati", desc: "Esplora ogni angolo del mondo nella tua lingua. Se non vedi la tua città, cercala. I tour sono gratuiti e illimitati.", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai: La tua Guida Personale", desc: "Dai ti sussurra segreti e curiosità tecniche. Inoltre, ti darà il 'Dai Shot': il consiglio esperto per la foto perfetta.", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "Tu hai il Controllo", desc: "Usa la mappa con GPS. Scegli tra 'Play' per l'audio o leggi al tuo ritmo. Decidi tu come esplorare.", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "Miglia e Distintivi", desc: "Guadagna miglia a ogni tappa per scalare la classifica mondiale. Ottieni distintivi in base ai tuoi interessi.", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "Passaporto e Visti", desc: "I tuoi dati sono sempre salvati. Il Visto indica che hai completato una città. Metti in pausa e finisci quando vuoi.", icon: "fa-passport", color: "text-orange-500" },
        { title: "Travel Marketplace", desc: "Equipaggiati nel nostro store per le tue avventure. Migliora il tuo livello di esploratore.", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    ca: { title: "Benvingut a bdai", subtitle: "La Teva Masterclass", btnNext: "Següent", btnBack: "Enrere", btnStart: "Començar!", btnSkip: "Saltar", steps: [
        { title: "Tours Gratis", desc: "Explora el món en el teu idioma. Tours gratuïts i il·limitats.", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai: Guia Personal", desc: "Secrets i el 'Dai Shot' per a la foto perfecta.", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "Tu Tens el Control", desc: "Mapa amb GPS. Tria àudio o lectura al teu ritme.", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "Milles i Insígnies", desc: "Guanya milles i puja al rànquing mundial.", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "Passaport i Visats", desc: "Dades guardades sempre. El Visat marca el teu progrés.", icon: "fa-passport", color: "text-orange-500" },
        { title: "Marketplace", desc: "Equipa't a la nostra botiga per a les teves aventures.", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    eu: { title: "Ongi etorri bdai-ra", subtitle: "Zure Masterclass-a", btnNext: "Hurrengoa", btnBack: "Atzera", btnStart: "Hasi!", btnSkip: "Saltatu", steps: [
        { title: "Doako Tourrak", desc: "Esploratu mundua zure hizkuntzan. Tourrak doakoak eta mugagabeak dira.", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai: Zure Gida", desc: "Sekretuak eta 'Dai Shot' argazki perfekturako.", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "Zuk Daukazu Kontrola", desc: "GPS mapa. Audioa edo irakurketa aukeratu.", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "Miliak eta Ikurrak", desc: "Irabazi miliak eta igo munduko sailkapenean.", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "Pasaportea", desc: "Datuak beti gordeta. Bisatuak zure hirien marka dira.", icon: "fa-passport", color: "text-orange-500" },
        { title: "Denda", desc: "Presta zaitez gure dendan zure abenturarako.", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    zh: { title: "欢迎来到 bdai", subtitle: "您的旅行大师课", btnNext: "下一步", btnBack: "返回", btnStart: "开始！", btnSkip: "跳过", steps: [
        { title: "免费无限旅游", desc: "用您的语言探索世界。搜索任何城市。旅游是免费且无限的。", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai：您的私人导游", desc: "Dai 揭示秘密和技术好奇心。获取完美照片的“Dai Shot”。", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "您掌握主动权", desc: "使用 GPS 地图。选择“播放”音频或按自己的步调阅读。", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "里程与徽章", desc: "赚取里程以攀升全球排名。根据您的兴趣收集徽章。", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "护照与签证", desc: "您的进度始终会被保存。签证显示您已完成一个城市。", icon: "fa-passport", color: "text-orange-500" },
        { title: "旅行市场", desc: "在我们的商店备货。更新您的数据并提升探险家等级。", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    pt: { title: "Bem-vindo ao bdai", subtitle: "Sua Masterclass de Viagem", btnNext: "Próximo", btnBack: "Voltar", btnStart: "Começar!", btnSkip: "Pular", steps: [
        { title: "Tours Grátis e Ilimitados", desc: "Explore o mundo no seu idioma. Tours gratuitos e sem limites.", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai: Seu Guia Pessoal", desc: "Secrets e o 'Dai Shot' para a foto perfecta.", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "Você no Controle", desc: "Mapa com GPS. Escolha áudio ou leitura ao seu ritmo.", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "Milhas e Medalhas", desc: "Ganhe milhas e suba no ranking mundial.", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "Passaporte e Vistos", desc: "Dados salvos sempre. O Visto marca seu progresso.", icon: "fa-passport", color: "text-orange-500" },
        { title: "Mercado de Viagem", desc: "Equipe-se em nossa loja para suas aventuras.", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    fr: { title: "Bienvenue sur bdai", subtitle: "Votre Masterclass Voyage", btnNext: "Suivant", btnBack: "Retour", btnStart: "Commencer !", btnSkip: "Passer", steps: [
        { title: "Tours Gratuits", desc: "Explorez le monde dans votre langue. Tours gratuits et illimités.", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai: Guide Personnel", desc: "Secrets et 'Dai Shot' pour la photo parfaite.", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "Vous avez le Contrôle", desc: "Carte avec GPS. Choisissez audio ou lecture.", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "Miles et Badges", desc: "Gagnez des miles et montez dans le classement mondial.", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "Passeport et Visas", desc: "Données sauvegardées. Le Visa marque votre succès.", icon: "fa-passport", color: "text-orange-500" },
        { title: "Marketplace", desc: "Équipez-vous dans notre boutique voyage.", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    de: { title: "Willkommen bei bdai", subtitle: "Deine Reise-Masterclass", btnNext: "Weiter", btnBack: "Zurück", btnStart: "Start!", btnSkip: "Überspringen", steps: [
        { title: "Kostenlose Touren", desc: "Erkunde die Welt in deiner Sprache. Kostenlos und unbegrenzt.", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai: Dein Guide", desc: "Geheimnisse und der 'Dai Shot' für das perfekte Foto.", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "Du hast die Kontrolle", desc: "GPS-Karte. Wähle Audio oder Lesen nach deinem Tempo.", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "Meilen und Abzeichen", desc: "Sammle Meilen und steige im globalen Ranking.", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "Reisepass & Visa", desc: "Deine Daten sind sicher. Visa zeigen deinen Erfolg.", icon: "fa-passport", color: "text-orange-500" },
        { title: "Marktplatz", desc: "Rüste dich in unserem Shop für dein Abenteuer aus.", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    ja: { title: "bdaiへようこそ", subtitle: "あなたの旅行マスタークラス", btnNext: "次へ", btnBack: "戻る", btnStart: "開始！", btnSkip: "スキップ", steps: [
        { title: "無料無制限ツアー", desc: "あなたの言語で世界を探索。無料かつ無制限です。", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai：専属ガイド", desc: "秘密と完璧な写真のための「Dai Shot」。", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "あなたが主役", desc: "GPSマップ。音声再生か読書か選択可能。", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "マイルとバッジ", desc: "マイルを稼いで世界ランクを上げよう。", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "パスポートとビザ", desc: "データは常に保存。ビザは完了の証です。", icon: "fa-passport", color: "text-orange-500" },
        { title: "マーケットプレイス", desc: "冒険に必要なものをショップで揃えよう。", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]},
    ru: { title: "Добро пожаловать в bdai", subtitle: "Ваш мастер-класс по путешествиям", btnNext: "Далее", btnBack: "Назад", btnStart: "Начать!", btnSkip: "Пропустить", steps: [
        { title: "Бесплатные туры", desc: "Исследуйте мир на своем языке. Бесплатно и безлимитно.", icon: "fa-globe", color: "text-blue-500" },
        { title: "Dai: Ваш гид", desc: "Секреты и 'Dai Shot' для идеального фото.", icon: "fa-wand-magic-sparkles", color: "text-purple-500" },
        { title: "Вы у руля", desc: "GPS-карта. Слушайте аудио или читайте в своем темпе.", icon: "fa-headphones", color: "text-emerald-500" },
        { title: "Мили и значки", desc: "Зарабатывайте мили и растите в мировом рейтинге.", icon: "fa-trophy", color: "text-yellow-500" },
        { title: "Паспорт и визы", desc: "Прогресс всегда сохранен. Виза — знак успеха.", icon: "fa-passport", color: "text-orange-500" },
        { title: "Магазин", desc: "Снаряжение для ваших приключений в нашем магазине.", icon: "fa-shopping-bag", color: "text-pink-500" }
    ]}
};

const getStepData = (lang: string, index: number) => {
    const base = CONTENT[lang] || CONTENT['es'];
    const steps = (CONTENT[lang]?.steps || CONTENT['es'].steps);
    return { ...base, step: steps[index], totalSteps: steps.length };
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, language }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const data = getStepData(language, currentStep);
    const isLast = currentStep === data.totalSteps - 1;

    return (
        <div className="fixed inset-0 z-[10000] bg-[#020617] flex flex-col font-sans overflow-hidden animate-fade-in text-white">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-600/10 to-transparent"></div>
            
            <div className="flex-1 flex flex-col items-center justify-center px-8 pb-32">
                <div className="flex flex-col items-center mb-12 text-center" key={`logo-${currentStep}`}>
                    <BdaiLogo className="w-20 h-20 mb-6 animate-pulse-logo" />
                    <h2 className="text-3xl font-black uppercase tracking-tighter">{data.title}</h2>
                    <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] mt-2">{data.subtitle}</p>
                </div>

                <div className="w-full max-w-sm" key={`step-${currentStep}`}>
                    <div className="bg-white/5 border border-white/10 p-10 rounded-[3rem] flex flex-col items-center text-center shadow-2xl">
                        <div className={`w-20 h-20 rounded-[2rem] bg-black/40 flex items-center justify-center mb-6 ${data.step.color} text-4xl shadow-inner border border-white/5`}>
                            <i className={`fas ${data.step.icon}`}></i>
                        </div>
                        <h4 className="font-black text-xl uppercase tracking-tight mb-4">{data.step.title}</h4>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium opacity-80">{data.step.desc}</p>
                        
                        <div className="flex gap-2 mt-8">
                            {Array.from({ length: data.totalSteps }).map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-8 bg-purple-500' : 'w-2 bg-white/10'}`}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[#020617] via-[#020617]/95 to-transparent flex flex-col items-center gap-4">
                <div className="flex w-full max-w-sm gap-3">
                    {currentStep > 0 && (
                        <button onClick={() => setCurrentStep(s => s - 1)} className="flex-1 py-6 bg-white/10 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] border border-white/10">
                            {data.btnBack}
                        </button>
                    )}
                    <button onClick={() => isLast ? onComplete() : setCurrentStep(s => s + 1)} className="flex-[2] py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl">
                        {isLast ? data.btnStart : data.btnNext}
                    </button>
                </div>
                {!isLast && (
                    <button onClick={onComplete} className="text-[9px] font-black text-slate-500 uppercase tracking-widest py-2">{data.btnSkip}</button>
                )}
            </div>
        </div>
    );
};
