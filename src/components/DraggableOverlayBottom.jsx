import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');
const MIN_HEIGHT = height * 0.3;
const MAX_HEIGHT = height * 0.9;
const INITIAL_HEIGHT = height * 0.3;
const MAX_BORDER_RADIUS = 30;

const BottomDraggableOverlay = ({ children }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [overlayHeight, setOverlayHeight] = useState(INITIAL_HEIGHT);
  const [borderRadius, setBorderRadius] = useState(MAX_BORDER_RADIUS);

  useEffect(() => {
    // Calculate border radius based on current height
    const newBorderRadius = Math.max(0, MAX_BORDER_RADIUS * (1 - (overlayHeight - MIN_HEIGHT) / (MAX_HEIGHT - MIN_HEIGHT)));
    setBorderRadius(newBorderRadius);
  }, [overlayHeight]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      const newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, overlayHeight - gesture.dy));
      setOverlayHeight(newHeight);
    },
    onPanResponderRelease: (_, gesture) => {
      // You can add snapping logic here if desired
    },
  });

  return (
    <Animated.View
      style={[
        styles.overlayBottom,
        {
          height: overlayHeight,
          borderTopLeftRadius: borderRadius,
          borderTopRightRadius: borderRadius,
          transform: [{ translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.dragHandle} />
      <View style={styles.content}>{children}</View>
    </Animated.View>
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

export default BottomDraggableOverlay;