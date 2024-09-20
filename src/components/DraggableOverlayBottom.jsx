import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions, TouchableWithoutFeedback } from 'react-native';

const { height, width } = Dimensions.get('window');
const MIN_HEIGHT = height * 0.3;
const MAX_HEIGHT = height * 0.9;
const INITIAL_HEIGHT = height * 0.3;
const MAX_BORDER_RADIUS = 30;

const BottomDraggableOverlay = ({ children }) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const [overlayHeight, setOverlayHeight] = useState(INITIAL_HEIGHT);
    const [borderRadius, setBorderRadius] = useState(MAX_BORDER_RADIUS);

    const overlayTranslateY = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (isVisible) {
            Animated.spring(overlayTranslateY, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(overlayTranslateY, {
                toValue: height,
                useNativeDriver: true,
            }).start();
        }
    }, [isVisible]);

    useEffect(() => {
        const newBorderRadius = Math.max(
            0,
            MAX_BORDER_RADIUS * (1 - (overlayHeight - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT)),
        );
        setBorderRadius(newBorderRadius);
    }, [overlayHeight]);

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
            const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, overlayHeight - gesture.dy));
            setOverlayHeight(newHeight);
        },
        onPanResponderRelease: (_, gesture) => {
            if (gesture.dy > 50 && overlayHeight <= MIN_HEIGHT + 50) {
                onClose();
            }
        },
    });

    if (!isVisible) return null;

    return (
        <View style={styles.container}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.backdrop} />
            </TouchableWithoutFeedback>
            <Animated.View
                style={[
                    styles.overlayBottom,
                    {
                        height: overlayHeight,
                        borderTopLeftRadius: borderRadius,
                        borderTopRightRadius: borderRadius,
                        transform: [{ translateY: overlayTranslateY }],
                    },
                ]}
                {...panResponder.panHandlers}
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
        zIndex: 1000,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    overlayBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        shadowColor: '#000',
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
