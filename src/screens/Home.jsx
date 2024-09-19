import { View, Text, StyleSheet, Button } from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons } from '@expo/vector-icons';

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
    }, []);

    const statistics = [
        {
            value: '24',
            description: 'Proyek dalam Pengerjaan',
            color: '#FAA1A7', // Example color
        },
        {
            value: '1',
            description: 'Proyek Selesai',
            color: '#4FABFF', // Example color
        },
        {
            value: '15',
            description: 'Tugas dalam Pengerjaan',
            color: '#F97EFB', // Example color
        },
        {
            value: '700',
            description: 'Tugas Selesai',
            color: '#3AD665', // Example color
        },
    ];

    const ButtonList = [
        { id: 1, src: "Feather", icon: 'users', description: 'Tugas Ad Hoc'},
        { id: 2, src: "Feather", icon: 'credit-card', description: 'Cuti'},
        { id: 3, src: "Feather", icon: 'check-circle', description: 'Klaim'},
        // { id: 4, src: "Feather", icon: 'user-plus', description: 'Riwayat Tugas'},
        // { id: 5, src: "Feather", icon: 'users', description: 'Tugas Ad Hoc'},
        // { id: 6, src: "Feather", icon: 'credit-card', description: 'Cuti'},
        // { id: 7, src: "Feather", icon: 'check-circle', description: 'Klaim'},
        // { id: 8, src: "Feather", icon: 'user-plus', description: 'Riwayat Tugas'},
    ];
    

    return (
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
                <View style={styles.upperGridContainer}>
                    {statistics.map((stat, index) => (
                        <View key={index} style={[styles.statisticCard, { borderWidth: 2, borderColor: stat.color, backgroundColor: 'white' }]}>
                        <View style={styles.textContainer}>
                        <Text style={[styles.valueText, {color:"black"}]}>{stat.value}</Text>
                                <Text style={[styles.descriptionText, {color:"black"}]}>{stat.description}</Text>
                            </View>
                            <Feather name="calendar" size={30} color={stat.color} style={styles.icon} />
                        </View>
                    ))}
                </View>

                <View style={styles.midContainer}>
                    <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            width: 'full',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                            paddingHorizontal: 20,
                        }}
                    >
                        <Text style={{ fontSize: 14, color: '#148FFF', fontWeight:500, }}>Menu</Text>
                    </View>

                    <View style={styles.buttonGridContainer}>
                        {ButtonList.map((stat) => (
                            <View key={stat.id} style={styles.menuButtonContainer}>
                                <View style={styles.statCard}>
                                    <Feather name={stat.icon} size={24} color="#148FFF" />
                                </View>
                                <Text style={{ textAlign: 'center', marginTop: 5 }}>{stat.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.lowerContainer}>
                <View
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            width: 'full',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            width: '100%',
                        }}
                    >
                        <Text style={{ fontSize: 14, color: '#148FFF', fontWeight:500, }}>Tugas Saya</Text>
                        <Text style={{ fontSize: 14, color: '#148FFF', fontWeight:500, }}>Lihat Semua</Text>
                    </View>

                    <View style={{backgroundColor:"white", minHeight:100,}}>
                      
                    </View>
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
    upperGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        padding: 10,
        marginTop: 50,
    },
    statisticCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
        width: '48%',
        marginBottom: 10,
    },
    textContainer: {
        flex: 1,
        flexDirection: 'column',
        gap: 0,
    },
    valueText: {
        fontSize: 30,
        fontWeight: '500',
        color: 'white',
    },
    descriptionText: {
        fontSize: 11,
        fontWeight: '500',
        color: 'white',
    },
    icon: {
        marginLeft: 10,
    },
    menuButtonContainer: {
        width: '20%',
    },
    statCard: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    statTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    statValue: {
        fontSize: 24,
        color: '#148FFF',
    },
    midContainer: {
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
        display: 'flex',
        justifyContent: 'flex-start',
        gap: 10,
        flexWrap: 'wrap', // Allows buttons to wrap to the next line
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
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
