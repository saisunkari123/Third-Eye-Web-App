import React from 'react';
import { Icons } from '../constants';
import { AppTheme, Settings } from '../types';

interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
}

const SettingsOverlay: React.FC<SettingsOverlayProps> = ({ 
  isOpen, onClose, theme, setTheme, settings, updateSettings 
}) => {
  if (!isOpen) return null;

  const themes = [
    { id: AppTheme.NEO_BLUE, name: 'Neo Blue', color: 'bg-blue-600' },
    { id: AppTheme.HIGH_CONTRAST, name: 'High Contrast', color: 'bg-yellow-400' },
    { id: AppTheme.SOFT_GLOW, name: 'Soft AI', color: 'bg-purple-600' },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex justify-end">
      <div className="w-full sm:w-96 bg-white dark:bg-slate-900 h-full p-6 overflow-y-auto shadow-2xl animate-slide-in">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold dark:text-white text-slate-900">Settings</h2>
          <button onClick={onClose} className="p-2 dark:text-white">
            <Icons.X className="w-8 h-8" />
          </button>
        </div>

        <div className="space-y-8">
          
          {/* Theme Selection */}
          <section>
            <h3 className="text-lg font-semibold mb-4 dark:text-slate-300">Visual Theme</h3>
            <div className="grid grid-cols-1 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center p-4 rounded-xl border-2 transition-all
                    ${theme === t.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}
                  `}
                >
                  <div className={`w-8 h-8 rounded-full ${t.color} mr-4`} />
                  <span className="font-medium text-lg dark:text-white">{t.name}</span>
                  {theme === t.id && <div className="ml-auto text-blue-500 font-bold">Active</div>}
                </button>
              ))}
            </div>
          </section>

          {/* Voice Speed */}
          <section>
            <h3 className="text-lg font-semibold mb-4 dark:text-slate-300">Voice Speed ({settings.voiceSpeed}x)</h3>
            <input 
              type="range" 
              min="0.5" 
              max="2.0" 
              step="0.1"
              value={settings.voiceSpeed}
              onChange={(e) => updateSettings({ voiceSpeed: parseFloat(e.target.value) })}
              className="w-full h-12 accent-blue-600"
            />
          </section>

          {/* Haptics */}
          <section className="flex justify-between items-center py-4 border-t border-gray-200 dark:border-gray-800">
            <span className="text-lg font-medium dark:text-white">Haptic Feedback</span>
            <button 
              onClick={() => updateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
              className={`w-16 h-8 rounded-full transition-colors relative ${settings.hapticsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${settings.hapticsEnabled ? 'left-9' : 'left-1'}`} />
            </button>
          </section>

          {/* Gender */}
           <section>
            <h3 className="text-lg font-semibold mb-4 dark:text-slate-300">Voice Type</h3>
            <div className="flex gap-2">
              {(['male', 'female', 'default'] as const).map((g) => (
                 <button
                  key={g}
                  onClick={() => updateSettings({ voiceGender: g })}
                  className={`flex-1 py-3 rounded-lg border font-medium capitalize
                    ${settings.voiceGender === g ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 dark:border-gray-700 dark:text-white'}
                  `}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default SettingsOverlay;
