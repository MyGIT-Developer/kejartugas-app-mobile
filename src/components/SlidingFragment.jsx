import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SlidingFragment = ({ fragments, activeFragment, data, onFetch }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(translateX, {
            toValue: -SCREEN_WIDTH * activeFragment,
            useNativeDriver: true,
        }).start();
    }, [activeFragment, translateX]);

    return (
        <View style={styles.container}>
            <Animated.View 
                style={[
                    styles.fragmentContainer(fragments.length), 
                    { transform: [{ translateX }] }
                ]}
            >
                {fragments.map((fragment, index) => {
                    const ScreenComponent = fragment.screen;
                    return (
                        <View key={index} style={styles.fragment}>
                            <ScreenComponent data={data} onFetch={onFetch}/>
                        </View>
                    );
                })}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: SCREEN_WIDTH,
        overflow: 'hidden',
    },
    fragmentContainer: (fragmentCount) => ({
        flexDirection: 'row',
        width: SCREEN_WIDTH * fragmentCount,
    }),
    fragment: {
        width: SCREEN_WIDTH,
    },
});

export default React.memo(SlidingFragment);