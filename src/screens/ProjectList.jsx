import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { Feather } from '@expo/vector-icons';

import FloatingButton from '../components/FloatingButtonProject';
import SlidingButton from '../components/SlidingButton';
import SlidingFragment from '../components/SlidingFragment';
import { getProject } from '../api/projectTask';

const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

const ProjectList = () => {
    const navigation = useNavigation();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [activeFragment, setActiveFragment] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };
    useEffect(() => {
        const getData = async () => {
            try {
                const id = await AsyncStorage.getItem('companyId');
                setCompanyId(id);
            } catch (error) {
                console.error('Error fetching AsyncStorage data:', error);
            }
        };
        getData();
    }, []);

    const fetchProject = useCallback(async () => {
        if (!companyId) return;
        try {
            const response = await getProject(companyId);
            setProject(response.data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    }, [companyId]);

    useFocusEffect(
        useCallback(() => {
            fetchProject();
        }, [fetchProject]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchProject();
        setRefreshing(false);
    }, [fetchProject]);

    const handleGoToDetail = (projectId) => {
        navigation.navigate('DetailProjek', { projectId });
    };

    const renderProjectItem = (item) => (
        <View key={item.id} style={styles.projectItem}>
            <TouchableOpacity onPress={toggleExpand}>
                <Text style={styles.projectName} numberOfLines={isExpanded ? undefined : 2} ellipsizeMode="tail">
                    {item.project_name}
                </Text>
            </TouchableOpacity>
            <View style={styles.progressContainer}>
                <Progress.Bar
                    progress={item.percentage / 100}
                    color="#27B44E"
                    width={null}
                    style={styles.progressBar}
                />
                <Text style={styles.percentageText}>
                    {item.percentage ? Math.round(item.percentage).toFixed(1) : '0'}%
                </Text>
            </View>
            <TouchableOpacity style={styles.detailButton} onPress={() => handleGoToDetail(item.id)}>
                <Text style={{  fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,}}>Lihat Detail</Text>
                <Feather name="chevron-right" size={24} color="black" />
            </TouchableOpacity>
        </View>
    );

    const ProjectListView = ({ filterType }) => (
        <ScrollView
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#0E509E']}
                    tintColor="#0E509E"
                />
            }
            contentContainerStyle={styles.projectList}
        >
            {project && Array.isArray(project) ? (
                project &&
                project.filter((item) => item.project_type === filterType || !filterType).map(renderProjectItem)
            ) : (
                <View>
                    <Text style={{ fontFamily: 'Poppins-Regular', letterSpacing: -0.3 }}>Tidak ada Projek</Text>
                </View>
            )}
        </ScrollView>
    );

    const fragments = [
        {
            title: 'Semua Proyek',
            screen: () => <ProjectListView />,
        },
        {
            title: 'General',
            screen: () => <ProjectListView filterType="general" />,
        },
        {
            title: 'Maintenance',
            screen: () => <ProjectListView filterType="maintenance" />,
        },
    ];

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text>Error: {error}</Text>
            </View>
        );
    }

    return (
        <>
            <View style={styles.container}>
                <View style={styles.backgroundBox}>
                    <LinearGradient
                        colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                        style={styles.linearGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </View>

                <View style={styles.headerSection}>
                    <Feather name="chevron-left" style={styles.backIcon} onPress={() => navigation.goBack()} />
                    <Text style={styles.header}>Projek</Text>
                    <SlidingButton fragments={fragments} activeFragment={activeFragment} onPress={setActiveFragment} />
                </View>

                <ScrollView style={styles.sectionContainer}>
                    <SlidingFragment
                        fragments={fragments}
                        activeFragment={activeFragment}
                        onSwipe={setActiveFragment}
                        data={project}
                    />
                </ScrollView>
            </View>
            <FloatingButton />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        maxHeight: height,
        flexGrow: 1,
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
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        marginTop: 20,
        gap: 20,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        letterSpacing: -1,
        marginTop: 35,
    },
    backIcon: {
        position: 'absolute',
        top: 35,
        left: 20,
        color: 'white',
        fontSize: 24,
    },
    sectionContainer: {
        flexGrow: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    projectList: {
        padding: 20,
        width: SCREEN_WIDTH,
    },
    projectItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 5,
    },
    projectName: {
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
        fontSize: 16,
        marginBottom: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    progressBar: {
        flex: 1,
    },
    percentageText: {
        marginLeft: 10,
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
});

export default ProjectList;
