import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    Dimensions,
    StyleSheet,
    RefreshControl,
    Platform,
    StatusBar,
    ScrollView,
    Animated,
} from 'react-native';
import { getProject } from '../api/projectTask';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { TouchableOpacity } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ProjectScrollView from '../components/ProjectScrollView';
import AccessDenied from '../components/AccessDenied';
import { FONTS } from '../constants/fonts';

const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

// Skeleton component for project card
const SkeletonCard = () => (
    <View style={[styles.cardContainer, { backgroundColor: '#f0f0f0' }]}>
        <View style={styles.card}>
            <View style={[styles.skeletonText, { width: '80%', height: 20, marginBottom: 10 }]} />
            <View style={[styles.skeletonText, { width: '60%', height: 15, marginBottom: 15 }]} />
            <View style={[styles.skeletonText, { width: '100%', height: 10, marginBottom: 10 }]} />
            <View style={[styles.skeletonText, { width: '40%', height: 20 }]} />
        </View>
    </View>
);

// Skeleton component for project section
const SkeletonSection = () => (
    <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
            <View style={[styles.skeletonText, { width: '40%', height: 20 }]} />
            <View style={[styles.skeletonText, { width: '20%', height: 20 }]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1, flexDirection: 'row' }}>
            {[...Array(3)].map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </ScrollView>
    </View>
);

const ProjectCard = ({ item, handleGoToDetail }) => (
    <TouchableOpacity onPress={() => handleGoToDetail(item.id)}>
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
                <Text style={{ fontFamily: 'Poppins-Medium', letterSpacing: -0.3 }}>
                    {item.percentage ? Math.round(item.percentage).toFixed(1) : '0'}%
                </Text>
            </View>
            <TouchableOpacity style={styles.detailButton} onPress={() => handleGoToDetail(item.id)}>
                <Text style={styles.detailButtonText}>Lihat Detail</Text>
                <Feather name="chevron-right" size={18} color="#444" />
            </TouchableOpacity>
        </View>
    </TouchableOpacity>
);

const ProjectSection = ({
    title,
    projects,
    status,
    handleGoTo,
    handleGoToDetail,
    limitToFive = false,
    filterByStatus = false,
}) => {
    let filteredProjects = projects;

    // Apply status filtering if enabled
    if (filterByStatus && projects) {
        filteredProjects = projects.filter((item) => {
            const match = item.task_status_counts?.find((t) => t.task_status === status);
            return match && match.count > 0;
        });
    }

    // Sort & optionally limit results
    filteredProjects = filteredProjects.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (limitToFive) filteredProjects = filteredProjects.slice(0, 5);

    // Only show projects where task_status_counts for this status is not 0
    const visibleProjects = filteredProjects.filter(
        (item) =>
            status === 'all' ||
            (item.task_status_counts && item.task_status_counts.find((t) => t.task_status === status && t.count > 0)),
    );

    console.log('Visible Projects:', visibleProjects);

    return (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {title} {status === 'all' ? `(${visibleProjects.length})` : ''}
                </Text>
                {visibleProjects.length > 0 && (
                    <TouchableOpacity onPress={() => handleGoTo(status)}>
                        <Text style={styles.seeAllText}>Lihat semua</Text>
                    </TouchableOpacity>
                )}
            </View>

            {visibleProjects.length === 0 ? (
                <View style={styles.cardContainer}>
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No projects found</Text>
                    </View>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {visibleProjects.map((item, index) => (
                        <View key={index} style={styles.cardContainer}>
                            {status === 'all' ? (
                                <ProjectCard item={item} handleGoToDetail={handleGoToDetail} />
                            ) : (
                                <View
                                    style={[
                                        styles.card,
                                        {
                                            flexDirection: 'row',
                                            gap: 12,
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        },
                                    ]}
                                >
                                    <View style={{ flex: 2, maxWidth: '60%', gap: 2 }}>
                                        <Text style={styles.projectNameLabel} numberOfLines={2}>
                                            Nama Projek
                                        </Text>
                                        <Text style={styles.projectName} numberOfLines={2}>
                                            {item.project_name}
                                        </Text>
                                        <View
                                            style={{
                                                alignSelf: 'flex-start',
                                                backgroundColor:
                                                    item.project_type === 'maintenance' ? '#FFF7E0' : '#E6F7FF',
                                                borderRadius: 8,
                                                paddingHorizontal: 10,
                                                paddingVertical: 4,
                                                marginTop: 4,
                                                marginBottom: 2,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons
                                                name={
                                                    item.project_type === 'maintenance'
                                                        ? 'construct-outline'
                                                        : 'briefcase-outline'
                                                }
                                                size={16}
                                                color={item.project_type === 'maintenance' ? '#E6A100' : '#1890FF'}
                                                style={{ marginRight: 4 }}
                                            />
                                            <Text
                                                style={{
                                                    fontFamily: FONTS.family.medium,
                                                    fontSize: FONTS.size.xs,
                                                    color: item.project_type === 'maintenance' ? '#E6A100' : '#1890FF',
                                                    letterSpacing: -0.3,
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {item.project_type === 'maintenance' ? 'Maintenance' : 'General'}
                                            </Text>
                                        </View>
                                    </View>
                                    <View
                                        style={{
                                            height: '80%',
                                            width: 1,
                                            backgroundColor: '#b4b4b4ff',
                                            alignSelf: 'center',
                                            marginRight: 5,
                                            borderRadius: 5,
                                        }}
                                    />
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            {
                                                // borderColor:
                                                //     status === 'workingOnIt' ? '#ec930fff' : '#d74b24ff',
                                                backgroundColor: status === 'workingOnIt' ? '#ffeed6ff' : '#fff1f0ff',
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.badgeTextNumber,
                                                { color: status === 'workingOnIt' ? '#ec930fff' : '#d74b24ff' },
                                            ]}
                                        >
                                            {item.task_status_counts.find((t) => t.task_status === status)?.count}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.badgeTextDescription,
                                                { color: status === 'workingOnIt' ? '#ec930fff' : '#d74b24ff' },
                                            ]}
                                        >
                                            {/* {status === 'workingOnIt'
                                                    ? 'Tugas Dalam Pengerjaan'
                                                    : 'Tugas Perlu Ditinjau'} */}
                                            Tugas
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );
};

const ProjectDashboard = () => {
    const navigation = useNavigation();
    const [project, setProject] = useState(null);
    const [filteredProjects, setFilteredProjects] = useState(null); // Filtered projects for search
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [taskCount, setTaskCount] = useState([]);
    const [hasAccess, setHasAccess] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // Search query state

    const headerAnim = React.useRef(new Animated.Value(1)).current;
    const headerScaleAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const getData = async () => {
            try {
                const companyId = await AsyncStorage.getItem('companyId');
                setCompanyId(companyId);
            } catch (error) {
                console.error('Error fetching AsyncStorage data:', error);
            }
        };
        getData();
    }, []);

    useEffect(() => {
        const checkAccessPermission = async () => {
            try {
                const accessPermissions = await AsyncStorage.getItem('access_permissions');
                const permissions = JSON.parse(accessPermissions);
                setHasAccess(permissions?.access_project === true);
            } catch (error) {
                console.error('Error checking access permission:', error);
                setHasAccess(false);
            }
        };
        checkAccessPermission();
    }, []);

    const fetchProject = async () => {
        setRefreshing(true);
        setLoading(true);
        try {
            const response = await getProject(companyId);
            setProject(response.data); // Assuming response contains the project data
            setFilteredProjects(response.data); // Initialize filtered projects
            setTaskCount(response.data.task_status_counts);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (companyId) {
            fetchProject();
        }
    }, [companyId]);

    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query === '') {
            setFilteredProjects(project); // Reset to full project list if search is cleared
        } else {
            const filtered = project?.filter((item) => item.project_name.toLowerCase().includes(query.toLowerCase()));
            setFilteredProjects(filtered);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <ScrollView
                    contentContainerStyle={styles.contentContainer}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchProject} />}
                >
                    <SkeletonSection />
                    <SkeletonSection />
                    <SkeletonSection />
                </ScrollView>
            );
        }

        if (error) {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>Error: {error}</Text>
                </View>
            );
        }

        return (
            <ScrollView
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchProject} />}
            >
                <ProjectSection
                    title="Semua Proyek"
                    projects={filteredProjects}
                    status="all"
                    handleGoTo={handleGoTo}
                    handleGoToDetail={handleGoToDetail}
                />
                <ProjectSection
                    title="Dalam Pengerjaan"
                    projects={filteredProjects}
                    status="workingOnIt"
                    handleGoTo={() => handleGoTo('onProgress')}
                />
                <ProjectSection
                    title="Dalam Peninjauan"
                    projects={filteredProjects}
                    status="onReview"
                    handleGoTo={() => handleGoTo('onReview')}
                />
            </ScrollView>
        );
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

    const handleGoTo = (projectType) => {
        switch (projectType) {
            case 'all':
                navigation.navigate('ProjectList');
                break;
            case 'onProgress':
                navigation.navigate('ProjectOnWorking', {
                    status: 'workingOnIt',
                    subStatus: 'rejected',
                });
                break;
            case 'onReview':
                navigation.navigate('ProjectOnWorking', { status: 'onReview' });
                break;
            default:
                console.log('Unknown project type');
        }
    };

    const handleGoToDetail = (projectId) => {
        navigation.navigate('DetailProjek', { projectId });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0E509E" hidden={true} />
            {renderHeader()}
            {hasAccess && (
                <>
                    <View style={styles.scrollViewContent}>
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
                                        Projek
                                    </Animated.Text>
                                </View>
                                <View style={styles.searchSection}>
                                    <Feather name="search" size={20} color="#A7AFB1" style={styles.searchIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Pencarian"
                                        placeholderTextColor="#A7AFB1"
                                        underlineColorAndroid="transparent"
                                        value={searchQuery}
                                        onChangeText={handleSearch}
                                    />
                                </View>
                            </View>
                        </Animated.View>

                        {/* Render Content */}
                        {renderContent()}
                    </View>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('ProjectForm', { mode: 'create' })} // Navigasi ke layar AddAdhoc
                    >
                        <Feather name="plus-circle" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </>
            )}
            {hasAccess === false && <AccessDenied setHasAccess={setHasAccess} />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingTop: 20,
        paddingBottom: 120,
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    backgroundBox: {
        height: 225,
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

    cardContainer: {
        marginHorizontal: 20,
        marginVertical: 15,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        height: 125,
        width: 312,
        justifyContent: 'space-between',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    projectNameLabel: {
        fontFamily: FONTS.family.semiBold,
        letterSpacing: -0.5,
        fontSize: FONTS.size.sm,
        color: '#888',
    },
    projectName: {
        fontFamily: FONTS.family.semiBold,
        letterSpacing: -0.5,
        fontSize: FONTS.size.md,
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
        gap: 6,
    },
    detailButtonText: {
        color: '#444',
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        letterSpacing: -0.5,
    },
    statusBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        height: 75,
        width: 75,
    },
    badgeTextNumber: {
        fontFamily: FONTS.family.bold,
        fontSize: FONTS.size['5xl'],
    },
    badgeTextDescription: {
        fontFamily: FONTS.family.medium,
        letterSpacing: -0.5,
        fontSize: FONTS.size.sm,
        textAlign: 'center',
    },
    headerSection: {
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        padding: 10,
        width: SCREEN_WIDTH,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    headerTitle: {
        fontSize: 24,
        color: 'white',
        fontFamily: 'Poppins-Bold',
        letterSpacing: -0.3,
        marginBottom: 15,
    },
    searchSection: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 30,
        margin: 10,
        alignItems: 'center',
        paddingHorizontal: 15,
        ...Platform.select({
            ios: {
                shadowColor: '#444',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    searchIcon: {
        padding: 10,
    },
    input: {
        flex: 1,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        paddingHorizontal: 5,
        color: '#333',
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
    },
    sectionContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: FONTS.size.md,
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.5,
    },
    seeAllText: {
        color: '#0E509E',
        fontSize: FONTS.size.md,
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.5,
    },
    skeletonText: {
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
    },
    noProjectContainer: {
        backgroundColor: 'white',
        borderRadius: 19,
        padding: 15,
        height: 125,
        width: 312,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    noProjectText: {
        fontSize: 10,
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    accessDeniedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F0F0F0',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    message: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 20,
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});

export default ProjectDashboard;
