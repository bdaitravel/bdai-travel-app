// Singleton global de audio — vive fuera de React
// Cualquier componente puede llamar a play/pause/stop sin importar dónde esté

type AudioState = {
  isPlaying: boolean;
  isLoading: boolean;
  stopName: string;
  playbackRate: number;
  onStateChange?: (state: AudioState) => void;
};

type Listener = (state: AudioState) => void;

class AudioManager {
  private audioElement: HTMLAudioElement | null = null;
  private state: AudioState = {
    isPlaying: false,
    isLoading: false,
    stopName: '',
    playbackRate: 1.0,
  };
  private listeners: Set<Listener> = new Set();

  constructor() {
    document.addEventListener('visibilitychange', () => {});
  }

  private notify() {
    this.listeners.forEach((cb) => cb({ ...this.state }));
  }

  subscribe(cb: Listener) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
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
      audio.playbackRate = this.state.playbackRate;
      
      // Manejo programático de promesa (arregla el bug de la caché y oncanplaythrough)
      audio.play().then(() => {
        if (this.audioElement === audio) {
          this.state.isLoading = false;
          this.state.isPlaying = true;
          this.notify();
        }
      }).catch(e => {
        console.error("Playback failed:", e);
        if (this.audioElement === audio) {
          this.stop();
        }
      });

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
