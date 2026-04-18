import { useCallback, useState } from 'react';
import { translations } from '../data/translations';
import { useAppStore } from '../store/useAppStore';
import { syncUserProfile } from '../services/supabaseClient';

export const useTranslation = () => {
    const { userProfile, setUserProfile, setActiveTours } = useAppStore();
    const [isSyncingLang, setIsSyncingLang] = useState(false);

    const t = useCallback((key: string) => {
        const lang = userProfile?.language || 'es';
        const dict = translations[lang] || translations['en'];
        return dict[key] || translations['en'][key] || key;
    }, [userProfile?.language]);

    const handleLangChange = (code: string) => {
        setIsSyncingLang(code !== userProfile.language);
        const updatedUser = { ...userProfile, language: code };
        setUserProfile(updatedUser);
        if (updatedUser.isLoggedIn) syncUserProfile(updatedUser);
        setActiveTours([]);
        setTimeout(() => setIsSyncingLang(false), 500);
    };

    return { t, handleLangChange, isSyncingLang };
};
