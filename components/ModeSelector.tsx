import React from 'react';
import { AppMode, AppTheme } from '../types';
import { MODE_CONFIG, Icons } from '../constants';

interface ModeSelectorProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  theme: AppTheme;
  onCaptureClick: () => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, setMode, theme, onCaptureClick }) => {
  
  const leftModes = [AppMode.SCENE, AppMode.PEOPLE];
  const rightModes = [AppMode.TEXT, AppMode.OBJECT];

  const getStyles = () => {
    switch(theme) {
        case AppTheme.HIGH_CONTRAST:
            return {
                bar: "bg-black border-t-4 border-yellow-400",
                btnActive: "bg-yellow-400 text-black",
                btnInactive: "text-yellow-400",
                shutter: "bg-yellow-400 border-4 border-white text-black"
            };
        case AppTheme.SOFT_GLOW:
             return {
                bar: "bg-slate-900/95 backdrop-blur-xl border-t border-white/20",
                btnActive: "text-cyan-400 drop-shadow-glow",
                btnInactive: "text-slate-400",
                shutter: "bg-gradient-to-tr from-cyan-500 to-purple-500 shadow-glow text-white"
            };
        case AppTheme.NEO_BLUE:
        default:
            return {
                bar: "bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]",
                btnActive: "text-blue-700 bg-blue-100/50 rounded-xl",
                btnInactive: "text-slate-500",
                shutter: "bg-blue-600 text-white shadow-xl active:bg-blue-700 ring-4 ring-blue-50"
            };
    }
  }

  const styles = getStyles();

  const renderModeBtn = (mode: AppMode) => {
    const isActive = currentMode === mode;
    const config = MODE_CONFIG[mode];
    return (
        <button
            key={mode}
            onClick={(e) => { e.stopPropagation(); setMode(mode); }}
            className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 ${isActive ? styles.btnActive : styles.btnInactive}`}
            style={{ minWidth: '70px' }} 
        >
            <div className={`transform transition-transform mb-1 ${isActive ? 'scale-110' : 'scale-100'}`}>
               {React.cloneElement(config.icon as React.ReactElement<{ className?: string }>, { className: "w-7 h-7" })}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {config.label}
            </span>
        </button>
    )
  }

  return (
    <div 
      className={`absolute bottom-0 left-0 right-0 z-30 pb-safe-bottom h-28 flex items-end justify-between px-2 ${styles.bar}`}
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="w-full flex items-center justify-between pb-2">
        {/* Left Modes */}
        <div className="flex gap-2 justify-center flex-1">
            {leftModes.map(renderModeBtn)}
        </div>

        {/* Center Shutter Button - Floating */}
        <div className="flex-shrink-0 mx-2 -mt-12 relative z-40">
            <button
                onClick={(e) => { e.stopPropagation(); onCaptureClick(); }}
                className={`w-20 h-20 rounded-full flex items-center justify-center transform active:scale-95 transition-all shadow-2xl ${styles.shutter}`}
                aria-label="Capture and Describe"
            >
                <Icons.Camera className="w-9 h-9" />
            </button>
        </div>

        {/* Right Modes */}
        <div className="flex gap-2 justify-center flex-1">
            {rightModes.map(renderModeBtn)}
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;