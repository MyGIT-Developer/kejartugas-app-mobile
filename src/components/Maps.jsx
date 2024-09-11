import React, {useState, useEffect} from 'react';
import MapView, { UrlTile, Marker, Circle } from 'react-native-maps';
import { StyleSheet, View, Text, PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service'; // Make sure to install react-native-geolocation-service

const MyMap = () => {
    const [userLocation, setUserLocation] = useState(null);
  
  // Function to request location permission (needed for Android)
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Access Required',
          message: 'This app needs to access your location.',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS has its own permission flow
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
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          },
          (error) => console.error(error),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
        );
      }
    };

    getLocation();
  }, []);

    const markerCoordinates = {
        latitude: -6.2218876,
        longitude: 106.7911055,
      };
      
      return (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: markerCoordinates.latitude,
              longitude: markerCoordinates.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation={true} // Shows the user's blue dot on the map
            followsUserLocation={true} // Keeps the map centered on the user's location
          >
            {/* OpenStreetMap Tile */}
            <UrlTile
              urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maximumZ={19}
            />
    
            {/* Static Marker */}
            <Marker
              coordinate={markerCoordinates}
              title="My Location"
              description="This is where the marker is located."
            />
    
            {/* Radius Circle */}
            <Circle
              center={markerCoordinates}
              radius={1000} // Radius in meters (1 km)
              strokeWidth={2}
              strokeColor="rgba(0, 150, 255, 0.5)" // Semi-transparent border
              fillColor="rgba(0, 150, 255, 0.2)" // Semi-transparent fill
            />
    
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
