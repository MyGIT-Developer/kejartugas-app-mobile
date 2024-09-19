import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import FloatingButton from '../components/FloatingButtonProject';
import { getProject } from '../api/projectTask';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
const { height } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import{ useNavigation } from '@react-navigation/native';

const Project = () => {
    const navigation = useNavigation();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const screenWidth = Dimensions.get('window').width; // Get screen width to make each project take full screen width
    const [refreshing, setRefreshing] = useState(false);
    const [companyId, setCompanyId] = useState(null);

    useEffect(() => {
        const getData = async () => {
            try {
                const companyId = await AsyncStorage.getItem('companyId');
                setCompanyId(companyId);
            } catch (error) {
                console.error('Error fetching AsyncStorage data:', error);
            }
        };

        getData(); // Call the async function
    }, []);

    const fetchProject = async () => {
        try {
            const response = await getProject(companyId);
            setProject(response.data); // Assuming response contains the project data
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchProject();
        }
    }, [companyId, fetchProject]);

    const onRefresh = useCallback(async () => {
        console.log('onRefresh called');
        setRefreshing(true);
        try {
            await fetchProject();
        } catch (error) {
            console.error('Error during refresh:', error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchProject]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Error: {error}</Text>
            </View>
        );
    }

    const handleGoToDetail = (projectId) => {
        navigation.navigate('DetailProjek', { projectId });
    }

    return (
        <ScrollView
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#0E509E']}
                    tintColor="#0E509E"
                />
            }
            contentContainerStyle={styles.container}
        >
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient} // Apply the gradient to the entire backgroundBox
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>
            <Text style={styles.header}>Projeks</Text>
            <View style={[styles.header, { backgroundColor: 'black' }]}></View>
            <View style={{ flex: 1, padding: 20 }}>
                <View style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <View style={styles.sectionContainer}>
                        <ScrollView
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                        >
                            {project && Array.isArray(project) ? (
                                project.map((item, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            width: '100%',
                                            padding: 10,
                                            backgroundColor: '#fff',
                                            marginHorizontal: 5,
                                            height: 125,
                                            borderRadius: 10,
                                            shadowColor: '#000',
                                            shadowOpacity: 0.25,
                                            shadowOffset: { width: 0, height: 5 },
                                            shadowRadius: 10,
                                            elevation: 5,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            padding: 10,
                                        }}
                                    >
                                        <Text style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: 16 }}>
                                            {item.project_name}
                                        </Text>
                                        <View
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: 5,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Progress.Bar progress={item.percentage} color="green" />
                                            <Text>{item.percentage ? Math.round(item.percentage).toFixed(1) : "0"}%</Text>
                                        </View>

                                        <TouchableOpacity
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: 10,
                                                alignItems: 'center',
                                                alignSelf: 'flex-start',
                                            }}
                                            onPress={() => handleGoToDetail(item.id)}
                                        >
                                            <Text>Lihat Detail</Text>
                                            <Feather name="chevron-right" size={24} color="black" />
                                        </TouchableOpacity>
                                    </View>
                                ))
                            ) : (
                                <Text>No projects found</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>

                <FloatingButton />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: height, // Ensure the content is at least as tall as the screen
        flexGrow: 1,
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
    mainContainer: {
        height: '200vh',
        borderRadius: 20,
        margin: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    sectionContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    subHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subHeaderTextLeft: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    subHeaderTextRight: {
        fontSize: 14,
        color: 'gray',
    },
});

export default Project;
