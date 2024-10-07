import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { getHomeData } from '../api/general';
const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;
const StatisticCard = ({ value, description, color, icon }) => (
  <View style={[styles.statisticCard, { borderColor: color }]}>
    <View style={styles.textContainer}>
      <Text style={styles.valueText}>{value}</Text>
      <Text style={styles.descriptionText}>{description}</Text>
    </View>
    <Feather name={icon} size={30} color={color} style={styles.icon} />
  </View>
);

const MenuButton = ({ icon, description }) => (
  <View style={styles.menuButtonContainer}>
    <View style={styles.statCard}>
      <Feather name={icon} size={24} color="#148FFF" />
    </View>
    <Text style={styles.menuButtonText}>{description}</Text>
  </View>
);

const getGreeting = () => {
  const currentHour = new Date().getHours();
  if (currentHour < 12) {
    return "Selamat Pagi";
  } else if (currentHour < 15) {
    return "Selamat Siang";
  } else if (currentHour < 19) {
    return "Selamat Sore";
  } else {
    return "Selamat Malam";
  }
};

const Home = () => {
  const [employeeData, setEmployeeData] = useState({
    name: '',
    id: '',
    companyId: '',
    roleId: '',
    token: '',
  });
  const [dashboardData, setDashboardData] = useState(null);
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const keys = ['employee_name', 'employeeId', 'companyId', 'userRole', 'token'];
        const values = await AsyncStorage.multiGet(keys);
        const data = Object.fromEntries(values);
        setEmployeeData({
          name: data.employee_name,
          id: data.employeeId,
          companyId: data.companyId,
          roleId: data.userRole,
          token: data.token,
        });
      } catch (error) {
        console.error('Error fetching data from AsyncStorage:', error);
      }
    };

    fetchEmployeeData();

    // Update greeting every minute
    const intervalId = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);
  

  const fetchHomeData = useCallback(async () => {
    if (!employeeData.companyId || !employeeData.id || !employeeData.roleId || !employeeData.token) return;
    try {
      const response = await getHomeData(employeeData.companyId, employeeData.id, employeeData.roleId, employeeData.token);
      setDashboardData(response);
    } catch (error) {
      console.error('Error fetching home data:', error);
    }
  }, [employeeData]);

  useEffect(() => {
    fetchHomeData();
  }, [fetchHomeData]);

  const ButtonList = [
    { id: 1, icon: 'users', description: 'Tugas Ad Hoc' },
    { id: 2, icon: 'credit-card', description: 'Cuti' },
    { id: 3, icon: 'check-circle', description: 'Klaim' },
  ];

  const statistics = dashboardData ? [
    {
      description: "Projek Dalam Pengerjaan",
      value: dashboardData.total_projects_working_on_it,
      color: "#FAA1A7",
      icon: "monitor",
    },
    {
      description: "Total Projek Selesai",
      value: dashboardData.total_projects_complete,
      color: "#3E84CF",
      icon: "check-circle",
    },
    {
      description: "Total Dalam Pengerjaan",
      value: dashboardData.total_tasks_working_on_it,
      color: "#DD9968",
      icon: "rotate-cw",
    },
    {
      description: 'Tugas Selesai',
      value: dashboardData.total_tasks_completed,
      color: "#3AD665",
      icon: "check-square",
    },
  ] : [];

  return (
    <View style={styles.container}>
      <View style={styles.backgroundBox}>
        <LinearGradient
          colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
          style={styles.linearGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      <Text style={styles.header}>{greeting}, {employeeData.name}</Text>
      <ScrollView style={{top:60}}>
        <View style={styles.upperGridContainer}>
          {statistics.map((stat, index) => (
            <StatisticCard key={index} {...stat} />
          ))}
        </View>

        {/* <View style={styles.midContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu</Text>
          </View>

          <View style={styles.buttonGridContainer}>
            {ButtonList.map((button) => (
              <MenuButton key={button.id} {...button} />
            ))}
          </View>
        </View> */}

        <View style={styles.lowerContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tugas Saya</Text>
            <TouchableOpacity><Text style={styles.sectionLink}>Lihat Semua</Text></TouchableOpacity>
          </View>

          <View style={styles.tasksContainer}></View>
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
        fontSize: 24,
        color: 'white',
        paddingVertical: 20,
        paddingHorizontal: 40,
        top:50,
        fontFamily: 'Poppins-Regular',
        letterSpacing: -1,
      },
      upperGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20,
      },
      statisticCard: {
        width: cardWidth,
        height: 80, // Reduced height
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 12, // Reduced padding
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      },
      textContainer: {
        flex: 1,
        justifyContent: 'center',
      },
      valueText: {
        fontSize: 24, // Reduced font size
        color: 'black',
        fontFamily: 'Poppins-Bold',
        letterSpacing: -0.5,
        lineHeight: 30, // Added line height for better control
      },
      descriptionText: {
        fontSize: 11, // Reduced font size
        color: 'black',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
        lineHeight: 13, // Added line height for better control
      },
      icon: {
        marginLeft: 8, // Reduced margin
      },
      midContainer: {
        padding: 20,
      },
      buttonGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
      },
      menuButtonContainer: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 20,
      },
      statCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
      },
      menuButtonText: {
        textAlign: 'center',
        marginTop: 5,
        fontWeight: "600",
      },
      lowerContainer: {
        padding: 20,
      },
      sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
      },
      sectionTitle: {
        fontSize: 14,
        color: '#148FFF',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
      },
      sectionLink: {
        fontSize: 14,
        color: '#148FFF',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
      },
      tasksContainer: {
        backgroundColor: 'white',
        minHeight: 100,
        borderRadius: 10,
      },
});

export default Home;
