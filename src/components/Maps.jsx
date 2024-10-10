import React, { useState, useEffect } from 'react';
import MapView, { UrlTile, Marker, Circle } from 'react-native-maps';
import { StyleSheet, View, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getParameter } from '../api/parameter';

const MyMap = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [locationParameter, setLocationParameter] = useState(null);
    const [radius, setRadius] = useState(0);
    const [companyId, setCompanyId] = useState(null);
    const [mapRegion, setMapRegion] = useState(null);

    useEffect(() => {
        const getData = async () => {
            try {
                const storedCompanyId = await AsyncStorage.getItem('companyId');
                if (storedCompanyId) {
                    setCompanyId(storedCompanyId);
                }
            } catch (error) {
                console.error('Error fetching AsyncStorage data:', error);
            }
        };
        getData();
    }, []);

    const fetchLocationParameter = async () => {
        try {
            const response = await getParameter(companyId);
            const { location, radius } = response.data;

            const [latitude, longitude] = location.trim().split(',').map(Number);

            if (!isNaN(latitude) && !isNaN(longitude)) {
                setLocationParameter({ latitude, longitude });
                setRadius(radius);
                setMapRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            }
        } catch (error) {
            console.error('Error fetching location data:', error);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchLocationParameter();
        }
    }, [companyId]);

    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "This app needs access to your location.",
                        buttonNeutral: "Ask Me Later",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK"
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    useEffect(() => {
        const getLocation = async () => {
            const hasPermission = await requestLocationPermission();
            if (hasPermission) {
                Geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setUserLocation({ latitude, longitude });
                        setMapRegion({
                            latitude,
                            longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        });
                    },
                    (error) => {
                        console.error(error);
                        // Set a default location if unable to get user's location
                        setMapRegion({
                            latitude: 0,
                            longitude: 0,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        });
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                );
            }
        };

        getLocation();
    }, []);

    return (
        <View style={styles.mapContainer}>
            <MapView
                style={styles.map}
                region={mapRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
                followsUserLocation={true}
            >
                <UrlTile urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
                
                {locationParameter && (
                    <>
                        <Marker
                            coordinate={locationParameter}
                            title="Office Location"
                            description="Company's office location"
                        />
                        <Circle
                            center={locationParameter}
                            radius={radius}
                            strokeWidth={2}
                            strokeColor="rgba(0, 150, 255, 0.5)"
                            fillColor="rgba(0, 150, 255, 0.2)"
                        />
                    </>
                )}

                {userLocation && (
                    <Circle
                        center={userLocation}
                        radius={500}
                        strokeWidth={2}
                        strokeColor="rgba(0, 255, 0, 0.5)"
                        fillColor="rgba(0, 255, 0, 0.2)"
                    />
                )}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    mapContainer: {
        flex: 1,
        width: '100%',
        height: '50%',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default MyMap;