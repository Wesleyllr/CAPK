import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Icon } from "react-native-elements";

const CustomAlert2 = ({
  visible,
  type = "info", // 'success', 'error', 'info', 'warning'
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "OK",
  cancelText = "Cancelar",
}) => {
  if (!visible) return null;

  const styles = {
    success: { bgColor: "#d1fad7", borderColor: "#4caf50", icon: "check-circle" },
    error: { bgColor: "#ffebee", borderColor: "#f44336", icon: "error" },
    info: { bgColor: "#bbdefb", borderColor: "#2196f3", icon: "info" },
    warning: { bgColor: "#fff9c4", borderColor: "#ff9800", icon: "warning" },
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={alertStyles.overlay}>
        <View style={[alertStyles.container, { borderColor: currentStyle.borderColor }]}>
          <Icon
            name={currentStyle.icon}
            type="material"
            color={currentStyle.borderColor}
            size={50}
          />
          <Text style={alertStyles.title}>{title}</Text>
          <Text style={alertStyles.message}>{message}</Text>

          <View style={alertStyles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity
                style={[alertStyles.button, alertStyles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={alertStyles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            {onConfirm && (
              <TouchableOpacity
                style={[alertStyles.button, alertStyles.confirmButton]}
                onPress={onConfirm}
              >
                <Text style={alertStyles.confirmText}>{confirmText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#4caf50",
  },
  cancelButton: {
    backgroundColor: "#f44336",
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CustomAlert2;
