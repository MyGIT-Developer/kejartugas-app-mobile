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
    const [mapRegion, setMapRegion] = useState(null); // Store map region

    // Fetch companyId from AsyncStorage
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

    // Fetch location and radius from the database based on companyId
    const fetchLocationParameter = async () => {
        try {
            const response = await getParameter(companyId);
            const { location, radius } = response.data;

            // Remove any extra spaces from location coordinates and split them
            const [latitude, longitude] = location.trim().split(',').map(Number);

            if (!isNaN(latitude) && !isNaN(longitude)) {
                setLocationParameter({ latitude, longitude });
                setRadius(radius);
                setMapRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.01, // Adjusted for more accuracy
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

    // Request location permission (needed for Android)
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
          const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
          if (alreadyGranted) {
              return true; // Permission already granted
          }
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
              title: 'Location Access Required',
              message: 'This app needs to access your location.',
              buttonPositive: 'OK',
          });
          return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS handles permission automatically
  };
  
  // Get user's current location
  useEffect(() => {
      const getLocation = async () => {
          const permissionGranted = await requestLocationPermission();
          if (permissionGranted) {
              Geolocation.getCurrentPosition(
                  (position) => {
                      setUserLocation({
                          latitude: position.coords.latitude,
                          longitude: position.coords.longitude,
                          latitudeDelta: 0.01, // Increased accuracy
                          longitudeDelta: 0.01,
                      });
                  },
                  (error) => console.error(error),
                  { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 },
              );
          }
      };
  
      getLocation();
  }, []);  

    return (
        <View style={styles.mapContainer}>
            {mapRegion && (
                <MapView
                    style={styles.map}
                    initialRegion={mapRegion}
                    showsUserLocation={true} // Shows the user's blue dot on the map
                    followsUserLocation={true} // Keeps the map centered on the user's location
                >
                    {/* OpenStreetMap Tile */}
                    <UrlTile urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />

                    {/* Static Marker from Database */}
                    {locationParameter && (
                        <Marker
                            coordinate={locationParameter}
                            title="Office Location"
                            description="Company's office location"
                        />
                    )}

                    {/* Radius Circle around office */}
                    {locationParameter && (
                        <Circle
                            center={locationParameter}
                            radius={radius} // Radius in meters
                            strokeWidth={2}
                            strokeColor="rgba(0, 150, 255, 0.5)" // Semi-transparent border
                            fillColor="rgba(0, 150, 255, 0.2)" // Semi-transparent fill
                        />
                    )}

                    {/* User Location Marker and Radius Circle */}
                    {userLocation && (
                        <>
                            <Marker
                                coordinate={userLocation}
                                title="Your Location"
                                pinColor="blue" // Different color for user marker
                            />
                            <Circle
                                center={userLocation}
                                radius={500} // Radius in meters around the user's location
                                strokeWidth={2}
                                strokeColor="rgba(0, 255, 0, 0.5)"
                                fillColor="rgba(0, 255, 0, 0.2)"
                            />
                        </>
                    )}
                </MapView>
            )}
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
