// Singleton global de audio — vive fuera de React
// Cualquier componente puede llamar a play/pause/stop sin importar dónde esté

type AudioState = {
  isPlaying: boolean;
  isLoading: boolean;
  stopName: string;
  playbackRate: number;
  onStateChange?: (state: AudioState) => void;
};

class AudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private state: AudioState = {
    isPlaying: false,
    isLoading: false,
    stopName: '',
    playbackRate: 1.0,
  };

  constructor() {
    // A5: Manejar visibilidad si fuera necesario (HTMLAudioElement lo hace bien nativamente)
    document.addEventListener('visibilitychange', () => {
      // Opcional: pausar si es necesario, aunque en tours suele preferirse que siga
    });
  }

  private notify() {
    this.state.onStateChange?.({ ...this.state });
  }

  setOnStateChange(cb: (state: AudioState) => void) {
    this.state.onStateChange = cb;
  }

  getState(): AudioState {
    return { ...this.state };
  }

  setSpeed(rate: number) {
    this.state.playbackRate = rate;
    if (this.audioElement) {
      this.audioElement.playbackRate = rate;
    }
    this.notify();
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
    this.state.isPlaying = false;
    this.state.isLoading = false;
    this.state.stopName = '';
    this.notify();
  }

  setLoading(stopName: string) {
    this.stop();
    this.state.isLoading = true;
    this.state.stopName = stopName;
    this.notify();
  }

  async play(audioUrl: string, stopName: string, initialSpeed: number = 1.0): Promise<void> {
    this.stop();

    if (!audioUrl) return;

    this.state.isLoading = true;
    this.state.stopName = stopName;
    this.state.playbackRate = initialSpeed;
    this.notify();

    try {
      const audio = new Audio(audioUrl);
      this.audioElement = audio;
      
      // Configurar velocidad
      audio.playbackRate = this.state.playbackRate;
      
      audio.oncanplaythrough = () => {
        if (this.audioElement === audio) {
          this.state.isLoading = false;
          this.state.isPlaying = true;
          this.notify();
          audio.play().catch(e => console.error("Playback failed:", e));
        }
      };

      audio.onended = () => {
        if (this.audioElement === audio) {
          this.stop();
        }
      };

      audio.onerror = () => {
        if (this.audioElement === audio) {
          console.error("Audio element error");
          this.stop();
        }
      };

    } catch (e) {
      console.error("AudioManager play error:", e);
      this.stop();
    }
  }
}

// Exportar instancia única global
export const audioManager = new AudioManager();
export type { AudioState };
