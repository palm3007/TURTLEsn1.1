
import React, { useState } from 'react';
import { AVATAR_OPTIONS } from '../constants';
import Avatar from './Avatar';
import { StoredAccount } from '../types';
import { generateAIAvatar } from '../services/geminiService';
import AboutModal from './AboutModal';

interface AuthScreenProps {
  onComplete: (nickname: string, avatarId: number, customAvatar?: string, passwordHash?: string) => void;
  onSelectAccount: (account: StoredAccount) => void;
  savedAccounts: StoredAccount[];
  onDeleteAccount: (id: string) => void;
}

async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const AuthScreen: React.FC<AuthScreenProps> = ({ 
  onComplete, 
  onSelectAccount, 
  savedAccounts,
  onDeleteAccount 
}) => {
  const [mode, setMode] = useState<'LIST' | 'REGISTER' | 'LOGIN'>(savedAccounts.length > 0 ? 'LIST' : 'REGISTER');
  
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [error, setError] = useState('');
  const [showAbout, setShowAbout] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'presets' | 'ai'>('presets');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | undefined>(undefined);

  // Detect system preference for initial auth screen look, but we default to a neutral dark-ish style for auth usually, 
  // or we can make it light. Let's make it clean light/dark compatible.
  // For now, AuthScreen keeps a distinct look, slightly updated to be cleaner.
  const isLight = true; // Auth screen defaults to light in classic mode

  const bgClass = "bg-gray-100 text-gray-900";
  const cardClass = "bg-white border border-gray-200 shadow-xl";
  const inputClass = "bg-gray-50 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500";
  const textMuted = "text-gray-500";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim()) { setError('Придумайте никнейм!'); return; }
    if (nickname.length < 3) { setError('Никнейм слишком короткий'); return; }
    if (!password.trim()) { setError('Придумайте пароль'); return; }
    if (savedAccounts.some(acc => acc.user.nickname.toLowerCase() === nickname.toLowerCase())) {
      setError('Такой никнейм уже есть. Попробуйте войти.');
      return;
    }
    const hash = await hashPassword(password);
    onComplete(nickname, selectedAvatar, customAvatar, hash);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim() || !password.trim()) { setError('Введите данные'); return; }
    const hash = await hashPassword(password);
    const account = savedAccounts.find(acc => 
      acc.user.nickname.toLowerCase() === nickname.toLowerCase() && 
      acc.passwordHash === hash
    );
    if (account) onSelectAccount(account);
    else setError('Неверный никнейм или пароль');
  };

  const handleGenerateAvatar = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const base64 = await generateAIAvatar(aiPrompt);
      if (base64) setCustomAvatar(base64);
    } catch (e) { setError('Ошибка генерации'); } finally { setIsGenerating(false); }
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let newPass = "";
    for (let i = 0; i < 16; i++) newPass += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(newPass);
    setShowPassword(true);
  };

  // --- RENDER: Account List ---
  if (mode === 'LIST') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative ${bgClass}`}>
        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
        
        <button onClick={() => setShowAbout(true)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-all">
           <span className="text-sm font-medium">О программе</span>
        </button>

        <div className={`w-full max-w-md rounded-2xl p-8 ${cardClass}`}>
           <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">TURTLEsn</h1>
           <p className={`text-center text-sm mb-8 ${textMuted}`}>Выберите профиль</p>
           
           <div className="space-y-3 max-h-64 overflow-y-auto no-scrollbar mb-6">
             {savedAccounts.map(acc => (
               <div key={acc.user.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-400 transition-colors group cursor-pointer" onClick={() => {
                  if (acc.passwordHash) { setNickname(acc.user.nickname); setMode('LOGIN'); setError(''); }
                  else onSelectAccount(acc);
               }}>
                 <div className="flex items-center flex-1">
                   <div className="mr-4 relative">
                     {acc.user.customAvatar ? (
                        <img src={`data:image/jpeg;base64,${acc.user.customAvatar}`} className="w-12 h-12 rounded-full object-cover" />
                     ) : (
                        <Avatar avatarId={acc.user.avatarId} size="md" />
                     )}
                   </div>
                   <div>
                     <h3 className="font-bold text-gray-800">{acc.user.nickname}</h3>
                     <p className="text-xs text-gray-500">{acc.passwordHash ? 'Protected' : 'Open'}</p>
                   </div>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); if(window.confirm('Удалить?')) onDeleteAccount(acc.user.id); }}
                   className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                 >
                   ×
                 </button>
               </div>
             ))}
           </div>

           <div className="flex flex-col gap-3">
             <button onClick={() => { setMode('LOGIN'); setError(''); setNickname(''); setPassword(''); }} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-md">
               Войти
             </button>
             <button onClick={() => { setMode('REGISTER'); setError(''); setNickname(''); setPassword(''); }} className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-all font-semibold">
               Создать профиль
             </button>
           </div>
        </div>
      </div>
    );
  }

  // --- RENDER: Login ---
  if (mode === 'LOGIN') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative ${bgClass}`}>
        <div className={`w-full max-w-md rounded-2xl p-8 ${cardClass}`}>
          <button onClick={() => setMode('LIST')} className={`mb-6 text-sm flex items-center gap-1 hover:text-blue-600 ${textMuted}`}>
            ← Назад
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Вход</h2>
          <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <label className="block text-gray-600 text-sm mb-1">Никнейм</label>
               <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} className={`w-full rounded-lg px-4 py-3 outline-none ${inputClass}`} />
             </div>
             <div>
               <label className="block text-gray-600 text-sm mb-1">Пароль</label>
               <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={`w-full rounded-lg px-4 py-3 outline-none ${inputClass}`} />
             </div>
             {error && <p className="text-red-500 text-sm text-center">{error}</p>}
             <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all mt-4 shadow-md">
               Войти
             </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: Register ---
  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative ${bgClass}`}>
      <div className={`w-full max-w-md rounded-2xl p-8 ${cardClass}`}>
        <button onClick={() => setMode('LIST')} className={`mb-4 text-sm flex items-center gap-1 hover:text-blue-600 ${textMuted}`}>
          ← Назад
        </button>
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Регистрация</h1>
            <p className="text-gray-500 text-xs">Данные хранятся только на устройстве</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-5">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex space-x-2 mb-3">
                <button type="button" onClick={() => setActiveTab('presets')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${activeTab === 'presets' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>Готовые</button>
                <button type="button" onClick={() => setActiveTab('ai')} className={`flex-1 py-1.5 text-xs font-bold rounded transition-all ${activeTab === 'ai' ? 'bg-white shadow text-purple-600' : 'text-gray-500'}`}>AI</button>
              </div>
              <div className="flex justify-center min-h-[80px]">
                {activeTab === 'presets' ? (
                  <div className="grid grid-cols-5 gap-2">
                    {AVATAR_OPTIONS.slice(0,5).map((id) => (
                      <div key={id} className="flex justify-center">
                        <Avatar avatarId={id} size="sm" selected={!customAvatar && selectedAvatar === id} onClick={() => { setCustomAvatar(undefined); setSelectedAvatar(id); }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 w-full">
                     <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Кот..." className="flex-1 bg-white border border-gray-300 rounded px-2 outline-none text-sm" />
                     <button type="button" onClick={handleGenerateAvatar} disabled={isGenerating || !aiPrompt} className="bg-blue-600 text-white px-3 rounded text-xs">Go</button>
                  </div>
                )}
              </div>
              {customAvatar && activeTab === 'ai' && (
                 <div className="flex justify-center mt-2">
                   <img src={`data:image/jpeg;base64,${customAvatar}`} className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-500" />
                 </div>
              )}
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Никнейм</label>
              <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className={`w-full rounded-lg px-4 py-3 outline-none ${inputClass}`} />
            </div>
            <div>
              <label className="block text-gray-600 text-sm font-medium mb-1">Пароль</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full rounded-lg pl-4 pr-24 py-3 outline-none ${inputClass}`} />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="p-2 text-gray-400 hover:text-gray-600">{showPassword ? 'Hide' : 'Show'}</button>
                    <button type="button" onClick={generateStrongPassword} className="p-2 text-blue-500 hover:text-blue-600" title="Generate">Gen</button>
                </div>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs text-center">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-md transition-all">Создать аккаунт</button>
        </form>
      </div>
    </div>
  );
};

export default AuthScreen;
