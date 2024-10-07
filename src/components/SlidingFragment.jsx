import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SlidingFragment = ({ fragments, activeFragment, data }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log('Active Fragment:', activeFragment);
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
                    console.log('Rendering Fragment:', fragment.title);
                    return (
                        <View key={index} style={styles.fragment}>
                            <ScreenComponent data={data} />
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