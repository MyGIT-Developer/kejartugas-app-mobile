import React, { useState, useCallback, useMemo, useRef } from 'react';
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
    Animated,
    Platform
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Popover from 'react-native-popover-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { getProjectById, deleteProject } from '../api/projectTask';
import SlidingButton from '../components/SlidingButton';
import SlidingFragment from '../components/SlidingFragment';
import DetailProjekSatu from './DetailProjekSatu';
import DetailProjekDua from './DetailProjekDua';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');
import { FONTS } from '../constants/fonts';

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
    const [activeTab, setActiveTab] = useState('Detail');

    const pagerRef = useRef(null);
    const tabScrollRef = useRef(null);
    const tabItemRefs = useRef([]);

    const headerAnim = React.useRef(new Animated.Value(1)).current;
    const headerScaleAnim = React.useRef(new Animated.Value(1)).current;

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

    const handleGoToUpdate = () => {
        navigation.navigate('ProjectForm', {
            mode: 'update',
            initialProjectData: projectData,
        });
    };

    const renderHeader = () => (
        <Animated.View
            style={[
                styles.backgroundBox,
                {
                    opacity: headerAnim,
                    transform: [
                        {
                            scale: headerScaleAnim.interpolate({
                                inputRange: [0.9, 1],
                                outputRange: [0.95, 1],
                                extrapolate: 'clamp',
                            }),
                        },
                    ],
                },
            ]}
        >
            <LinearGradient
                colors={['#4A90E2', '#357ABD', '#2E5984']}
                style={styles.linearGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Header decorative elements */}
            <View style={styles.headerDecorations}>
                <Animated.View
                    style={[
                        styles.decorativeCircle1,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.6],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.5, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.decorativeCircle2,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.4],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.3, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.decorativeCircle3,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.7, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.decorativeCircle4,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.7, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.decorativeCircle5,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.7, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            <Animated.View
                style={[
                    styles.headerContainer,
                    {
                        opacity: headerAnim,
                        transform: [
                            {
                                translateY: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-30, 0],
                                }),
                            },
                            { scale: headerScaleAnim },
                        ],
                    },
                ]}
            >
                <Feather name="chevron-left" style={styles.backIcon} onPress={() => navigation.goBack()} />
                <View style={styles.headerContent}>
                    <View style={styles.headerTitleWrapper}>
                        <Animated.View
                            style={[
                                styles.headerIconContainer,
                                {
                                    opacity: headerAnim,
                                    transform: [
                                        {
                                            scale: headerAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.5, 1],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="clipboard-outline" size={28} color="white" />
                        </Animated.View>
                        <Animated.Text
                            style={[
                                styles.header,
                                {
                                    opacity: headerAnim,
                                    transform: [
                                        {
                                            scale: headerAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            Detail Projek
                        </Animated.Text>
                    </View>
                    <View style={styles.outerContainer}>
                        <View style={styles.buttonContainer}>
                            {fragments.map((tab, index) => (
                                <Pressable
                                    key={tab.title}
                                    ref={(ref) => (tabItemRefs.current[index] = ref)}
                                    style={[styles.button, activeTab === tab.title && styles.activeButton]}
                                    onPress={() => {
                                        setActiveTab(tab.title);
                                        pagerRef.current?.setPage(index);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.buttonText,
                                            activeTab === tab.title && styles.activeButtonText,
                                        ]}
                                    >
                                        {tab.title}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            </Animated.View>
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
                <PagerView
                    style={{ minHeight: 800 }}
                    initialPage={fragments.findIndex((t) => t.title === activeTab)}
                    onPageSelected={(e) => {
                        const index = e.nativeEvent.position;
                        const title = fragments[index].title;
                        setActiveTab(title);

                        // Scroll tab header to active tab
                        tabItemRefs.current[index]?.measureLayout(
                            tabScrollRef.current,
                            (x) => {
                                tabScrollRef.current?.scrollTo({ x: x - 16, animated: true }); // adjust offset if needed
                            },
                            (error) => console.warn('measure error', error),
                        );
                    }}
                    ref={pagerRef}
                >
                    {fragments.map((tab) => (
                        <View key={tab.title} style={{}}>
                            <tab.screen
                                projectId={projectId}
                                data={projectData}
                                onFetch={fetchProjectById}
                                setAlert={setAlert}
                                setJobsId={setJobsId}
                            />
                        </View>
                    ))}
                </PagerView>
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
    // New header styles matching AdhocDashboard
    backgroundBox: {
        height: 325,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 30,
    },
    headerContainer: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        position: 'relative',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
        gap: 10,
        marginTop: 20,
    },
    header: {
        fontSize: FONTS.size['3xl'],
        fontFamily: FONTS.family.bold,
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.8,
        marginBottom: 0,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    headerSubtitle: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.regular,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        marginTop: 4,
        letterSpacing: 0.2,
        lineHeight: 18,
    },
    headerTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 8,
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerDecorations: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: -30,
        right: -20,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        top: 40,
        left: -25,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 80,
        right: 30,
    },
    decorativeCircle4: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 150,
        left: -10,
    },
    decorativeCircle5: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: 120,
        left: 30,
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
        fontSize: FONTS.size['3xl'],
        fontFamily: FONTS.family.bold,
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.8,
        marginBottom: 0,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    backIcon: {
        position: 'absolute',
        top: 80,
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
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
        marginTop: 10,
        marginHorizontal: 20,
    },

    outerContainer: {
        borderRadius: 25,
        overflow: 'hidden',
        borderColor: 'white',
        borderWidth: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    button: {
        paddingVertical: 5,
        paddingHorizontal: 10,
    },
    activeButton: {
        backgroundColor: 'white',
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.5,
    },
    activeButtonText: {
        color: '#238FBA',
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
        maxWidth: '60%',
    },
    projectInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    projectName: {
        fontFamily: FONTS.family.bold,
        fontSize: FONTS.size['xl'],
        color: '#111827',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 24,
        gap: 6,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusText: {
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size.sm,
        letterSpacing: -0.5,
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
