import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions, Keyboard, Button } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');
const MIN_HEIGHT = screenHeight * 0.3;
const INITIAL_HEIGHT = screenHeight * 0.3;
const MAX_BORDER_RADIUS = 30;

const BottomDraggableOverlay = ({ children }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [overlayHeight, setOverlayHeight] = useState(INITIAL_HEIGHT);
    const [borderRadius, setBorderRadius] = useState(MAX_BORDER_RADIUS);
    const [isVisible, setIsVisible] = useState(true);
    const [maxHeight, setMaxHeight] = useState(screenHeight * 0.9); // Set initial max height
    const overlayTranslateY = useRef(new Animated.Value(screenHeight)).current;

    const onClose = () => {
        setIsVisible(false);
    };

    const onOpen = () => {
        setIsVisible(true);
    };

    // Listen for keyboard events to adjust overlay height
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            const keyboardHeight = e.endCoordinates.height;
            const maxAllowedHeight = screenHeight - keyboardHeight;

            // Only adjust if the overlay height exceeds the new maxHeight when the keyboard is up
            if (overlayHeight > maxAllowedHeight) {
                setOverlayHeight(maxAllowedHeight);
            }
            setMaxHeight(maxAllowedHeight); // Adjust max height when keyboard is visible
        });

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setMaxHeight(screenHeight * 0.9); // Reset max height when keyboard is hidden
        });

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, [overlayHeight]);

    // Handle the visibility of the overlay
    useEffect(() => {
        if (isVisible) {
            Animated.spring(overlayTranslateY, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(overlayTranslateY, {
                toValue: screenHeight,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible]);

    // Adjust border radius based on height
    useEffect(() => {
        const newBorderRadius = Math.max(
            0,
            MAX_BORDER_RADIUS * (1 - (overlayHeight - MIN_HEIGHT) / (maxHeight - MIN_HEIGHT)),
        );
        setBorderRadius(newBorderRadius);
    }, [overlayHeight, maxHeight]);

    // Pan responder to handle drag gestures
    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
            const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, overlayHeight - gesture.dy));
            setOverlayHeight(newHeight);
        },
        onPanResponderRelease: (_, gesture) => {
            // Disable overlay closure by commenting this out
            // if (gesture.dy > 50 && overlayHeight <= MIN_HEIGHT + 50) {
            //     onClose();
            // }
        },
    });

    if (!isVisible) {
        return (
            <View style={styles.reopenButtonContainer}>
                <Button title="Open Overlay" onPress={onOpen} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Draggable Overlay */}
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    styles.overlayBottom,
                    {
                        height: overlayHeight,
                        transform: [{ translateY: overlayTranslateY }],
                        borderTopLeftRadius: borderRadius,
                        borderTopRightRadius: borderRadius,
                    },
                ]}
            >
                <View style={styles.dragHandle} />
                <View style={styles.content}>{children}</View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
    reopenButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    overlayBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        shadowColor: '#444',
        shadowOffset: {
            width: 0,
            height: -5,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 15,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
        marginBottom: 10,
        alignSelf: 'center',
    },
    content: {
        flex: 1,
    },
});

export default BottomDraggableOverlay;
