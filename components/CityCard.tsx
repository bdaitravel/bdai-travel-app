import React, { useState, useEffect } from 'react';
import { generateImage } from '../services/geminiService';

interface CityCardProps {
  name: string;
  image?: string;
  description: string;
  onClick: () => void;
  isLoading?: boolean;
}

export const CityCard: React.FC<CityCardProps> = ({ name, image, description, onClick, isLoading = false }) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  
  const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?auto=format&fit=crop&w=800&q=80';

  useEffect(() => {
    setImgLoaded(false);
    setHasError(false);
    setAiImage(null);

    // If no image is provided, or if we want to augment, we trigger AI generation
    if (!image) {
        let isMounted = true;
        const fetchAiImage = async () => {
            const prompt = `Cinematic travel photography of ${name}, iconic landmark, highly detailed, 8k, sunny, golden hour`;
            const generatedUrl = await generateImage(prompt);
            if (isMounted && generatedUrl) {
                setAiImage(generatedUrl);
            }
        };
        fetchAiImage();
        return () => { isMounted = false; };
    }
  }, [name, image]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!hasError) {
          setHasError(true);
          // If the provided image fails, try generating one if we haven't already
          if (!aiImage) {
              const fetchAiImage = async () => {
                  const prompt = `Cinematic travel photography of ${name}, iconic landmark, highly detailed, 8k`;
                  const generatedUrl = await generateImage(prompt);
                  if (generatedUrl) setAiImage(generatedUrl);
              };
              fetchAiImage();
          }
      }
  };

  // Determine which image to show
  // 1. AI Image if it exists (prioritize if explicit image failed or wasn't provided)
  // 2. Provided Image (if no error)
  // 3. Fallback
  let displayImage = image;
  if (hasError || !image) {
      displayImage = aiImage || FALLBACK_IMAGE;
  }

  // If we are waiting for AI image and have no other image, show placeholder/loading
  const isWaitingForAi = (!image || hasError) && !aiImage;

  // Font sizing logic for long names like "Santo Domingo de la Calzada"
  const isLongName = name.length > 15;
  const titleClass = isLongName ? "text-xl leading-tight" : "text-3xl leading-none";

  return (
    <div 
      onClick={onClick}
      className={`group relative h-[380px] w-full rounded-[2rem] overflow-hidden cursor-pointer transition-all duration-500 shadow-md hover:shadow-2xl hover:-translate-y-2 flex-shrink-0`}
    >
      <div className={`absolute inset-0 bg-slate-200 ${isWaitingForAi || !imgLoaded ? 'animate-pulse' : ''}`}></div>
      
      <img 
        src={displayImage} 
        alt={name} 
        onError={handleImageError}
        onLoad={() => setImgLoaded(true)}
        className={`w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-in-out group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* AI Badge if using AI image */}
      {aiImage && (hasError || !image) && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full border border-white/20 z-10">
              <i className="fas fa-magic mr-1"></i> AI Generated
          </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
      
      <div className="absolute bottom-0 left-0 w-full p-6 flex flex-col justify-end pointer-events-none">
         <h3 className={`${titleClass} font-heading font-bold text-white mb-1 tracking-tight shadow-black drop-shadow-lg`}>{name}</h3>
         {description && <p className="text-slate-200 text-sm font-medium line-clamp-2 mb-4 opacity-90">{description}</p>}
         
         <div className={`flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 ${!description ? 'mt-3' : ''}`}>
             <span className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg">
                 <i className="fas fa-arrow-right text-xs transform group-hover:translate-x-0.5 transition-transform"></i>
             </span>
             <span className="text-white text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300">Explore</span>
         </div>
      </div>
    </div>
  );
};