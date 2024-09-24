import React, { useRef, useEffect, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SlidingFragment = ({ fragments, activeFragment, onSwipe, data }) => {
    const translateX = useRef(new Animated.Value(-SCREEN_WIDTH * activeFragment)).current;
    const [isPanEnabled, setIsPanEnabled] = useState(true);
    const panRef = useRef();

    useEffect(() => {
        Animated.spring(translateX, {
            toValue: -SCREEN_WIDTH * activeFragment,
            useNativeDriver: true,
        }).start();
    }, [activeFragment]);

    const onPanGestureEvent = Animated.event([{ nativeEvent: { translationX: translateX } }], {
        useNativeDriver: true,
    });

    const onHandlerStateChange = ({ nativeEvent }) => {
        if (nativeEvent.oldState === State.ACTIVE) {
            const swipeIndex = Math.round(-nativeEvent.translationX / SCREEN_WIDTH);
            onSwipe(Math.max(0, Math.min(swipeIndex, fragments.length - 1)));
        }
    };

    const onScrollBeginDrag = () => setIsPanEnabled(false);
    const onScrollEndDrag = () => setIsPanEnabled(true);

    return (
        <PanGestureHandler
            ref={panRef}
            enabled={isPanEnabled}
            onGestureEvent={onPanGestureEvent}
            onHandlerStateChange={onHandlerStateChange}
        >
            <Animated.View style={[styles.fragmentContainer(fragments.length), { transform: [{ translateX }] }]}>
                {fragments.map((fragment, index) => {
                    const ScreenComponent = fragment.screen;
                    return (
                        <View key={index} style={styles.fragment}>
                            {data ? (
                                <ScreenComponent
                                    data={data}
                                    onScrollBeginDrag={onScrollBeginDrag}
                                    onScrollEndDrag={onScrollEndDrag}
                                />
                            ) : (
                                <ScreenComponent data={data}/>
                            )}
                        </View>
                    );
                })}
            </Animated.View>
        </PanGestureHandler>
    );
};

const styles = StyleSheet.create({
    fragmentContainer: (fragmentCount) => ({
        flexDirection: 'row',
        width: SCREEN_WIDTH * fragmentCount,
    }),
    fragment: {
        width: SCREEN_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default SlidingFragment;
