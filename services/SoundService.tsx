import { Platform } from "react-native";
import { Audio } from "expo-av";

type SoundType = "click" | "click2";

class SoundService {
  private static sounds: Record<SoundType, Audio.Sound | null> = {
    click: null,
    click2: null,
  };

  private static isLoaded: Record<SoundType, boolean> = {
    click: false,
    click2: false,
  };

  private static soundFiles: Record<SoundType, any> = {
    click: require("@/assets/sounds/click.mp3"),
    click2: require("@/assets/sounds/click2.mp3"),
  };

  static async init() {
    if (Platform.OS !== "web") {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });
        console.log("Áudio inicializado com sucesso.");
      } catch (error) {
        console.warn("Erro ao inicializar áudio:", error);
      }
    }
  }

  static async playSound(type: SoundType = "click") {
    if (Platform.OS === "web") return; // Garante que sons não toquem na web

    try {
      // Carrega o som se ainda não estiver carregado
      if (!this.isLoaded[type]) {
        if (this.sounds[type]) {
          await this.sounds[type]?.unloadAsync(); // Descarrega som anterior, se necessário
        }

        this.sounds[type] = new Audio.Sound();
        await this.sounds[type]?.loadAsync(this.soundFiles[type]);
        this.isLoaded[type] = true;
        console.log(`Som ${type} carregado com sucesso.`);
      }

      // Reproduz o som
      if (this.sounds[type]) {
        await this.sounds[type]?.replayAsync();
        console.log(`Som ${type} reproduzido.`);
      }
    } catch (error) {
      console.warn(`Erro ao reproduzir som ${type}:`, error);
    }
  }

  static async unload() {
    for (const type of Object.keys(this.sounds) as SoundType[]) {
      if (this.sounds[type]) {
        try {
          await this.sounds[type]?.unloadAsync();
          this.isLoaded[type] = false;
          console.log(`Som ${type} descarregado com sucesso.`);
        } catch (error) {
          console.warn(`Erro ao descarregar som ${type}:`, error);
        }
      }
    }
  }
}

export default SoundService;
export type { SoundType };
