import React from "react";
import { TouchableOpacity, TouchableOpacityProps } from "react-native";
import SoundService, { SoundType } from "@/services/SoundService";

interface TouchableWithSoundProps extends TouchableOpacityProps {
  soundEnabled?: boolean;
  soundType?: SoundType;
}

const TouchableWithSound: React.FC<TouchableWithSoundProps> = ({
  children,
  onPress,
  soundEnabled = true,
  soundType = "click",
  ...props
}) => {
  const handlePress = async (e) => {
    if (soundEnabled) {
      await SoundService.playSound(soundType);
    }
    onPress?.(e);
  };

  return (
    <TouchableOpacity {...props} onPress={handlePress}>
      {children}
    </TouchableOpacity>
  );
};

export default TouchableWithSound;
