// Profile.js
import React from 'react';
import { Button, View, StyleSheet } from 'react-native';
import ColorList from '../components/ColorList'; // Adjust the path if necessary
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const Profile = () => {
  const navigator = useNavigation();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      // Add any additional logout logic here
      navigator.navigate('Login'); // Replace 'Login' with the appropriate screen name for your app
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={styles.container}>
      {/* <ColorList color="#059669" /> */}
      <Button title="Logout" onPress={handleLogout} style={styles.buttonLogout}/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLogout: {
    backgroundColor: '#059669',
    padding: 10,
    borderRadius: 5,
  },

});

export default Profile;
