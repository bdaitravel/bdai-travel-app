// Singleton global de audio — vive fuera de React
// Cualquier componente puede llamar a play/pause/stop sin importar dónde esté

type AudioState = {
  isPlaying: boolean;
  isLoading: boolean;
  stopName: string;
  onStateChange?: (state: AudioState) => void;
};

class AudioManager {
  private audioContext: AudioContext | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private state: AudioState = {
    isPlaying: false,
    isLoading: false,
    stopName: '',
  };

  constructor() {
    // A5: Suspender AudioContext cuando la app va a segundo plano (ahorra batería en móvil)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.audioContext?.suspend();
      } else {
        this.audioContext?.resume();
      }
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

  stop() {
    if (this.sourceNode) {
      try { this.sourceNode.stop(); } catch {}
      this.sourceNode = null;
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

  async play(audioUrl: string, stopName: string): Promise<void> {
    this.stop();

    if (!audioUrl) return;

    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    try {
      // 1. Obtener los bytes desde la URL (Bucket de Supabase)
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error("Failed to fetch audio from bucket");
      const arrayBuffer = await response.arrayBuffer();

      // 2. Intentar decodificar como audio estándar (MP3 del bucket)
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.onended = () => {
        if (this.state.stopName === stopName) {
          this.state.isPlaying = false;
          this.state.stopName = '';
          this.notify();
        }
      };
      this.sourceNode = source;
      source.start(0);
    } catch (e) {
      console.error("AudioManager play error:", e);
      this.stop();
    }

    this.state.isPlaying = true;
    this.state.isLoading = false;
    this.state.stopName = stopName;
    this.notify();
  }
}

// Exportar instancia única global
export const audioManager = new AudioManager();
export type { AudioState };
