// Text-to-Speech Service for Kisan GPT
export class TTSService {
  private synth: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[];
  private defaultRate: number = 0.9;
  private defaultPitch: number = 1;
  private defaultVolume: number = 0.8;

  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.loadVoices();
  }

  private loadVoices(): void {
    this.voices = this.synth.getVoices();
    
    // Load voices when they become available
    if (this.voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }
  }

  private getHindiVoice(): SpeechSynthesisVoice | null {
    // Try to find Hindi voice
    const hindiVoice = this.voices.find(voice => 
      voice.lang.includes('hi') || 
      voice.lang.includes('Hindi') ||
      voice.name.includes('Hindi')
    );
    
    if (hindiVoice) return hindiVoice;
    
    // Fallback to any Indian English voice
    const indianEnglishVoice = this.voices.find(voice => 
      voice.lang.includes('en-IN') || 
      voice.name.includes('Indian')
    );
    
    return indianEnglishVoice || this.voices[0] || null;
  }

  public speak(text: string, language: 'hi' | 'en' = 'hi'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any ongoing speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice based on language
      if (language === 'hi') {
        const hindiVoice = this.getHindiVoice();
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }
        utterance.lang = 'hi-IN';
      } else {
        utterance.lang = 'en-US';
      }

      // Set speech parameters
      utterance.rate = this.defaultRate;
      utterance.pitch = this.defaultPitch;
      utterance.volume = this.defaultVolume;

      // Event handlers
      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));
      utterance.onstart = () => console.log('TTS: Started speaking');

      // Start speaking
      this.synth.speak(utterance);
    });
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  public pause(): void {
    if (this.synth) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth) {
      this.synth.resume();
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }

  public isPaused(): boolean {
    return this.synth ? this.synth.paused : false;
  }

  // Predefined farming messages in Hindi
  public speakFarmingTip(tip: string): Promise<void> {
    const hindiIntro = 'किसान मित्र, यहाँ आपके लिए एक उपयोगी सलाह है: ';
    return this.speak(`${hindiIntro}${tip}`, 'hi');
  }

  public speakWeatherUpdate(weather: string): Promise<void> {
    const hindiIntro = 'आज का मौसम अपडेट: ';
    return this.speak(`${hindiIntro}${weather}`, 'hi');
  }

  public speakPriceUpdate(crop: string, price: string): Promise<void> {
    const hindiMessage = `${crop} का आज का भाव ${price} रुपए प्रति क्विंटल है।`;
    return this.speak(hindiMessage, 'hi');
  }

  public speakDiseaseDetection(disease: string, treatment: string): Promise<void> {
    const hindiMessage = `आपकी फसल में ${disease} की समस्या हो सकती है। उपचार: ${treatment}`;
    return this.speak(hindiMessage, 'hi');
  }

  public speakMotivationalMessage(): Promise<void> {
    const motivationalMessages = [
      'आपकी मेहनत जरूर रंग लाएगी। किसानी एक महान काम है।',
      'हर बीज में एक पेड़ का सपना होता है, हर मेहनत में सफलता का वादा होता है।',
      'आप देश के अन्नदाता हैं, आपका काम सबसे महत्वपूर्ण है।',
      'धैर्य और मेहनत से हर समस्या का समाधान मिलता है।',
      'आपकी खुशी हमारी खुशी है, आपकी सफलता हमारा गर्व है।'
    ];
    
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    return this.speak(randomMessage, 'hi');
  }

  // Backend API integration for TTS
  public async speakWithBackend(text: string, language: 'hi' | 'en' = 'hi'): Promise<void> {
    try {
      const response = await fetch('http://localhost:8000/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: language,
          voice_type: 'farmer_friendly',
          speed: 0.9,
          pitch: 1.0
        })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        return new Promise((resolve, reject) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            resolve();
          };
          audio.onerror = () => reject(new Error('Audio playback failed'));
          audio.play();
        });
      } else {
        // Fallback to browser TTS
        return this.speak(text, language);
      }
    } catch (error) {
      console.warn('Backend TTS failed, using browser TTS:', error);
      return this.speak(text, language);
    }
  }
}

// Create a singleton instance
export const ttsService = new TTSService();