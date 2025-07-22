import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const CustomModal = ({ visible, type, message, onClose }) => {
  let iconName, iconColor, modalMessage;

  switch (type) {
    case 'success':
      iconName = 'check-circle';
      iconColor = 'green';
      modalMessage = message || 'Operation successful!';
      break;
    case 'error':
      iconName = 'x-circle';
      iconColor = 'red';
      modalMessage = message || 'An error occurred.';
      break;
    default:
      iconName = 'info';
      iconColor = 'blue';
      modalMessage = message || 'Information message.';
  }

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Icon name={iconName} size={50} color={iconColor} />
          <Text style={styles.message}>{modalMessage}</Text>
          <TouchableOpacity onPress={onClose} style={styles.button}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  message: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 15,
    textAlign: 'center',
  },
  button: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#148FFF',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CustomModal;
