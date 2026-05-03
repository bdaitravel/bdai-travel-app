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
  private audioElement: HTMLAudioElement;
  private state: AudioState = {
    isPlaying: false,
    isLoading: false,
    stopName: '',
    playbackRate: 1.0,
  };
  private listeners: Set<Listener> = new Set();
  private currentPlayPromise: Promise<void> | null = null;

  constructor() {
    // 💡 SOLUCIÓN: Reutilizar un ÚNICO elemento de audio.
    // iOS/Safari limitan a ~3 los decodificadores por hardware. Crear 'new Audio()'
    // constantemente sin liberarlos colapsa el reproductor tras 3-4 paradas.
    this.audioElement = new Audio();
    
    // Configurar listeners persistentes en el elemento único
    this.audioElement.onended = () => {
      this.stop();
    };

    this.audioElement.onerror = () => {
      console.error("Audio element error");
      this.stop();
    };

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
    this.audioElement.playbackRate = rate;
    this.notify();
  }

  stop() {
    this.audioElement.pause();
    this.audioElement.currentTime = 0;
    
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
      this.audioElement.src = audioUrl;
      this.audioElement.playbackRate = this.state.playbackRate;
      this.audioElement.load(); // Forzar recarga del nuevo src
      
      this.currentPlayPromise = this.audioElement.play();
      
      this.currentPlayPromise
        .then(() => {
          this.state.isLoading = false;
          this.state.isPlaying = true;
          this.notify();
        })
        .catch(e => {
          // Ignorar errores de "AbortError" (ocurren al llamar a stop() rápidamente antes de que empiece a sonar)
          if (e.name !== 'AbortError') {
            console.error("Playback failed:", e);
            this.stop();
          }
        });

    } catch (e) {
      console.error("AudioManager play error:", e);
      this.stop();
    }
  }
}

// Exportar instancia única global
export const audioManager = new AudioManager();
export type { AudioState };
