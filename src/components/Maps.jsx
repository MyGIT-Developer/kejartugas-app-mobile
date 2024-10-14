import React from 'react';
import MapView, { Marker, Circle } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

const MyMap = ({ location, radius }) => {
    // Check if the location is valid
    const isValidLocation = location && location.latitude && location.longitude;

    return (
        <View style={styles.mapContainer}>
            {isValidLocation ? (
                <MapView
                    style={styles.map}
                    region={{
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    showsUserLocation={true}
                    showsMyLocationButton={true}
                >
                    <Marker
                        coordinate={location}
                        title="Office Location"
                        description="Company's office location"
                    />
                    <Circle
                        center={location}
                        radius={radius || 1000} // Default radius if not provided
                        strokeWidth={2}
                        strokeColor="rgba(0, 150, 255, 0.5)"
                        fillColor="rgba(0, 150, 255, 0.2)"
                    />
                </MapView>
            ) : (
                // Optionally render a placeholder or message if location is not available
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