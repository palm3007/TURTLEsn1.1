
import React, { useState } from 'react';
import { AVATAR_OPTIONS, THEME_COLORS, WALLPAPERS } from '../constants';
import Avatar from './Avatar';
import { User, UserSettings, ThemeColor, Wallpaper } from '../types';
import { generateAIAvatar } from '../services/geminiService';
import AboutModal from './AboutModal';

interface SettingsScreenProps {
  currentUser: User;
  currentSettings: UserSettings;
  onSave: (updates: Partial<User>, settings: UserSettings) => void;
  onBack: () => void;
  onLogout: () => void;
  onSwitchAccount: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  currentUser, 
  currentSettings, 
  onSave, 
  onBack, 
  onLogout,
  onSwitchAccount
}) => {
  const [nickname, setNickname] = useState(currentUser.nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatarId);
  const [customAvatar, setCustomAvatar] = useState<string | undefined>(currentUser.customAvatar);
  
  const [fontSize, setFontSize] = useState<UserSettings['fontSize']>(currentSettings.fontSize);
  const [themeColor, setThemeColor] = useState<ThemeColor>(currentSettings.themeColor);
  const [wallpaper, setWallpaper] = useState<Wallpaper>(currentSettings.wallpaper);
  const [privacy, setPrivacy] = useState(currentSettings.privacy);
  const [isGlass, setIsGlass] = useState(currentSettings.isGlass);
  const [useTor, setUseTor] = useState(currentSettings.useTor);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(currentSettings.themeMode);
  
  const [isSaved, setIsSaved] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const isDark = themeMode === 'dark';
  const bgClass = isGlass ? 'bg-transparent' : isDark ? 'bg-gray-900' : 'bg-gray-50';
  const textClass = isDark ? 'text-white' : 'text-gray-900';
  const subTextClass = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardClass = isGlass ? "bg-gray-900/60 backdrop-blur-xl border-white/10" : isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm";
  const inputClass = isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-gray-50 border-gray-300 text-gray-900";

  const handleSave = () => {
    onSave(
      { nickname, avatarId: selectedAvatar, customAvatar },
      { fontSize, themeColor, wallpaper, privacy, isGlass, useTor, themeMode }
    );
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleGenerateAvatar = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const base64 = await generateAIAvatar(aiPrompt);
      if (base64) setCustomAvatar(base64);
    } catch (e) { alert('Error generating avatar'); } finally { setIsGenerating(false); }
  };

  const theme = THEME_COLORS[themeColor];

  return (
    <div className={`flex-1 h-full overflow-y-auto p-6 md:p-8 ${bgClass} ${textClass} relative`}>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold">Настройки</h2>
          <button onClick={onBack} className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 ${subTextClass}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Theme Mode */}
        <section className={`rounded-2xl p-6 border ${cardClass}`}>
           <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Оформление</h3>
           
           <div className="flex items-center justify-between mb-6">
              <div>
                 <p className="font-medium">Темная тема</p>
                 <p className={`text-xs ${subTextClass}`}>Использовать темные цвета интерфейса</p>
              </div>
              <button 
                onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                 <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${isDark ? 'translate-x-6' : ''}`} />
              </button>
           </div>

           <div className="flex items-center justify-between mb-6">
              <div>
                 <p className="font-medium">Glassmorphism</p>
                 <p className={`text-xs ${subTextClass}`}>Полупрозрачность и размытие (Beta)</p>
              </div>
              <button 
                onClick={() => setIsGlass(!isGlass)}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${isGlass ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                 <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${isGlass ? 'translate-x-6' : ''}`} />
              </button>
           </div>

           <div className="mb-4">
             <label className={`block text-sm mb-2 ${subTextClass}`}>Акцентный цвет</label>
             <div className="flex gap-3">
               {(Object.keys(THEME_COLORS) as ThemeColor[]).map((color) => (
                 <button key={color} onClick={() => setThemeColor(color)} className={`w-8 h-8 rounded-full ${THEME_COLORS[color].primary} ${themeColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`} />
               ))}
             </div>
           </div>
        </section>

        {/* Profile */}
        <section className={`rounded-2xl p-6 border ${cardClass}`}>
          <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Профиль</h3>
          <div className="mb-6">
             <div className="flex gap-2 mb-3">
                <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="AI Avatar prompt..." className={`flex-1 border rounded px-3 py-2 text-sm outline-none ${inputClass}`} />
                <button onClick={handleGenerateAvatar} disabled={isGenerating} className="bg-gray-700 text-white px-3 rounded text-sm">Gen</button>
             </div>
             <div className="flex flex-wrap gap-3">
               {customAvatar && <Avatar avatarId={0} size="md" selected onClick={() => {}} />}
               {!customAvatar && AVATAR_OPTIONS.slice(0,6).map((id) => (
                  <Avatar key={id} avatarId={id} size="md" selected={selectedAvatar === id} onClick={() => setSelectedAvatar(id)} />
               ))}
             </div>
          </div>
          <div>
             <label className={`block text-sm mb-1 ${subTextClass}`}>Никнейм</label>
             <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className={`w-full border rounded px-3 py-2 outline-none ${inputClass}`} />
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-3 pt-4 pb-10">
          <button onClick={handleSave} className={`w-full ${theme.primary} text-white font-bold py-3 rounded-xl shadow hover:opacity-90`}>
            {isSaved ? 'Сохранено' : 'Сохранить'}
          </button>
          <div className="grid grid-cols-2 gap-3">
             <button onClick={onSwitchAccount} className={`border font-semibold py-3 rounded-xl ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700 bg-white'}`}>Сменить аккаунт</button>
             <button onClick={onLogout} className="bg-red-100 text-red-600 font-semibold py-3 rounded-xl">Выйти</button>
          </div>
          <button onClick={() => setShowAbout(true)} className={`w-full py-3 text-sm ${subTextClass}`}>О программе</button>
        </div>

      </div>
    </div>
  );
};

export default SettingsScreen;
