import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ActivityIndicator, Dimensions, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { Feather } from '@expo/vector-icons';

import { getProjectById } from '../api/projectTask';
import SlidingButton from '../components/SlidingButton';
import SlidingFragment from '../components/SlidingFragment';
import DetailProjekSatu from './DetailProjekSatu';
import DetailProjekDua from './DetailProjekDua';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');
const DetailProjek = ({ route }) => {
    const { projectId } = route.params;
    const navigation = useNavigation();
    const [projectData, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFragment, setActiveFragment] = useState(0);
    const [menuVisible, setMenuVisible] = useState(false);
    
    const fragments = useMemo(
        () => [
            { title: 'Detail', screen: DetailProjekSatu },
            { title: 'Semua Tugas', screen: DetailProjekDua },
        ],
        [],
    );

    const fetchProjectById = useCallback(async () => {
        try {
            const companyId = await AsyncStorage.getItem('companyId');
            const response = await getProjectById(projectId, companyId);
            setProjectData(response);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useFocusEffect(
        useCallback(() => {
            fetchProjectById();
        }, [fetchProjectById]),
    );

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchProjectById();
        setRefreshing(false);
    }, [fetchProjectById]);

    const getStatusText = (projectStatus) => {
        switch (projectStatus) {
            case 'workingOnit':
                return 'Working On It';
            case 'Completed':
                return 'Completed';
            case 'onPending':
                return 'Open';
            default:
                return '#dedede';
        }
    };

    const getBackgroundColor = (projectStatus) => {
        switch (projectStatus) {
            case 'workingOnit':
                return '#d4d4d4';
            case 'Completed':
                return '#9bebb0';
            case 'onPending':
                return '#f7eb9e';
            default:
                return '#dedede';
        }
    };

    const getIndicatorDotColor = (projectStatus) => {
        switch (projectStatus) {
            case 'workingOnit':
                return '#636363';
            case 'Completed':
                return '#399e53';
            case 'onPending':
                return '#f7af1e';
            default:
                return '#aaaaaa';
        }
    };

    const handleSwipe = useCallback(
        (index) => {
            if (index >= 0 && index < fragments.length) {
                setActiveFragment(index);
            }
        },
        [fragments.length],
    );

    if (loading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#0E509E" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centeredContainer}>
                <Text>Error: {error}</Text>
            </View>
        );
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
            <View style={styles.contentContainer}>
                <View style={styles.upperContainer}>
                    <View style={styles.projectHeaderContainer}>
                        <Text>Nama Proyek</Text>
                        <Feather name="more-horizontal" size={24} color="black" />
                    </View>
                    <View style={styles.projectInfoContainer}>
                        <View style={styles.projectTextContainer}>
                            <Text style={styles.projectName}>{projectData.project_name}</Text>
                            <View
                                style={[
                                    styles.statusContainer,
                                    { backgroundColor: getBackgroundColor(projectData.project_status) },
                                ]}
                            >
                                <Text style={{ color: getIndicatorDotColor(projectData.project_status) }}>
                                    {getStatusText(projectData.project_status)}
                                </Text>
                            </View>
                        </View>
                        <Progress.Circle
                            size={80}
                            progress={projectData.percentage / 100 || 0}
                            thickness={8}
                            showsText={true}
                            color="#4CAF50"
                            borderWidth={2}
                            borderColor="#E8F5E9"
                        />
                    </View>
                </View>
                <View>
                       <SlidingFragment
                    fragments={fragments}
                    activeFragment={activeFragment}
                    onSwipe={handleSwipe}
                    data={projectData}
                />
                </View>
             
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    backgroundBox: {
        height: 155,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    contentContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        marginHorizontal: 20,
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
    upperContainer: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
        marginTop: 10,
    },
    projectHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    projectTextContainer: {
        flexDirection: 'column',
        gap: 5,
    },
    projectInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: 10,
    },
    projectName: {
        color: 'black',
        fontWeight: '600',
        fontSize: 20,
    },
    statusContainer: {
        paddingVertical: 5,
        backgroundColor: '#d7d7d7',
        borderRadius: 25,
        width: 100,
        textAlign: 'center',
        alignItems: 'center',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DetailProjek;
