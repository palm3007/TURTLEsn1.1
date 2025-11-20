
import React, { useState, useEffect } from 'react';

interface RadarModalProps {
  onClose: () => void;
  onScan: () => Promise<void>;
}

const RadarModal: React.FC<RadarModalProps> = ({ onClose, onScan }) => {
  const [status, setStatus] = useState<'PERMISSION' | 'SCANNING' | 'FOUND' | 'ERROR'>('PERMISSION');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    startScan();
  }, []);

  const startScan = async () => {
    setStatus('SCANNING');
    try {
      await onScan();
      // If scan returns (it typically sets up the room in App.tsx), we close automatically or show success
      setStatus('FOUND');
      setTimeout(onClose, 1500);
    } catch (e: any) {
      setStatus('ERROR');
      setErrorMsg(e.message || "Ошибка доступа к геопозиции");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
       <div className="bg-gray-900 border border-green-500/30 rounded-2xl w-full max-w-sm p-8 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden text-center">
          
          {/* CRT Effect Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>

          <button onClick={onClose} className="absolute top-4 right-4 text-green-500/50 hover:text-green-400 z-20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold text-green-500 font-mono mb-2 tracking-wider">GHOST RADAR</h2>
          <p className="text-xs text-green-500/60 font-mono mb-8 uppercase">Безопасный поиск • Радиус ~11км</p>

          {status === 'SCANNING' && (
            <div className="relative w-48 h-48 mx-auto mb-8">
               <div className="absolute inset-0 border-2 border-green-500/30 rounded-full bg-green-500/5"></div>
               <div className="absolute inset-4 border border-green-500/20 rounded-full"></div>
               <div className="absolute inset-12 border border-green-500/10 rounded-full"></div>
               {/* Radar Sweep */}
               <div className="absolute inset-0 w-full h-full rounded-full animate-[spin_2s_linear_infinite] bg-gradient-to-r from-transparent via-green-500/20 to-transparent opacity-50" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 50%)' }}></div>
               
               <div className="absolute inset-0 flex items-center justify-center">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
               </div>
            </div>
          )}

          {status === 'FOUND' && (
             <div className="w-48 h-48 mx-auto mb-8 flex items-center justify-center">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-green-500/50">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="black" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                </div>
             </div>
          )}

          {status === 'ERROR' && (
             <div className="mb-6 text-red-400 font-mono text-sm border border-red-500/30 p-4 rounded bg-red-900/20">
                {errorMsg}
             </div>
          )}

          <div className="text-green-400/80 font-mono text-xs space-y-1">
             <p>Ваши координаты округляются.</p>
             <p>Точная геопозиция скрыта.</p>
          </div>

          {status === 'ERROR' && (
             <button onClick={startScan} className="mt-6 w-full py-2 border border-green-500 text-green-500 font-mono hover:bg-green-500/20 transition-colors rounded">
                ПОВТОРИТЬ
             </button>
          )}
       </div>
    </div>
  );
};

export default RadarModal;
