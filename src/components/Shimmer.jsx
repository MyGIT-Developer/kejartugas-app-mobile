import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Shimmer = ({ width, height, style }) => {
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.timing(animatedValue, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();
    }, []);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-width, width],
    });

    return (
        <View style={[{ width, height, backgroundColor: '#E0E0E0', overflow: 'hidden' }, style]}>
            <Animated.View
                style={{
                    width: '100%',
                    height: '100%',
                    transform: [{ translateX }],
                }}
            >
                <LinearGradient
                    colors={['#E0E0E0', '#F5F5F5', '#E0E0E0']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: '100%', height: '100%' }}
                />
            </Animated.View>
        </View>
    );
};

export default Shimmer;
