import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Icons, MODE_CONFIG } from '../constants';
import { AppMode, AppTheme } from '../types';

interface CameraViewProps {
  mode: AppMode;
  theme: AppTheme;
  onCapture: (imageSrc: string) => void;
  onSettingsClick: () => void;
  isProcessing: boolean;
  captureTrigger?: number;
}

const CameraView: React.FC<CameraViewProps> = ({
  mode,
  theme,
  onCapture,
  onSettingsClick,
  isProcessing,
  captureTrigger
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // --- STATE ---
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Camera Configuration
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isMirrored, setIsMirrored] = useState<boolean>(false); // Software mirror toggle
  
  const [isFocusing, setIsFocusing] = useState(false);

  // --- STREAM MANAGEMENT ---
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startStream = async (targetFacingMode: 'user' | 'environment', deviceId?: string) => {
    stopStream();
    setError(null);
    
    // Short pause to ensure track cleanup
    await new Promise(r => setTimeout(r, 100)); 

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId } } 
          : { facingMode: targetFacingMode }
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        try {
            await videoRef.current.play();
        } catch (e) {
            console.warn("Autoplay blocked/failed", e);
        }
      }

      const track = newStream.getVideoTracks()[0];
      const settings = track.getSettings();
      
      // Update Mirror State automatically based on camera type
      if (!deviceId && hasMultipleCameras) {
          setIsMirrored(targetFacingMode === 'user');
      }

      // Trigger Focus Animation
      setIsFocusing(true);
      setTimeout(() => setIsFocusing(false), 1500);

    } catch (err: any) {
      console.error("Camera start failed:", err);
      
      // Fallback: Just get ANY video if environment failed
      if (targetFacingMode === 'environment') {
          try {
             const looseStream = await navigator.mediaDevices.getUserMedia({ video: true });
             setStream(looseStream);
             if (videoRef.current) videoRef.current.srcObject = looseStream;
             return; // Recovered
          } catch(e) { console.error("Critical camera failure", e); }
      }

      // If we reach here, it failed completely
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError("Access Denied: Tap the Lock icon 🔒 in the URL bar to allow Camera.");
      } else {
          setError("Camera Error: " + (err.message || "Unknown"));
      }
    }
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // 1. Initial Check - Since App.tsx already requested permissions, this should be fast
        const initialStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        
        // 2. Check Devices
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = allDevices.filter(d => d.kind === 'videoinput');
        
        if (mounted) {
            setHasMultipleCameras(videoDevs.length > 1);
            setStream(initialStream);
            setFacingMode('environment');
            setIsMirrored(false);

            if (videoRef.current) {
                videoRef.current.srcObject = initialStream;
                videoRef.current.play().catch(console.warn);
            }
        }
      } catch (e: any) {
        console.error("Init Error:", e);
        if (mounted) {
             if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
                 setError("Tap 🔒 in URL bar -> Permissions -> Allow Camera");
             } else {
                 setError("Could not start camera.");
             }
        }
        
        // Try fallback (Laptop/Selfie cam)
        try {
             const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
             if (mounted) {
                 setError(null);
                 setStream(fallbackStream);
                 setFacingMode('user');
                 setIsMirrored(true);
                 if (videoRef.current) videoRef.current.srcObject = fallbackStream;
             }
        } catch (err2) {
             // Keep error
        }
      }
    };

    init();
    return () => { mounted = false; stopStream(); };
  }, []);

  // --- TOGGLE LOGIC ---
  const handleCameraToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (hasMultipleCameras) {
        // MOBILE / MULTI-CAM BEHAVIOR: Switch Front/Back
        const nextMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(nextMode);
        await startStream(nextMode);
    } else {
        // PC / SINGLE-CAM BEHAVIOR: Toggle Mirror (Selfie vs Exact)
        setIsMirrored(prev => !prev);
    }
  };

  // --- CAPTURE LOGIC ---
  const performCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current && !isProcessing && !error) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        // OPTIMIZATION: Limit capture resolution
        const MAX_SIZE = 1024;
        let { videoWidth, videoHeight } = video;
        
        if (videoWidth > MAX_SIZE || videoHeight > MAX_SIZE) {
            const ratio = Math.min(MAX_SIZE / videoWidth, MAX_SIZE / videoHeight);
            videoWidth = Math.round(videoWidth * ratio);
            videoHeight = Math.round(videoHeight * ratio);
        }

        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Flip context ONLY if mirrored
          if (isMirrored) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -videoWidth, 0, videoWidth, videoHeight);
            ctx.restore();
          } else {
            ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
          }

          const imageSrc = canvas.toDataURL('image/jpeg', 0.85);
          onCapture(imageSrc);
        }
      }
    }
  }, [onCapture, isProcessing, isMirrored, error]);

  useEffect(() => {
    if (captureTrigger && captureTrigger > 0) performCapture();
  }, [captureTrigger, performCapture]);


  // --- STYLES ---
  const getThemeStyles = () => {
    switch (theme) {
      case AppTheme.HIGH_CONTRAST:
        return {
          container: "bg-black",
          badge: "bg-yellow-400 text-black border-2 border-white",
          focus: "border-yellow-400",
        };
      case AppTheme.SOFT_GLOW:
        return {
          container: "bg-slate-900",
          badge: "bg-white/10 backdrop-blur-md border border-white/20 text-white",
          focus: "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]",
        };
      case AppTheme.NEO_BLUE:
      default:
        return {
          container: "bg-gray-100",
          badge: "bg-white/90 shadow-sm text-neo-accent font-semibold",
          focus: "border-white",
        };
    }
  };

  const styles = getThemeStyles();

  // Determine Badge Label
  let camBadgeLabel = "";
  if (hasMultipleCameras) {
      camBadgeLabel = facingMode === 'user' ? 'Front' : 'Back';
  } else {
      camBadgeLabel = isMirrored ? 'Selfie' : 'Exact';
  }

  return (
    <button
      onClick={performCapture}
      disabled={isProcessing || !!error}
      className={`relative w-full h-full flex flex-col overflow-hidden text-left focus:outline-none ${styles.container}`}
      aria-label="Tap to capture image"
    >
      <canvas ref={canvasRef} className="hidden" />

      {/* Controls Overlay */}
      <div
        className="absolute top-0 left-0 right-0 z-20 p-4 pt-safe-top flex justify-between items-start"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleCameraToggle}
          className={`p-3 rounded-full ${styles.badge} flex items-center gap-2 shadow-lg active:scale-95 transition-transform`}
        >
          <Icons.SwitchCamera className="w-8 h-8" />
          <span className="text-xs font-bold uppercase px-1 w-12 text-center">
             {camBadgeLabel}
          </span>
        </button>

        <button
          onClick={onSettingsClick}
          className={`p-3 rounded-full ${styles.badge} shadow-lg active:scale-95 transition-transform`}
        >
          <Icons.Settings className="w-8 h-8" />
        </button>
      </div>

      <div className="flex-1 relative w-full h-full bg-black pointer-events-none">
        
        {/* VIDEO ELEMENT */}
        {!error ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-transform duration-300 ${isMirrored ? 'scale-x-[-1]' : 'scale-x-1'}`}
            />
        ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-50 bg-black/80">
                <Icons.X className="w-12 h-12 mb-2 text-red-500" />
                <p className="font-bold text-lg">Permission Error</p>
                <p className="text-sm mt-2 opacity-90 max-w-xs whitespace-pre-line leading-relaxed">
                    {error}
                </p>
            </div>
        )}

        {isFocusing && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className={`w-64 h-64 border border-opacity-30 rounded-lg animate-pulse ${styles.focus}`} />
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 backdrop-blur-sm">
             <div className="w-16 h-16 border-4 border-t-transparent border-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    </button>
  );
};

export default CameraView;