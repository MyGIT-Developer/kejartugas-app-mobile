import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Modal, Animated } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const DraggableModal = ({ visible, onClose, children }) => {
    const modalY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(modalY, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(modalY, {
                toValue: SCREEN_HEIGHT,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.spring(modalY, {
            toValue: SCREEN_HEIGHT,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    return (
        <Modal transparent={true} visible={visible} onRequestClose={handleClose}>
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.overlay} onPress={handleClose} />
                <Animated.View
                    style={[
                        styles.bottomSheet,
                        {
                            transform: [{ translateY: modalY }],
                        },
                    ]}
                >
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.8,
    },
});

export default DraggableModal;
