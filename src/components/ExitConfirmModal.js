import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Modal from 'react-native-modal';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ExitConfirmModal = ({ visible, onConfirm, onCancel, isOnline }) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0.5);
    }
  }, [visible, scaleAnim]);

  return (
    <Modal
      isVisible={ visible }
      backdropColor="#000"
      backdropOpacity={ 0.85 }
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackdropPress={ onCancel }
      onBackButtonPress={ onCancel }
      style={ styles.modalWrapper }
    >
      <Animated.View style={ [styles.container, { transform: [{ scale: scaleAnim }] }] }>
        <MaterialCommunityIcons name="exit-run" size={ 50 } color="#FF4C4C" style={ styles.icon } />
        
        <Text style={ styles.title }>Hold On!</Text>
        <Text style={ styles.message }>Are you sure you want to leave the match?</Text>

        { isOnline && (
          <View style={ styles.warningContainer }>
            <MaterialCommunityIcons name="alert-circle-outline" size={ 20 } color="#FFD700" />
            <Text style={ styles.warningText }>Leaving will forfeit the match to your opponent.</Text>
          </View>
        ) }

        <View style={ styles.buttonRow }>
          <TouchableOpacity style={ [styles.button, styles.cancelButton] } onPress={ onCancel }>
            <Text style={ styles.cancelButtonText }>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={ [styles.button, styles.confirmButton] } onPress={ onConfirm }>
            <Text style={ styles.confirmButtonText }>Yes, Leave</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 24,
    paddingBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 76, 76, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 20,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  warningText: {
    color: '#FFD700',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#FF4C4C',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ExitConfirmModal;
