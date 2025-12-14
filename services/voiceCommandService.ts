
export type CommandCallback = (command: string) => void;

class VoiceCommandService {
  recognition: any;
  isListening: boolean = false;
  callback: CommandCallback | null = null;

  constructor() {
    // Support for Chrome/Edge (webkit) and standard browsers
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true; // Attempt to keep open
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  }

  start(onCommand: CommandCallback) {
    if (!this.recognition) return;
    
    // Setup state
    this.callback = onCommand;
    this.isListening = true;
    
    // Result Handler
    this.recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.trim().toLowerCase();
      if (this.callback) this.callback(command);
    };

    // Error Handler
    this.recognition.onerror = (event: any) => {
        // 'no-speech' is a common timeout event when the user is silent.
        // We explicitly ignore it here so the 'onend' handler can restart the service.
        if (event.error === 'no-speech') {
            // console.debug("Silence detected (no-speech), restarting...");
        } else if (event.error === 'not-allowed') {
            console.error("Microphone permission denied.");
            this.isListening = false; // Stop trying if permission is denied
        } else {
            console.warn("Speech recognition error:", event.error);
        }
    };

    // End Handler (Auto-restart)
    this.recognition.onend = () => {
      // If we are supposed to be listening, restart the engine.
      if (this.isListening) {
        // Add a small delay (debounce) to prevent CPU churning if the browser loops rapidly
        setTimeout(() => {
            if (this.isListening) {
                try {
                    this.recognition.start();
                } catch (e) {
                    // Ignore 'already started' errors
                }
            }
        }, 300);
      }
    };

    // Initial Start
    try {
        this.recognition.start();
    } catch(e) {
        // If already started, just ignore
    }
  }

  stop() {
    if (!this.recognition) return;
    this.isListening = false;
    this.recognition.stop();
  }
}

export const voiceCommandService = new VoiceCommandService();
