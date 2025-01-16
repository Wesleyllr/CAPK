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
      } catch (error) {
        console.warn("Erro ao inicializar áudio:", error);
      }
    }
  }

  static async playSound(type: SoundType = "click") {
    try {
      if (!this.isLoaded[type]) {
        this.sounds[type] = new Audio.Sound();
        await this.sounds[type]?.loadAsync(this.soundFiles[type]);
        this.isLoaded[type] = true;
      }

      if (this.sounds[type]) {
        await this.sounds[type]?.replayAsync();
      }
    } catch (error) {
      console.warn("Erro ao reproduzir som:", error);
    }
  }

  static async unload() {
    for (const type of Object.keys(this.sounds) as SoundType[]) {
      if (this.sounds[type]) {
        await this.sounds[type]?.unloadAsync();
        this.isLoaded[type] = false;
      }
    }
  }
}

export default SoundService;
export type { SoundType };
