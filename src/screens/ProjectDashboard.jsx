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
} from 'react-native';
import FloatingButton from '../components/FloatingButtonProject';
import { getProject } from '../api/projectTask';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TextInput } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import ProjectScrollView from '../components/ProjectScrollView';
import AccessDenied from '../components/AccessDenied';

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
                <Text style={{ fontFamily: 'Poppins-Medium', letterSpacing: -0.3 }}>
                    {item.percentage ? Math.round(item.percentage).toFixed(1) : '0'}%
                </Text>
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
                <Text style={styles.sectionTitle}>
                    {title} ({projects.length})
                </Text>
            ) : (
                <Text style={styles.sectionTitle}>{title}</Text>
            )}
            <TouchableOpacity onPress={() => handleGoTo(status)}>
                <Text style={styles.seeAllText}>Lihat semua</Text>
            </TouchableOpacity>
        </View>

        {status === 'all' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {projects && Array.isArray(projects) ? (
                    projects
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        .slice(0, 5)
                        .map((item, index) => (
                            <ProjectCard key={index} item={item} handleGoToDetail={handleGoToDetail} />
                        ))
                ) : (
                    <View style={styles.noProjectContainer}>
                        <Text style={styles.noProjectText}>No projects found</Text>
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
    const [filteredProjects, setFilteredProjects] = useState(null); // Filtered projects for search
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [companyId, setCompanyId] = useState(null);
    const [taskCount, setTaskCount] = useState([]);
    const [hasAccess, setHasAccess] = useState(null);
    const [searchQuery, setSearchQuery] = useState(''); // Search query state

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
        if (!hasAccess) {
            return <AccessDenied />;
        }

        if (loading) {
            return (
                <>
                    <SkeletonSection />
                    <SkeletonSection />
                    <SkeletonSection />
                </>
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
            <>
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
            </>
        );
    };

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
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0E509E" hidden={true} />
            {hasAccess && (
                <>
                    <ScrollView
                        contentContainerStyle={styles.contentContainer}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchProject} />}
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
                            <Text style={styles.headerTitle}>Projek</Text>
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

                        {/* Render Content */}
                        {renderContent()}
                    </ScrollView>
                    <FloatingButton bottom={100} />
                </>
            )}
            {!hasAccess && <AccessDenied />}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    contentContainer: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    backgroundBox: {
        height: Platform.OS === 'ios' ? 175 : 155,
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
                shadowColor: '#000',
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
        shadowColor: '#000',
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
});

export default ProjectDashboard;
