import { showMessage } from "react-native-flash-message";

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
  showMessage({
    ...defaultStyles,
    ...message,
  });
};
