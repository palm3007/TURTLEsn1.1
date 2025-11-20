
import React, { useState } from 'react';
import { Room, RoomType } from '../types';
import Avatar from './Avatar';

interface ChatListProps {
  rooms: Room[];
  currentRoomId: string | null;
  onSelectRoom: (room: Room) => void;
  currentUser: { nickname: string; avatarId: number; peerId?: string };
  onOpenSettings: () => void;
  onFindUser: (query: string) => void;
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
  onCreateRoom: () => void;
  onInviteFriend: () => void;
  onOpenRadar: () => void;
  isGlass: boolean;
  useTor: boolean;
  themeMode: 'light' | 'dark';
}

const ChatList: React.FC<ChatListProps> = ({ 
  rooms, 
  currentRoomId, 
  onSelectRoom, 
  currentUser, 
  onOpenSettings,
  onFindUser,
  isMobileMenuOpen,
  closeMobileMenu,
  onCreateRoom,
  onInviteFriend,
  onOpenRadar,
  isGlass,
  useTor,
  themeMode
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const isDark = themeMode === 'dark';

  const filteredRooms = rooms.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSearching = searchTerm.length > 0;

  const copyPeerId = () => {
    if (currentUser.peerId) {
      navigator.clipboard.writeText(currentUser.peerId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Styling variables
  const bgClass = isGlass 
    ? "bg-gray-900/50 backdrop-blur-xl border-r border-white/10 text-white" 
    : isDark 
      ? "bg-gray-900 border-r border-gray-800 text-gray-100" 
      : "bg-white border-r border-gray-200 text-gray-900";
      
  const headerBorder = isGlass ? 'border-white/10' : isDark ? 'border-gray-800' : 'border-gray-200';
  
  const cardBgClass = isGlass
    ? "bg-white/5 border border-white/10"
    : isDark
      ? "bg-gray-800 border border-gray-700"
      : "bg-gray-100 border border-gray-200";

  const inputBg = isGlass 
    ? 'bg-black/20 border border-white/5 text-white placeholder-gray-400' 
    : isDark 
      ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' 
      : 'bg-gray-100 border border-gray-200 text-gray-900 placeholder-gray-500';

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-80 transform transition-transform duration-300 ease-in-out flex flex-col
      ${bgClass}
      ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0 md:static
    `}>
      {/* Header */}
      <div className={`p-4 border-b ${headerBorder}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            TURTLEsn
            {useTor && (
               <span className="flex h-2 w-2 relative" title="Tor Routing Active">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
               </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
             <button
               onClick={onOpenRadar}
               className={`p-1.5 rounded-lg transition-colors ${isGlass ? 'hover:bg-green-500/20 text-green-400' : 'bg-transparent text-green-500 hover:bg-green-50'}`}
               title="Люди рядом"
             >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
             </button>
             <button
               onClick={onCreateRoom}
               className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
               title="Создать"
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
               </svg>
             </button>
             <button 
               onClick={closeMobileMenu}
               className="md:hidden text-gray-500"
             >
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
               </svg>
             </button>
          </div>
        </div>
        
        {/* My ID Card */}
        <div className={`${cardBgClass} rounded-lg p-3 mb-4`}>
          <p className={`text-xs mb-1 uppercase font-semibold tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
             Мой ID
          </p>
          <div className="flex items-center justify-between group cursor-pointer" onClick={copyPeerId}>
             <span className={`text-xs font-mono truncate mr-2 select-all ${useTor ? 'text-purple-500' : 'text-blue-500'}`}>
               {currentUser.peerId || '...'}
             </span>
             {currentUser.peerId && (
               <button className="text-gray-400 hover:text-gray-600">
                  {copySuccess ? <span className="text-green-500 text-xs">Скопировано</span> : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
                    </svg>
                  )}
               </button>
             )}
          </div>
        </div>

        <div className="relative">
          <input 
            type="text"
            placeholder="Поиск..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${inputBg}`}
          />
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 absolute left-3 top-2.5 text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
      </div>

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
        
        {!isSearching && rooms.length === 0 && (
           <div className="flex flex-col items-center justify-center h-64 p-6 text-center">
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-4`}>Чатов пока нет</p>
              <button onClick={onInviteFriend} className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm shadow">Добавить друга</button>
           </div>
        )}

        {isSearching && filteredRooms.length === 0 && (
          <button
            onClick={() => { onFindUser(searchTerm); setSearchTerm(''); closeMobileMenu(); }}
            className={`w-full flex items-center p-3 rounded-xl transition-colors mb-2 text-left group ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
             <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold shadow-md">
               +
             </div>
             <div className="ml-3">
               <h3 className="text-sm font-semibold">Найти: {searchTerm}</h3>
             </div>
          </button>
        )}

        {filteredRooms.map((room) => {
          const isActive = currentRoomId === room.id;
          // Active/Hover logic based on theme
          let activeClass = '';
          if (isGlass) {
             activeClass = isActive ? 'bg-white/10 shadow-lg' : 'hover:bg-white/5';
          } else if (isDark) {
             activeClass = isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 text-gray-300';
          } else {
             // Light classic: active gets blue bg, white text. Inactive gets hover gray.
             activeClass = isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700';
          }

          return (
            <button
              key={room.id}
              onClick={() => { onSelectRoom(room); closeMobileMenu(); }}
              className={`w-full flex items-center p-3 rounded-lg transition-all text-left group relative ${activeClass}`}
            >
              <div className="relative">
                 {room.botPersona.customAvatar ? (
                    <img src={`data:image/jpeg;base64,${room.botPersona.customAvatar}`} className="w-10 h-10 rounded-full object-cover" alt="avatar"/>
                 ) : (
                    <Avatar avatarId={room.botPersona.avatarId} size="sm" />
                 )}
                 {room.isP2P && (
                   <div className={`absolute bottom-0 right-0 w-3 h-3 border-2 rounded-full ${isDark ? 'border-gray-900' : 'border-white'} ${room.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                 )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h3 className={`text-sm font-semibold truncate`}>{room.name}</h3>
                </div>
                <p className={`text-xs truncate opacity-80`}>
                   {room.isP2P && !room.isConnected ? 'Connecting...' : room.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className={`p-4 border-t ${headerBorder} ${isGlass ? 'bg-black/20' : isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 cursor-pointer hover:opacity-80" onClick={onOpenSettings}>
            {currentUser.avatarId ? <Avatar avatarId={currentUser.avatarId} size="sm" /> : null}
            <div className="ml-3 truncate">
              <p className="text-sm font-bold truncate">{currentUser.nickname}</p>
              <p className="text-xs text-green-500 flex items-center">Online</p>
            </div>
          </div>
          <button onClick={onOpenSettings} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l.548.95c.356.616.25 1.397-.256 1.894l-.943.928c-.187.184-.235.463-.123.716.037.085.067.172.089.26.11.434.482.75.927.798l1.28.136c.63.067 1.1.6 1.1 1.233v1.094c0 .633-.47 1.166-1.1 1.233l-1.28.136a.99.99 0 00-.927.798 5.1 5.1 0 01-.089.26c-.112.253-.064.532.123.716l.943.928c.506.497.612 1.278.256 1.894l-.548.95a1.125 1.125 0 01-1.37.49l-1.217-.456a.99.99 0 00-1.076.124 5.12 5.12 0 01-.22.127c-.332.184-.582.496-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.213-1.281a.99.99 0 00-.644-.87 5.12 5.12 0 01-.22-.127.99.99 0 00-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-.548-.95a1.14 1.14 0 01.256-1.894l.943-.928a.99.99 0 00.123-.716 5.096 5.096 0 01-.089-.26.99.99 0 00-.927-.798l-1.28-.136c-.63-.067-1.1-.6-1.1-1.233v-1.094c0-.633.47-1.166 1.1-1.233l1.28-.136a.99.99 0 00.927-.798 5.1 5.1 0 01.089-.26c.112-.253.064-.532-.123-.716l-.943-.928a1.14 1.14 0 01-.256-1.894l.548-.95a1.125 1.125 0 011.37-.49l1.217.456a.99.99 0 001.075-.124 5.12 5.12 0 01.22-.127c.332-.184.582-.496.644-.869l.213-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default ChatList;
