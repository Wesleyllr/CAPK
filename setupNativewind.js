import { cssInterop } from "nativewind";
import { Image } from "expo-image";
import DropDownPicker from "react-native-dropdown-picker";

// Aplica o cssInterop ao componente Image para aceitar o uso de className
cssInterop(Image, { className: "style" });

// Aplica o cssInterop ao DropDownPicker para aceitar o uso de className
cssInterop(DropDownPicker, { className: "style" });
