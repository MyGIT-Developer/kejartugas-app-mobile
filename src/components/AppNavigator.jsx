import React, { useRef, useCallback, useMemo } from 'react';
import { View, Animated, Platform, StyleSheet, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Home from '../screens/Home';
import Kehadiran from '../screens/Kehadiran';
import Profile from '../screens/Profile';
import ProjectDashboard from '../screens/ProjectDashboard';
import Tugas from '../screens/Tugas';
import { HomeIcon, KehadiranIcon, ProfileIcon, ProjectIcon, TugasIcon } from '../../assets/icon/icons';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const SCREEN_OPTIONS = {
    Home: { component: Home, icon: HomeIcon },
    Tugas: { component: Tugas, icon: TugasIcon },
    Kehadiran: { component: Kehadiran, icon: KehadiranIcon },
    Project: { component: ProjectDashboard, icon: ProjectIcon },
    Profile: { component: Profile, icon: ProfileIcon },
};

const AppNavigator = () => {
    const insets = useSafeAreaInsets();
    const tabBarVisibility = useRef(new Animated.Value(1)).current;
    const scaleAnims = useRef({
        Home: new Animated.Value(1),
        Tugas: new Animated.Value(1),
        Kehadiran: new Animated.Value(1),
        Project: new Animated.Value(1),
        Profile: new Animated.Value(1),
    }).current;

    const animateTab = useCallback((routeName, focused) => {
        Animated.spring(scaleAnims[routeName], {
            toValue: focused ? 1.2 : 1,
            useNativeDriver: true,
            tension: 100,
            friction: 7,
        }).start();
    }, [scaleAnims]);

    const screenOptions = useCallback(
        ({ route }) => ({
            tabBarShowLabel: false,
            headerShown: false,
            tabBarStyle: {
                ...styles.tabBar,
                bottom: Platform.OS === 'ios' ? 5 + insets.bottom : 20,
                height: Platform.OS === 'ios' ? 85 + insets.bottom : 75,
                paddingBottom: Platform.OS === 'ios' ? insets.bottom : 5,
                transform: [
                    {
                        translateY: tabBarVisibility.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0],
                        }),
                    },
                ],
            },
            tabBarBackground: () => (
                <View style={styles.tabBarBackground}>
                    <LinearGradient
                        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
                        style={styles.gradientBackground}
                    />
                    <View style={styles.blurOverlay} />
                </View>
            ),
            tabBarIcon: ({ focused }) => {
                const Icon = SCREEN_OPTIONS[route.name].icon;
                
                // Animate when focus changes
                React.useEffect(() => {
                    animateTab(route.name, focused);
                }, [focused]);

                return (
                    <View style={styles.iconWrapper}>
                        <Animated.View
                            style={[
                                styles.iconContainer,
                                focused && styles.activeIconContainer,
                                route.name === 'Kehadiran' && styles.kehadiranIconContainer(focused),
                                route.name !== 'Kehadiran' && {
                                    transform: [{ scale: scaleAnims[route.name] }]
                                }
                            ]}
                        >
                            {route.name === 'Kehadiran' ? (
                                <LinearGradient
                                    colors={focused ? ['#667eea', '#764ba2'] : ['#4A90E2', '#357ABD']}
                                    style={styles.kehadiranGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Icon focused={focused} />
                                </LinearGradient>
                            ) : (
                                <>
                                    {focused && <View style={styles.activeIndicator} />}
                                    <Icon focused={focused} />
                                </>
                            )}
                        </Animated.View>
                        {focused && route.name !== 'Kehadiran' && (
                            <View style={styles.activeDot} />
                        )}
                    </View>
                );
            },
        }),
        [insets, tabBarVisibility, scaleAnims, animateTab],
    );

    const hideTabBar = useCallback(() => {
        Animated.timing(tabBarVisibility, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [tabBarVisibility]);

    const showTabBar = useCallback(() => {
        Animated.timing(tabBarVisibility, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [tabBarVisibility]);

    const screenList = useMemo(
        () =>
            Object.entries(SCREEN_OPTIONS).map(([name, { component }]) => (
                <Tab.Screen key={name} name={name} component={component} />
            )),
        [],
    );

    return <Tab.Navigator screenOptions={screenOptions}>{screenList}</Tab.Navigator>;
};

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        right: 16,
        left: 16,
        elevation: 20,
        borderRadius: 25,
        borderTopWidth: 0,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        overflow: 'visible',
        backgroundColor: 'transparent',
    },
    tabBarBackground: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 25,
        overflow: 'hidden',
    },
    gradientBackground: {
        flex: 1,
        borderRadius: 25,
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    iconWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingVertical: 8,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        borderRadius: 16,
        position: 'relative',
    },
    activeIconContainer: {
        backgroundColor: 'rgba(14, 80, 158, 0.1)',
        shadowColor: '#0E509E',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 5,
    },
    activeIndicator: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#0E509E',
        opacity: 0.3,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0E509E',
        marginTop: 4,
        shadowColor: '#0E509E',
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
    },
    kehadiranIconContainer: (focused) => ({
        top: -25,
        width: Platform.OS === 'ios' ? 70 : 70,
        height: Platform.OS === 'ios' ? 70 : 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: focused ? '#667eea' : '#4A90E2',
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
        elevation: 12,
        borderWidth: 4,
        borderColor: '#fff',
    }),
    kehadiranGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AppNavigator;
