import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    RefreshControl,
    StyleSheet,
    Modal,
    Pressable,
    TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Popover from 'react-native-popover-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { Feather } from '@expo/vector-icons';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { getProjectById, deleteProject } from '../api/projectTask';
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
    const [visible, setVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [jobsId, setJobsId] = useState(null);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [isPressed, setIsPressed] = useState(false);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const togglePopover = () => setVisible(!visible);

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

    const deleteProjectHandler = async () => {
        setLoading(true);
        const jobsId = await AsyncStorage.getItem('userJob');
        try {
            const response = await deleteProject(projectId, jobsId);

            setAlert({ show: true, type: 'success', message: response.message });

            setTimeout(() => {
                navigation.navigate('ProjectList');
            }, 2000);
        } catch (error) {
            console.log('Error creating project:', error);
            setAlert({ show: true, type: 'error', message: error.message });
        } finally {
            setLoading(false);
        }
    };

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

    const percentageProject = Math.round(projectData.percentage).toFixed(0);
    
    const handleGoToUpdate = () => {
        navigation.navigate('ProjectForm', {
            mode: 'update',
            initialProjectData: projectData,
        });
    };

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
            <View style={styles.headerSection}>
                <Feather name="chevron-left" style={styles.backIcon} onPress={() => navigation.goBack()} />
                <Text style={styles.header}>Detail Projek</Text>
                <SlidingButton fragments={fragments} activeFragment={activeFragment} onPress={setActiveFragment} />
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
                contentContainerStyle={styles.contentContainer}
            >
                <View style={styles.upperContainer}>
                    <View style={styles.projectHeaderContainer}>
                        <Text style={{ fontFamily: 'Poppins-Regular' }}>Nama Proyek</Text>

                        
                        <Popover
                            isVisible={visible}
                            onRequestClose={togglePopover}
                            from={
                                <Pressable onPress={togglePopover} style={styles.iconButton}>
                                    <Feather name="more-horizontal" size={24} color="black" />
                                </Pressable>
                            }
                            placement="bottom"
                        >
                            <View style={styles.menuContainer}>
                                {/* <Pressable
                                    onPress={() => handleGoToUpdate()}
                                    style={styles.menuItem}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: '#277594' }]}>
                                        <Feather name="edit" size={20} color="white" />
                                    </View>

                                    <Text style={[styles.optionText, { color: 'black' }]}>Edit Proyek</Text>
                                </Pressable> */}
                                {/* <Pressable
                                    onPress={() => {
                                        togglePopover();
                                    }}
                                    style={styles.menuItem}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: '#27CF56' }]}>
                                        <Feather name="check-circle" size={20} color="white" />
                                    </View>

                                    <Text style={[styles.optionText, { color: 'black' }]}>Selesai</Text>
                                </Pressable> */}
                                {/* <Pressable
                                    onPress={() => {
                                        togglePopover();
                                    }}
                                    style={styles.menuItem}
                                >
                                    <View style={[styles.optionIcon, { backgroundColor: '#4078BB' }]}>
                                        <Feather name="share-2" size={20} color="white" />
                                    </View>

                                    <Text style={[styles.optionText, { color: 'black' }]}>Bagikan</Text>
                                </Pressable> */}
                                <Pressable
                                    style={[
                                        styles.menuItem,
                                        isPressed && styles.pressedItem, // Apply a different style when pressed
                                    ]}
                                    onPressIn={() => setIsPressed(true)}
                                    onPressOut={() => setIsPressed(false)}
                                    onPress={() => deleteProjectHandler()}
                                >
                                    <View
                                        style={[
                                            styles.optionIcon,
                                            { backgroundColor: isPressed ? '#C43B54' : '#DF4E6E' },
                                        ]}
                                    >
                                        <Feather name="trash-2" size={20} color="#fff" />
                                    </View>
                                    <Text style={[styles.optionText, { color: isPressed ? 'gray' : 'black' }]}>
                                        Hapus
                                    </Text>
                                </Pressable>
                            </View>
                        </Popover>
                    </View>
                    <View style={styles.projectInfoContainer}>
                        <View style={styles.projectTextContainer}>
                            <TouchableOpacity onPress={toggleExpand}>
                                <Text
                                    style={styles.projectName}
                                    numberOfLines={isExpanded ? undefined : 2}
                                    ellipsizeMode="tail"
                                >
                                    {projectData.project_name}
                                </Text>
                            </TouchableOpacity>
                            <View
                                style={[
                                    styles.statusContainer,
                                    { backgroundColor: getBackgroundColor(projectData.project_status) },
                                ]}
                            >
                                <Text
                                    style={{
                                        color: getIndicatorDotColor(projectData.project_status),
                                        fontFamily: 'Poppins-Medium',
                                        letterSpacing: -0.3,
                                    }}
                                >
                                    {getStatusText(projectData.project_status)}
                                </Text>
                            </View>
                        </View>
                        {/* <Progress.Circle
                            size={80}
                            progress={percentageProject}
                            thickness={8}
                            showsText={true}
                            color="#27B44E"
                            borderWidth={2}
                            borderColor="#E8F5E9"
                        /> */}
                        <Progress.Circle
                                size={75}
                                progress={percentageProject}
                                thickness={6}
                                color={
                                    percentageProject === 0
                                        ? '#E0E0E0'
                                        :percentageProject < 50
                                        ? '#F69292'
                                        : percentageProject < 75
                                        ? '#F0E08A'
                                        : '#C9F8C1'
                                }
                                unfilledColor="#E8F5E9"
                                borderWidth={0}
                                showsText={true}
                                formatText={() => `${percentageProject}%`}
                                textStyle={{
                                    fontFamily: 'Poppins-SemiBold',
                                    fontSize: 14,
                                    color:
                                    percentageProject === 0
                                            ? '#000000'
                                            :percentageProject < 50
                                            ? '#811616'
                                            :percentageProject < 75
                                            ? '#656218'
                                            : '#0A642E', // Text color based on progress
                                }}
                            />
                    </View>
                </View>

                <SlidingFragment fragments={fragments} activeFragment={activeFragment} data={projectData} onFetch={fetchProjectById}/>
            </ScrollView>
            <ReusableBottomPopUp
                show={alert.show}
                alertType={alert.type}
                message={alert.message}
                onConfirm={() => setAlert((prev) => ({ ...prev, show: false }))}
            />
        </View>
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
    },
    headerSection: {
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        marginTop: 20,
        gap: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        alignSelf: 'center',
        fontFamily: 'Poppins-Bold',
        marginTop: 30,
        letterSpacing: -1,
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
        marginTop: 10,
        marginHorizontal: 20,
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
        maxWidth: '70%',
    },
    projectInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    projectName: {
        color: 'black',
        fontSize: 20,
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
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
    menuContainer: {
        width: '100%',
        padding: 10,
        gap: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    menuText: {
        marginLeft: 10,
        fontSize: 16,
    },
    iconButton: {
        padding: 10,
    },
    optionIcon: {
        padding: 5,
        borderRadius: 5,
    },
    optionText: {
        fontWeight: 'bold',
    },
    lowerContainer: {
        flexGrow: 1,
        width: '100%',
        paddingHorizontal: 20,
    },
});

export default DetailProjek;
