import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import FloatingButton from '../components/FloatingButtonProject';
import { getProject } from '../api/projectTask';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView, TextInput } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ProjectScrollView from '../components/ProjectScrollView';

const ProjectCard = ({ item, handleGoToDetail }) => (
    <View style={styles.cardContainer}>
        <View style={styles.card}>
            <Text style={styles.projectName} numberOfLines={2} ellipsizeMode="tail">
                {item.project_name}
            </Text>
            <View style={styles.progressContainer}>
                <Progress.Bar
                    progress={item.percentage / 100}
                    color="#27B44E"
                    width={null}
                    style={styles.progressBar}
                />
                <Text style={{  fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,}}>{item.percentage ? Math.round(item.percentage).toFixed(1) : '0'}%</Text>
            </View>
            <TouchableOpacity style={styles.detailButton} onPress={() => handleGoToDetail(item.id)}>
                <Text style={{ fontFamily: 'Poppins-Medium', letterSpacing: -0.3 }}>Lihat Detail</Text>
                <Feather name="chevron-right" size={24} color="black" />
            </TouchableOpacity>
        </View>
    </View>
);

const ProjectSection = ({ title, projects, status, handleGoTo, handleGoToDetail }) => (
    <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
            {status === 'all' ? (
                 <Text style={styles.sectionTitle}>{title} ({projects.length})</Text>
            ) : (
                <Text style={styles.sectionTitle}>{title}</Text>
            )}
           
            <TouchableOpacity onPress={() => handleGoTo(status)}>
                <Text style={styles.seeAllText}>Lihat semua</Text>
            </TouchableOpacity>
        </View>
        {status === 'all' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, flexDirection: 'row' }}>
                {projects && Array.isArray(projects) ? (
                    projects
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 5)
                        .map((item, index) => (
                            <ProjectCard key={index} item={item} handleGoToDetail={handleGoToDetail} />
                        ))
                ) : (
                    <View
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 19,
                            padding: 15,
                            height: 125,
                            width: 312,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 5,
                            textAlign: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text style={{ fontSize: 10, fontFamily: 'Poppins-Medium', letterSpacing: -0.3 }}>
                            No projects found
                        </Text>
                    </View>
                )}
            </ScrollView>
        ) : (
            <ProjectScrollView projects={projects} status={status} />
        )}
    </View>
);

const ProjectDashboard = () => {
    const navigation = useNavigation();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [taskCount, setTaskCount] = useState([]);

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
            setTaskCount(response.data.task_status_counts);
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
    }, [companyId]);

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

    const handleGoTo = (projectType) => {
        switch (projectType) {
            case 'all':
                navigation.navigate('ProjectList');
                break;
            case 'onProgress':
                navigation.navigate('ProjectOnWorking');
                break;
            case 'onReview':
                navigation.navigate('TaskOnReview');
                break;
            default:
                console.log('Unknown project type');
        }
    };

    const handleGoToDetail = (projectId) => {
        navigation.navigate('DetailProjek', { projectId });
    };

    return (
        <>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.backgroundBox}>
                    <LinearGradient
                        colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                        style={styles.linearGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </View>
                <View style={styles.headerSection}>
                    <Text style={styles.headerTitle}>Projek</Text>
                    <View style={styles.searchSection}>
                        <Feather name="search" />
                        <TextInput style={styles.input} placeholder="Pencarian" underlineColorAndroid="transparent" />
                    </View>
                </View>

                <ScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#0E509E']}
                            tintColor="#0E509E"
                        />
                    }
                    contentContainerStyle={{ marginBottom: 100 }}
                >
                    <ProjectSection
                        title="Semua Proyek"
                        projects={project}
                        status="all"
                        handleGoTo={handleGoTo}
                        handleGoToDetail={handleGoToDetail}
                    />
                    <ProjectSection
                        title="Dalam Pengerjaan"
                        projects={project}
                        status="workingOnIt"
                        handleGoTo={() => handleGoTo('onProgress')}
                    />
                    <ProjectSection
                        title="Dalam Peninjauan"
                        projects={project}
                        status="onReview"
                        handleGoTo={() => handleGoTo('onReview')}
                    />
                </ScrollView>
            </ScrollView>
            <FloatingButton />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    backgroundBox: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    linearGradient: {
        flex: 1,
    },
    cardContainer: {
        marginHorizontal: 20,
        marginVertical: 15,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 19,
        padding: 15,
        height: 125,
        width: 312,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    projectName: {
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
        fontSize: 16,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    progressBar: {
        flex: 1,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    backgroundBox: {
        height: 155, // Set your desired height
        width: '100%', // Set your desired width
        position: 'absolute', // Position it behind other elements
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1, // Ensure the gradient covers the entire view
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerSection: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        width: SCREEN_WIDTH,
        gap: 10,
    },
    headerTitle: {
        fontSize: 24,
        color: 'white',
        alignSelf: 'center',
        fontFamily: 'Poppins-Bold',
        letterSpacing: -0.3,
        lineHeight: 30,
        marginTop: 50,
    },
    searchSection: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 30,
        margin: 10,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    searchIcon: {
        padding: 10,
    },
    input: {
        flex: 1,
        backgroundColor: 'white',
        color: '#A7AFB1',
        textAlign: 'center',
        letterSpacing: -1,
        fontWeight: 'semibold',
    },
    sectionContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginVertical: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
        lineHeight: 30,
    },
    seeAllText: {
        color: '#0E509E',
        fontFamily: 'Poppins-Regular',
        lineHeight: 30,
    },
});

export default ProjectDashboard;
