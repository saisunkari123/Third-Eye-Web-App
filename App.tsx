import React, { useState, useEffect } from 'react';
import { AppMode, AppTheme, Settings } from './types';
import { MODE_CONFIG, Icons } from './constants';
import CameraView from './components/CameraView';
import ModeSelector from './components/ModeSelector';
import ResultView from './components/ResultView';
import SettingsOverlay from './components/SettingsOverlay';
import { analyzeImage } from './services/geminiService';
import { speechService } from './services/speechService';

// Note: VoiceCommandService removed to prevent microphone errors on mobile.

const App: React.FC = () => {
  // State
  const [hasStarted, setHasStarted] = useState(false); 
  const [theme, setTheme] = useState<AppTheme>(AppTheme.NEO_BLUE);
  const [mode, setMode] = useState<AppMode>(AppMode.SCENE);
  const [settings, setSettings] = useState<Settings>({
    voiceSpeed: 1.0,
    hapticsEnabled: true,
    voiceGender: 'female',
    autoFlash: false,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [captureTrigger, setCaptureTrigger] = useState<number>(0);

  // --- ACTION HANDLERS ---
  const handleStartApp = async () => {
    // 1. CRITICAL: Unlock Audio Engine (TTS) immediately on User Interaction
    speechService.resume(); 

    try {
        // 2. Request CAMERA ONLY (No Audio)
        // This fixes the mobile error where requesting mic causes a crash or block
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // Cleanup streams (CameraView will request its own fresh stream)
        stream.getTracks().forEach(track => track.stop());

        setHasStarted(true);

        // 3. Success Welcome Message
        setTimeout(() => {
            speechService.speak("Third Eye active. Tap to describe.", settings);
        }, 200);

    } catch (err: any) {
         console.error("Critical Permission Error:", err);
         
         // Construct specific helpful error message
         let message = "Could not access Camera.";
         
         if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
             message = "⚠️ PERMISSION BLOCKED\n\nYour browser has blocked access.\n\nTO FIX:\n1. Tap the Lock icon 🔒 in the address bar.\n2. Tap 'Permissions'.\n3. Turn ON Camera.\n4. Refresh the page.";
         } else if (err.name === 'NotFoundError') {
             message = "No camera hardware found on this device.";
         } else if (err.name === 'NotReadableError') {
             message = "Camera is in use by another app. Please close other apps and try again.";
         } else {
             message = `Camera Error: ${err.message || err.name}. Please refresh.`;
         }
         
         alert(message);
    }
  };

  const handleCapture = async (imageSrc: string) => {
    if (isProcessing) return;

    // Wake up TTS engine again just in case
    speechService.resume(); 

    setIsProcessing(true);
    speechService.stop(); 
    setCapturedImage(imageSrc);
    
    if (settings.hapticsEnabled && navigator.vibrate) navigator.vibrate([50, 50, 50]);
    
    // Announce triggers immediate feedback
    speechService.announce("Analyzing...");

    const text = await analyzeImage(imageSrc, mode);

    setIsProcessing(false);
    setResultText(text);
    
    // Play result
    setTimeout(() => {
        speechService.speak(text, settings);
    }, 100);
  };

  const handleReplay = () => {
    if (resultText) {
      speechService.speak(resultText, settings);
    }
  };

  const handleCloseResult = () => {
    setResultText(null);
    setCapturedImage(null);
    speechService.stop();
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // --- RENDER ---

  // 1. Landing Screen (Forces Permission Interaction)
  if (!hasStarted) {
      return (
          <main className="w-full h-dvh flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
              <div className="mb-8 p-6 bg-blue-600 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.5)]">
                  <Icons.Eye className="w-16 h-16 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4 tracking-tight">THIRD EYE</h1>
              <p className="text-slate-300 mb-12 max-w-xs text-lg leading-relaxed">
                  Your intelligent AI scene narrator.
                  <br/><br/>
                  <span className="text-sm opacity-80">We need access to your <b>Camera</b> to see.</span>
              </p>
              
              <button 
                  onClick={handleStartApp}
                  className="w-full max-w-sm py-4 bg-white text-blue-900 font-bold text-xl rounded-2xl shadow-xl active:scale-95 transition-transform"
              >
                  Grant Access & Enter
              </button>
          </main>
      );
  }

  // 2. Main App Interface
  return (
    <main className={`relative w-full h-dvh overflow-hidden flex flex-col ${theme === AppTheme.HIGH_CONTRAST ? 'font-mono' : 'font-sans'}`}>
      
      <div className="flex-1 relative overflow-hidden">
        <CameraView 
            mode={mode}
            theme={theme}
            onCapture={handleCapture}
            onSettingsClick={() => setIsSettingsOpen(true)}
            isProcessing={isProcessing}
            captureTrigger={captureTrigger}
        />

        {!resultText && (
            <ModeSelector 
            currentMode={mode} 
            setMode={(m) => {
                setMode(m);
                // Announce mode change
                speechService.announce(MODE_CONFIG[m].voicePrompt);
            }} 
            theme={theme}
            onCaptureClick={() => setCaptureTrigger(Date.now())}
            />
        )}
      </div>

      {resultText && (
        <ResultView 
          text={resultText}
          imageSrc={capturedImage || ''}
          theme={theme}
          onClose={handleCloseResult}
          onReplay={handleReplay}
        />
      )}

      <SettingsOverlay 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        settings={settings}
        updateSettings={updateSettings}
      />
    </main>
  );
};

export default App;