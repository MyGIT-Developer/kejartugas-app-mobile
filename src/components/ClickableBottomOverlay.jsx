import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableWithoutFeedback, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');
const MIN_HEIGHT = height * 0.3;
const MAX_HEIGHT = height * 0.9;
const INITIAL_HEIGHT = height * 0.3;
const MAX_BORDER_RADIUS = 30;

const ClickableBottomOverlay = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [overlayHeight] = useState(new Animated.Value(INITIAL_HEIGHT));
    const [borderRadius] = useState(new Animated.Value(MAX_BORDER_RADIUS));

    useEffect(() => {
        Animated.parallel([
            Animated.timing(overlayHeight, {
                toValue: isOpen ? MAX_HEIGHT : MIN_HEIGHT,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(borderRadius, {
                toValue: isOpen ? 0 : MAX_BORDER_RADIUS,
                duration: 300,
                useNativeDriver: false,
            }),
        ]).start();
    }, [isOpen]);

    const toggleOverlay = () => {
        setIsOpen(!isOpen);
    };

    return (
        <TouchableWithoutFeedback onPress={toggleOverlay}>
            <Animated.View
                style={[
                    styles.overlayBottom,
                    {
                        height: overlayHeight,
                        borderTopLeftRadius: borderRadius,
                        borderTopRightRadius: borderRadius,
                    },
                ]}
            >
                <View style={styles.dragHandle} />
                <View style={styles.content}>{children}</View>
            </Animated.View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    overlayBottom: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 20,
        zIndex: 5,
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

export default ClickableBottomOverlay;
