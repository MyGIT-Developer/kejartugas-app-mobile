import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Animated, Dimensions, StyleSheet, ScrollView } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SlidingFragment = ({ fragments, activeFragment, onSwipe, data }) => {
    const translateX = useRef(new Animated.Value(-SCREEN_WIDTH * activeFragment)).current;

    // Update animation when activeFragment changes
    useEffect(() => {
        Animated.spring(translateX, {
            toValue: -SCREEN_WIDTH * activeFragment,
            useNativeDriver: true,
        }).start();
    }, [activeFragment, translateX]);

    return (
        <Animated.View style={[styles.fragmentContainer(fragments.length), { transform: [{ translateX }] }]}>
            {fragments.map((fragment, index) => {
                const ScreenComponent = fragment.screen;
                return (
                    <View key={index} style={styles.fragment}>
                        {data ? (
                            <ScreenComponent
                                data={data}
                            />
                        ) : (
                            <ScreenComponent data={data} />
                        )}
                    </View>
                );
            })}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    fragmentContainer: (fragmentCount) => ({
        width: SCREEN_WIDTH * fragmentCount,
    }),
    fragment: {
        width: SCREEN_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default React.memo(SlidingFragment);
