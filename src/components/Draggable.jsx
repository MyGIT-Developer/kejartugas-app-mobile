import React, { useState } from 'react';
import { View, PanResponder, Animated } from 'react-native';

const Draggable = () => {
    const [pan] = useState(new Animated.ValueXY());

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event([
            null,
            { dx: pan.x, dy: pan.y }
        ]),
        onPanResponderRelease: () => {
            // Handle release event if needed
        }
    });

    return (
        <View style={{ flex: 1 }}>
            <Animated.View
                style={{
                    transform: [{ translateX: pan.x }, { translateY: pan.y }]
                }}
                {...panResponder.panHandlers}
            >
                {/* Your draggable content here */}
            </Animated.View>
        </View>
    );
};

export default Draggable;