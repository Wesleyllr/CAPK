import { showMessage } from "react-native-flash-message";
import { Alert, Platform } from "react-native";

const defaultStyles = {
  style: {
    paddingVertical: 12,
    borderRadius: 10,
  },
  titleStyle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  textStyle: {
    fontSize: 14,
    color: "#fff",
  },
};

export const alertaPersonalizado = (message) => {
  // If message is a string, convert it to an object
  const messageObj = typeof message === 'string' ? { message } : message;

  if (messageObj.buttons) {
    // Use native Alert for button-based alerts
    Alert.alert(
      messageObj.message || '',
      messageObj.description || '',
      messageObj.buttons,
      { cancelable: true }
    );
  } else {
    // Use FlashMessage for toast-style alerts
    showMessage({
      message: messageObj.message || '',
      description: messageObj.description || '',
      type: messageObj.type || 'default',
      ...defaultStyles,
      ...messageObj,
      duration: messageObj.duration || 3000,
      floating: true,
      position: messageObj.position || 'bottom',
    });
  }
};