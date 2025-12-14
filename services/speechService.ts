import { Settings } from '../types';

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
      
      // Attempt to load voices immediately
      this.loadVoices();
      
      // Safari/Mobile often loads voices asynchronously
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  private loadVoices() {
    if (!this.synth) return;
    const available = this.synth.getVoices();
    if (available.length > 0) {
      this.voices = available;
    }
  }

  /**
   * CRITICAL FOR MOBILE:
   * This must be called inside a direct user interaction (click/touch).
   * It plays a silent utterance to unlock the audio engine.
   */
  public resume() {
    if (!this.synth) return;

    if (this.synth.paused) {
      this.synth.resume();
    }
    
    // Create a dummy utterance to force the engine to wake up
    // We do NOT cancel here immediately, as that might kill the wakeup attempt on some engines.
    const warmUp = new SpeechSynthesisUtterance(" ");
    warmUp.volume = 0; // Silent
    warmUp.rate = 1.0;
    this.synth.speak(warmUp);
  }

  public speak(text: string, settings: Settings) {
    if (!this.synth || !text) return;

    // 1. Cancel any currently speaking text to avoid queue buildup
    this.synth.cancel();

    // 2. Refresh voices if needed (Android Chrome sometimes loses them)
    if (this.voices.length === 0) {
      this.loadVoices();
    }

    const cleanText = text.replace(/[*#_`]/g, ' ').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = settings.voiceSpeed || 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    // 3. Select Voice
    const selectedVoice = this.getBestVoice(settings);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // 4. Events
    utterance.onend = () => {
      this.currentUtterance = null;
    };
    utterance.onerror = (e) => {
      // 'interrupted' is normal if we click fast. 
      if (e.error !== 'interrupted') {
          console.warn("TTS Error:", e.error);
      }
      this.currentUtterance = null;
    };

    this.currentUtterance = utterance;

    // 5. Speak
    try {
        this.synth.speak(utterance);
        
        // Mobile Chrome Fix:
        // Sometimes the synth gets stuck in a paused state even if we didn't pause it.
        if (this.synth.paused) {
            this.synth.resume();
        }
    } catch (e) {
        console.error("Speak execution failed:", e);
    }
  }

  private getBestVoice(settings: Settings): SpeechSynthesisVoice | undefined {
    if (this.voices.length === 0) return undefined;

    const englishVoices = this.voices.filter(v => v.lang.startsWith('en'));
    const pool = englishVoices.length > 0 ? englishVoices : this.voices;

    let preferred: SpeechSynthesisVoice | undefined;
    const isFemale = settings.voiceGender === 'female';
    const isMale = settings.voiceGender === 'male';

    if (isFemale) {
      preferred = pool.find(v => 
        v.name.includes("Samantha") || 
        v.name.includes("Google US English") || 
        v.name.includes("Zira") ||
        (v.name.toLowerCase().includes("female") && !v.name.toLowerCase().includes("male"))
      );
    } else if (isMale) {
       preferred = pool.find(v => 
        v.name.includes("Daniel") || 
        v.name.includes("Google UK English Male") ||
        v.name.toLowerCase().includes("male")
      );
    }

    return preferred || pool[0];
  }

  public stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public announce(text: string) {
    if (!this.synth) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.2; 
    utterance.lang = 'en-US';
    this.synth.speak(utterance);
  }
}

export const speechService = new SpeechService();