import React from 'react';
import MapView, { Marker, Circle } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';

const MyMap = ({ location, radius }) => {
    // Default map region in case location prop is invalid
    const defaultRegion = {
        latitude: -6.2, // Default to Jakarta if no location is provided
        longitude: 106.8,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    };

    // Use the provided location or fallback to defaultRegion
    const mapRegion = location && location.latitude && location.longitude
        ? {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        }
        : defaultRegion;

    return (
        <View style={styles.mapContainer}>
            <MapView
                style={styles.map}
                region={mapRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {location && location.latitude && location.longitude && (
                    <>
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
                    </>
                )}
            </MapView>
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
});

export default MyMap;
