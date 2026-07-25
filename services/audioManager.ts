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

    this.setupMediaSession();
  }

  // Sin Media Session, Android no sabe que hay una reproducción de audio "legítima" en
  // curso y puede tratar el WebView como cualquier pestaña en segundo plano (más agresivo
  // recortando batería). Con ella: gestión de energía correcta + controles nativos en la
  // pantalla de bloqueo/notificación (play/pausa) sin tener que construirlos a mano.
  private setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => this.resume());
    navigator.mediaSession.setActionHandler('pause', () => this.pause());
    navigator.mediaSession.setActionHandler('stop', () => this.stop());
  }

  private updateMediaSessionMetadata(stopName: string, subtitle: string) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: stopName,
      artist: subtitle,
      album: 'bdai Travel',
      artwork: [{ src: '/logo.png', sizes: '512x512', type: 'image/png' }]
    });
  }

  private setMediaSessionPlaybackState(state: 'playing' | 'paused' | 'none') {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = state;
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
    this.setMediaSessionPlaybackState('none');
  }

  // Pausa sin resetear la posición — a diferencia de stop(), permite reanudar desde donde se
  // quedó. Es lo que invoca el control "pausa" de la pantalla de bloqueo/notificación.
  pause() {
    if (!this.state.isPlaying) return;
    this.audioElement.pause();
    this.state.isPlaying = false;
    this.notify();
    this.setMediaSessionPlaybackState('paused');
  }

  resume() {
    if (this.state.isPlaying || !this.audioElement.src) return;
    this.audioElement.play()
      .then(() => {
        this.state.isPlaying = true;
        this.notify();
        this.setMediaSessionPlaybackState('playing');
      })
      .catch(e => console.error('Resume failed:', e));
  }

  setLoading(stopName: string) {
    this.stop();
    this.state.isLoading = true;
    this.state.stopName = stopName;
    this.notify();
  }

  async play(audioUrl: string, stopName: string, initialSpeed: number = 1.0, subtitle: string = 'bdai'): Promise<void> {
    this.stop();

    if (!audioUrl) return;

    this.state.isLoading = true;
    this.state.stopName = stopName;
    this.state.playbackRate = initialSpeed;
    this.notify();
    this.updateMediaSessionMetadata(stopName, subtitle);

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
          this.setMediaSessionPlaybackState('playing');
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
