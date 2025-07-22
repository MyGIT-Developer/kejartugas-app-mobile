import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet, RefreshControl, Animated, TouchableOpacity, Pressable, Platform } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { Feather, Ionicons } from '@expo/vector-icons';

import FloatingButton from '../components/FloatingButtonProject';
import SlidingButton from '../components/SlidingButton';
import SlidingFragment from '../components/SlidingFragment';
import { getProject } from '../api/projectTask';

import Shimmer from '../components/Shimmer';
import { FONTS } from '../constants/fonts';

const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

// Skeleton component for project item
const SkeletonItem = () => (
    <View style={[styles.projectItem, { backgroundColor: '#f0f0f0', gap: 10 }]}>
        <Shimmer width={SCREEN_WIDTH * 0.6} height={20} style={styles.shimmerText} />
        <Shimmer width={275} height={20} style={styles.shimmerText} />
        <Shimmer width={100} height={20} style={styles.shimmerText} />
    </View>
);


const ProjectList = () => {
    const navigation = useNavigation();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [activeFragment, setActiveFragment] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    const [activeTab, setActiveTab] = useState('Semua Proyek');

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const pagerRef = useRef(null);
    const tabScrollRef = useRef(null);
    const tabItemRefs = useRef([]);

    const headerAnim = React.useRef(new Animated.Value(1)).current;
    const headerScaleAnim = React.useRef(new Animated.Value(1)).current;

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
                <Text style={styles.detailButtonText}>Lihat Detail</Text>
                <Feather name="chevron-right" size={18} color="#444" />
            </TouchableOpacity>
        </View>
    );

    const ProjectListView = ({ filterType }) => {
        const filteredProjects = project
            ?.filter((item) => item.project_type === filterType || !filterType) || [];

        const getEmptyMessage = () => {
            if (!filterType) return 'Tidak ada Projek'; // Jika tidak ada filter, pesan umum
            if (filterType === 'general') return 'Tidak ada projek General';
            if (filterType === 'maintenance') return 'Tidak ada projek Maintenance';
            // Anda bisa menambahkan tipe proyek lainnya di sini jika diperlukan
            return 'Tidak ada Projek';
        };

        return (
            <View style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={[styles.projectList, { paddingBottom: 100 }]}
                    showsVerticalScrollIndicator={true}
                >
                    {loading ? (
                        // Render skeleton items while loading
                        [...Array(5)].map((_, index) => <SkeletonItem key={index} />)
                    ) : filteredProjects.length > 0 ? (
                        filteredProjects
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                            .map(renderProjectItem)
                    ) : (
                        <View style={styles.projectItem}>
                            <Text style={{ fontFamily: 'Poppins-Regular', letterSpacing: -0.3, color: "black", textAlign: "center" }}>
                                {getEmptyMessage()}
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    };


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
        <>
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
                                Daftar Proyek
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

                <PagerView
                    style={{ flex: 1 }}
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
                        <View key={tab.title} style={{ flex: 1 }}>
                            <View style={{ flex: 1 }}>
                                <tab.screen
                                    // projectId={projectId}
                                    data={project}
                                    onFetch={fetchProject}
                                    setAlert={setError}
                                    setJobsId={setProject}
                                />
                            </View>
                        </View>
                    ))}
                </PagerView>
            </View>
            <FloatingButton bottom={20} />
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    backIcon: {
        position: 'absolute',
        top: 80,
        left: 20,
        color: 'white',
        fontSize: 24,
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
        // flexWrap: 'wrap',
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
        flexGrow: 1,       // ✅ Important
        paddingBottom: 100, // Ensure room for last items
    },
    projectItem: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#444',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
        elevation: 5,
    },
    projectName: {
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size['lg'],
        color: '#111827',
        marginBottom: 10,
        letterSpacing: -0.5,
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
        fontFamily: FONTS.family.regular,
        fontSize: FONTS.size.sm,
        letterSpacing: -0.3,
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailButtonText: {
        color: '#444',
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        letterSpacing: -0.5,
    },
    shimmerContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    shimmerMessageContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    shimmerAvatar: {
        borderRadius: 20,
        marginRight: 10,
    },
    shimmerTextContainer: {
        flex: 1,
    },
    shimmerText: {
        borderRadius: 5,
    },
});

export default ProjectList;
