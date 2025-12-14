import React from 'react';
import { Icons } from '../constants';
import { AppTheme } from '../types';

interface ResultViewProps {
  text: string;
  imageSrc: string;
  theme: AppTheme;
  onClose: () => void;
  onReplay: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ text, imageSrc, theme, onClose, onReplay }) => {
  
  const getThemeStyles = () => {
    switch (theme) {
      case AppTheme.HIGH_CONTRAST:
        return {
          bg: "bg-black",
          text: "text-yellow-400",
          buttonPrimary: "bg-yellow-400 text-black border-2 border-yellow-400",
          buttonSecondary: "bg-black text-yellow-400 border-2 border-yellow-400",
          bottomBar: "border-t-2 border-yellow-400 bg-black"
        };
      case AppTheme.SOFT_GLOW:
        return {
          bg: "bg-slate-900",
          text: "text-white",
          buttonPrimary: "bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-glow",
          buttonSecondary: "bg-white/10 text-white",
          bottomBar: "bg-slate-900/90 border-t border-white/10 backdrop-blur-md"
        };
      case AppTheme.NEO_BLUE:
      default:
        return {
          bg: "bg-slate-50",
          text: "text-slate-900",
          buttonPrimary: "bg-neo-accent text-white",
          buttonSecondary: "bg-white text-slate-800 border border-slate-200",
          bottomBar: "bg-white border-t border-slate-200"
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className={`absolute inset-0 z-40 flex flex-col h-full ${styles.bg}`}>
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 pt-safe-top z-10">
        <button 
          onClick={onClose}
          className={`p-2 rounded-full ${styles.buttonSecondary}`}
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </button>
        <span className={`font-bold ${styles.text}`}>Analysis Result</span>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Main Content (Scrollable) */}
      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col items-center pb-4">
        {/* Captured Image */}
        <div className="w-full max-w-md p-4 flex justify-center">
           {imageSrc && (
             <img 
               src={imageSrc} 
               alt="Captured Scene" 
               className="w-auto h-auto max-h-[40vh] rounded-lg shadow-md object-contain bg-black/5"
             />
           )}
        </div>

        {/* Text Description */}
        <div className="w-full max-w-lg px-6">
          <p className={`text-lg md:text-xl leading-relaxed font-medium ${styles.text}`}>
            {text}
          </p>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className={`p-4 pb-safe-bottom flex justify-around items-center ${styles.bottomBar}`}>
        
        <button
          onClick={onReplay}
          className="flex flex-col items-center gap-1 min-w-[64px]"
        >
          <div className={`p-3 rounded-full ${styles.buttonPrimary}`}>
             <Icons.Play className="w-6 h-6" />
          </div>
          <span className={`text-xs font-semibold ${styles.text}`}>Replay</span>
        </button>

        <button
          onClick={() => {
              if (navigator.share) {
                  navigator.share({
                      title: 'Third Eye Description',
                      text: text,
                  }).catch(console.error);
              } else {
                 navigator.clipboard.writeText(text);
                 alert("Text copied");
              }
          }}
          className="flex flex-col items-center gap-1 min-w-[64px]"
        >
           <div className={`p-3 rounded-full ${styles.buttonSecondary}`}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
           </div>
           <span className={`text-xs font-semibold ${styles.text}`}>Share</span>
        </button>

        <button
          onClick={onClose}
           className="flex flex-col items-center gap-1 min-w-[64px]"
        >
           <div className={`p-3 rounded-full ${styles.buttonSecondary}`}>
              <Icons.Camera className="w-6 h-6" />
           </div>
           <span className={`text-xs font-semibold ${styles.text}`}>New</span>
        </button>

      </div>
    </div>
  );
};

export default ResultView;