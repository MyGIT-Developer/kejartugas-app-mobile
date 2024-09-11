import { View, Text, StyleSheet, Button } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = () => {
  const [employeeData, setEmployeeData] = useState(null);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const data = await AsyncStorage.getItem('employee_name');
        setEmployeeData(data);
      } catch (error) {
        console.error('Error fetching employee data:', error);
      }
    };
  
    fetchEmployeeData();
  }, []);  return (
    <View style={{ flex: 1 }}>
        {/* Ensure the parent View takes the full available space */}
        <View style={styles.backgroundBox}>
            <LinearGradient
                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                style={styles.linearGradient} // Apply the gradient to the entire backgroundBox
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
        </View>

        <Text style={styles.header}>Hi, {employeeData}</Text>
        <ScrollView>
            <View style={styles.upperContainer}>
             

            </View>

            <View style={styles.midContainer}>
              <View style={{display:"flex", flexDirection:"row", width:"full", justifyContent:"space-between", alignItems:"center"}}>
                <Text style={{fontSize:14, color:"#148FFF"}}>Menu</Text>
                <Text style={{fontSize:14, color:"#000"}}>Lihat Semua</Text>
              </View>

              <View style={styles.buttonGridContainer}>
            <View style={styles.menuButtonContainer}>
                <Button title='' style={styles.menuButton} />
            </View>
            <View style={styles.menuButtonContainer}>
                <Button title='' style={styles.menuButton} />
            </View>
            <View style={styles.menuButtonContainer}>
                <Button title='' style={styles.menuButton} />
            </View>
            <View style={styles.menuButtonContainer}>
                <Button title='' style={styles.menuButton} />
            </View>
        </View>

            </View>

            <View style={styles.lowerContainer}>
             

            </View>
            

        </ScrollView>
    </View>
);
};

const styles = StyleSheet.create({
container: {
    flex: 1,
},
locationContainer: {
    flexDirection: 'row', // Align items horizontally
    alignItems: 'center', // Center items vertically
    padding: 10,
},
backgroundBox: {
    height: 125, // Set your desired height
    width: '100%', // Set your desired width
    position: 'absolute', // Position it behind other elements
    top: 0,
    left: 0,
},
linearGradient: {
    flex: 1, // Ensure the gradient covers the entire view
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 30,
},
header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 50,
},
upperContainer: {
    backgroundColor: 'white',
    flex: 1,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    // height: 200,
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 10,
    padding: 20,
},
timeText: {
    fontSize: 34,
    fontWeight: 'bold',
    textAlign: 'center',
},
locationText: {
    fontSize: 14,
    textAlign: 'center',
    color: 'gray',
    marginBottom: 10,
},
icon: {
    marginRight: 10, // Space between the icon and text
},
buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
},
midContainer: {
    // backgroundColor: 'white',
    flex: 1,
    borderRadius: 20,
    marginTop: 20,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
},
label: {
    fontSize: 18,
    marginBottom: 10,
},
buttonGridContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  width: '100%',
  padding: 10,
},
menuButtonContainer: {
  width: '22%',
  height:'22%', // About 22% to leave some space between buttons
  aspectRatio: 1, // Makes the button container square
  marginBottom: 10, // Adds space between rows
},
menuButton: {
  width: 100,
  height: 100,
  backgroundColor: '#fff',
  borderRadius: 10,
},
lowerContainer: {
    flex: 1,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 20,
    height: 300,
},
containerPerDate: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
        width: 0,
        height: 2,
    },
    shadowOpacity: 0.25,
},
upperAbsent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'gray',
    paddingBottom: 10,
},
midAbsent: {
    display: 'flex',
    flexDirection: 'row',
    marginTop: 10,
},
tableContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 10,
},
tableHeader: {
    fontWeight: 'bold',
    marginBottom: 5,
},
tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
},
tableCell: {
    flex: 1,
    textAlign: 'center',
    padding: 5,
},
column: {
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
},
lowerAbsent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'gray',
    paddingTop: 10,
},
statusView: {
    backgroundColor: '#ddd',
    padding: 5,
    borderRadius: 4,
},
});

export default Home;