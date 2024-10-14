import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';

const MyMap = ({ location, radius }) => {
    const isValidLocation = location && typeof location.latitude === 'number' && typeof location.longitude === 'number';

    return (
        <View style={styles.mapContainer}>
            {isValidLocation ? (
                <MapView
                    style={styles.map}
                    initialRegion={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }}
                >
                    <Marker coordinate={location} />
                    <Circle
                        center={location}
                        radius={radius}
                        fillColor="rgba(0, 128, 255, 0.2)"
                        strokeColor="rgba(0, 128, 255, 0.5)"
                    />
                </MapView>
            ) : (
                <View style={styles.placeholder}>
                    <Text>No location available</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
        width: '100%',
        height: 200,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default MyMap;