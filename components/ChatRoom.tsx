
import React, { useState, useEffect, useRef } from 'react';
import { Room, Message, User, UserSettings } from '../types';
import { sendMessageToBot } from '../services/geminiService';
import { THEME_COLORS, WALLPAPERS } from '../constants';
import Avatar from './Avatar';

interface ChatRoomProps {
  room: Room;
  currentUser: User;
  settings: UserSettings;
  onMenuClick: () => void;
  onStartCall: () => void;
  onSendMessageP2P?: (text: string) => void;
  onInviteToGroup?: (roomId: string, peerId: string) => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ 
  room, 
  currentUser, 
  settings, 
  onMenuClick, 
  onStartCall,
  onSendMessageP2P,
  onInviteToGroup
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [invitePeerId, setInvitePeerId] = useState('');
  
  const [recordingMode, setRecordingMode] = useState<'AUDIO' | 'VIDEO'>('AUDIO');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isDark = settings.themeMode === 'dark';
  const isGlass = settings.isGlass;
  
  // --- Theme Styles ---
  const theme = THEME_COLORS[settings.themeColor];
  // Use wallpaper from settings, or default logic
  const wallpaperClass = WALLPAPERS[settings.wallpaper];

  const headerClass = isGlass 
      ? "bg-gray-900/40 backdrop-blur-xl border-b border-white/10"
      : isDark 
          ? "bg-gray-900 border-b border-gray-800 shadow-sm" 
          : "bg-white border-b border-gray-200 shadow-sm";

  const inputAreaClass = isGlass 
      ? "bg-gray-900/40 backdrop-blur-xl border-t border-white/10"
      : isDark 
          ? "bg-gray-900 border-t border-gray-800" 
          : "bg-white border-t border-gray-200";
  
  // Classic Bubbles
  // Me: Theme color (Blue/Green), White Text
  // Other: White/Gray bg, Dark Text
  const messageBubbleMe = isGlass 
      ? `${theme.primary} bg-opacity-80 backdrop-blur-md text-white border border-white/10`
      : `${theme.primary} text-white`; 
      
  const messageBubbleOther = isGlass 
      ? "bg-black/40 backdrop-blur-md text-white border border-white/10"
      : isDark 
          ? "bg-gray-800 text-gray-100" 
          : "bg-white text-gray-900 shadow-sm border border-gray-100";

  const systemMsgClass = isGlass 
      ? "bg-black/30 backdrop-blur-sm border-white/10 text-gray-300" 
      : isDark 
          ? "bg-gray-800/80 text-gray-300" 
          : "bg-gray-200/80 text-gray-700";
  
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  const subTextColor = isDark ? 'text-gray-400' : 'text-gray-500';

  // ... (Remaining logic for effects hooks, sending messages, recording etc. remains same, just styling changes)

  const isReadOnly = room.type === 'CHANNEL' && !room.isAdmin;

  useEffect(() => {
    setMessages([]);
    const initialMsg: Message = {
      id: 'system-welcome',
      text: room.isP2P 
        ? `Чат "${room.name}". ${room.isAdmin ? 'Вы админ.' : ''}`
        : `Комната "${room.name}".`,
      senderId: 'system',
      timestamp: Date.now(),
      isSystem: true
    };
    setMessages([initialMsg]);
  }, [room.id]);

  useEffect(() => {
    const handleP2PMessage = (e: CustomEvent) => {
      if (e.detail.roomId === room.id) {
        const msg = e.detail.message;
        if (msg.text.startsWith('{"attachment":')) {
            try {
                const parsed = JSON.parse(msg.text);
                msg.attachment = parsed.attachment;
                msg.text = ""; 
            } catch(e){}
        }
        setMessages(prev => [...prev, msg]);
      }
    };
    window.addEventListener('p2p-message' as any, handleP2PMessage);
    return () => window.removeEventListener('p2p-message' as any, handleP2PMessage);
  }, [room.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isRecording]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      senderId: currentUser.id,
      timestamp: Date.now(),
      isEncrypted: room.isP2P,
      senderName: currentUser.nickname,
      senderAvatar: currentUser.customAvatar || currentUser.avatarId.toString()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    if (room.isP2P) {
      if (onSendMessageP2P) onSendMessageP2P(userMsg.text);
    } else {
      setIsTyping(true);
      try {
        const botResponseText = await sendMessageToBot(room.id, userMsg.text, room.botPersona);
        setTimeout(() => {
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            text: botResponseText,
            senderId: 'bot-' + room.id,
            timestamp: Date.now()
          };
          setIsTyping(false);
          setMessages(prev => [...prev, botMsg]);
        }, 1000);
      } catch (error) { setIsTyping(false); }
    }
  };

  // ... Recording Logic (Identical to previous, just condensed here) ...
  const startRecording = async () => {
    if (!room.isP2P) { alert("P2P only"); return; }
    try {
      const constraints = recordingMode === 'VIDEO' ? { video: { facingMode: "user", aspectRatio: 1 }, audio: true } : { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (recordingMode === 'VIDEO' && videoPreviewRef.current) videoPreviewRef.current.srcObject = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recordingMode === 'VIDEO' ? 'video/webm' : 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => { sendMediaMessage(reader.result as string); };
        stream.getTracks().forEach(t => t.stop());
        if (videoPreviewRef.current) videoPreviewRef.current.srcObject = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerIntervalRef.current = window.setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch (e) { alert("Microphone/Camera error"); }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };
  const sendMediaMessage = (base64Data: string) => {
     const userMsg: Message = {
        id: Date.now().toString(),
        text: '',
        senderId: currentUser.id,
        timestamp: Date.now(),
        isEncrypted: true,
        senderName: currentUser.nickname,
        senderAvatar: currentUser.customAvatar,
        attachment: { type: recordingMode, data: base64Data, duration: recordingDuration }
     };
     setMessages(prev => [...prev, userMsg]);
     if (onSendMessageP2P) onSendMessageP2P(JSON.stringify({ attachment: userMsg.attachment }));
  };
  const toggleRecordingMode = () => setRecordingMode(prev => prev === 'AUDIO' ? 'VIDEO' : 'AUDIO');
  const handleInvite = () => {
    if (invitePeerId.trim() && onInviteToGroup) {
      onInviteToGroup(room.id, invitePeerId.trim());
      setInvitePeerId('');
      setIsInviteOpen(false);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full relative ${isGlass ? '' : wallpaperClass}`}>
      {isGlass && <div className={`absolute inset-0 z-[-1] ${wallpaperClass} opacity-50`}></div>}

      {/* Recording Preview */}
      {isRecording && recordingMode === 'VIDEO' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
           <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-white shadow-2xl animate-pulse">
              <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
           </div>
        </div>
      )}

      {/* Header */}
      <header className={`h-16 flex items-center px-4 justify-between shrink-0 z-10 ${headerClass}`}>
        <div className="flex items-center min-w-0">
          <button onClick={onMenuClick} className={`md:hidden mr-3 ${subTextColor}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="flex items-center gap-3 min-w-0">
             {room.botPersona.customAvatar ? (
               <img src={`data:image/jpeg;base64,${room.botPersona.customAvatar}`} className="w-9 h-9 rounded-full object-cover" alt="avatar"/>
             ) : (
               <Avatar avatarId={room.botPersona.avatarId} size="sm" />
             )}
             <div className="min-w-0">
               <h3 className={`${textColor} font-bold flex items-center gap-2 truncate`}>{room.name}</h3>
               <p className={`text-xs truncate ${subTextColor}`}>
                 {room.isP2P ? (room.isConnected ? 'Online' : 'Waiting...') : `${room.onlineCount} members`}
               </p>
             </div>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
          {room.isP2P && room.isAdmin && (room.type === 'GROUP' || room.type === 'CHANNEL') && (
            <div className="relative">
              <button onClick={() => setIsInviteOpen(!isInviteOpen)} className={`p-2 rounded-full hover:bg-black/10 ${subTextColor}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25v1.75a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25v-1.75z" /></svg>
              </button>
              {isInviteOpen && (
                <div className={`absolute right-0 top-12 w-64 rounded-lg p-3 shadow-xl z-50 border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <input type="text" value={invitePeerId} onChange={e => setInvitePeerId(e.target.value)} className={`w-full border rounded px-2 py-1 text-sm mb-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`} placeholder="ID..." />
                  <button onClick={handleInvite} className="w-full bg-blue-600 text-white text-xs py-1.5 rounded font-bold">Пригласить</button>
                </div>
              )}
            </div>
          )}
          <button onClick={onStartCall} className={`p-2 rounded-full hover:bg-black/10 ${subTextColor}`}>
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-0">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-4">
                <span className={`text-xs px-3 py-1 rounded-full ${systemMsgClass}`}>
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = msg.senderId === currentUser.id;
          let avatarId = room.botPersona.avatarId;
          let customAvatar = room.botPersona.customAvatar;
          if (isMe) {
             avatarId = currentUser.avatarId;
             customAvatar = currentUser.customAvatar;
          } else if (room.isP2P && room.type !== 'DIRECT') {
             if (msg.senderAvatar && msg.senderAvatar.length > 100) customAvatar = msg.senderAvatar;
             else if (msg.senderAvatar) avatarId = parseInt(msg.senderAvatar);
          }

          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] md:max-w-[60%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && room.type !== 'DIRECT' && (
                   <div className="flex-shrink-0 mr-2 mt-auto">
                     {customAvatar ? <img src={`data:image/jpeg;base64,${customAvatar}`} className="w-8 h-8 rounded-full" /> : <Avatar avatarId={avatarId} size="sm" />}
                   </div>
                )}
                
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                   {/* Name in Groups */}
                   {!isMe && room.type !== 'DIRECT' && (
                      <span className={`text-xs font-bold ml-1 mb-0.5 ${subTextColor}`}>{msg.senderName || 'User'}</span>
                   )}

                   {msg.attachment ? (
                      <div className="rounded-2xl overflow-hidden bg-black shadow-lg">
                         {msg.attachment.type === 'VIDEO' ? (
                             <video src={msg.attachment.data} className="w-48 h-48 object-cover transform -scale-x-100" controls />
                         ) : (
                             <audio src={msg.attachment.data} controls className="w-64 h-10" />
                         )}
                      </div>
                   ) : (
                      <div className={`px-3 py-2 rounded-2xl text-${settings.fontSize} shadow-sm break-words ${isMe ? `rounded-br-none ${messageBubbleMe}` : `rounded-bl-none ${messageBubbleOther}`}`}>
                         {msg.text}
                      </div>
                   )}
                   
                   <span className={`text-[10px] mt-0.5 px-1 ${subTextColor} opacity-70`}>
                     {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                   </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isReadOnly ? (
        <div className={`p-3 shrink-0 z-10 ${inputAreaClass}`}>
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
             {room.isP2P && (
               <button 
                  onClick={toggleRecordingMode}
                  className={`p-2 rounded-full ${subTextColor} hover:bg-black/5`}
               >
                   {recordingMode === 'AUDIO' ? <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg> 
                   : <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
               </button>
             )}
             
             {room.isP2P && (
               <button
                 onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={startRecording} onTouchEnd={stopRecording}
                 className={`p-2 rounded-full transition-colors ${isRecording ? 'text-red-500 animate-pulse' : subTextColor}`}
               >
                  <div className={`w-4 h-4 rounded-full bg-current`}></div>
               </button>
             )}

             <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
               <input
                 type="text"
                 value={inputText}
                 onChange={(e) => setInputText(e.target.value)}
                 placeholder="Сообщение..."
                 className={`flex-1 px-4 py-2 rounded-full border focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white focus:ring-blue-500' : 'bg-gray-100 border-gray-200 text-gray-900 focus:ring-blue-400'}`}
               />
               <button type="submit" disabled={!inputText.trim()} className={`p-2 rounded-full text-white ${theme.primary} ${theme.hover} disabled:opacity-50 shadow`}>
                 <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
               </button>
             </form>
          </div>
        </div>
      ) : (
        <div className={`p-4 text-center text-sm ${subTextColor} ${inputAreaClass}`}>Read Only</div>
      )}
    </div>
  );
};

export default ChatRoom;
