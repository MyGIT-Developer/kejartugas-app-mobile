import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { View, Animated, Platform, StyleSheet, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Home from '../screens/Home';
import Kehadiran from '../screens/Kehadiran';
import Tugas from '../screens/Tugas';

import { HomeIcon, KehadiranIcon, TugasIcon } from '../../assets/icon/icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Tab = createBottomTabNavigator();

const SCREEN_OPTIONS = {
    Home: { component: Home, icon: HomeIcon },
    Kehadiran: { component: Kehadiran, icon: KehadiranIcon },
    Tugas: { component: Tugas, icon: TugasIcon },
};

const AppNavigator = () => {
    const [hasAccess, setHasAccess] = useState(false);
    const insets = useSafeAreaInsets();
    const tabBarVisibility = useRef(new Animated.Value(1)).current;
    const scaleAnims = useRef({
        Home: new Animated.Value(1),
        Tugas: new Animated.Value(1),
        Kehadiran: new Animated.Value(1),
        Project: new Animated.Value(1),
        Profile: new Animated.Value(1),
    }).current;

    const animateTab = useCallback(
        (routeName, focused) => {
            Animated.spring(scaleAnims[routeName], {
                toValue: focused ? 1.2 : 1,
                useNativeDriver: true,
                tension: 100,
                friction: 7,
            }).start();
        },
        [scaleAnims],
    );

    useEffect(() => {
        const checkAccessPermission = async () => {
            try {
                const accessPermissions = await AsyncStorage.getItem('access_permissions');
                const permissions = JSON.parse(accessPermissions);
                setHasAccess(permissions);
            } catch (error) {
                console.error('Error checking access permission:', error);
                setHasAccess(false);
            }
        };
        checkAccessPermission();
    }, []);

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
                    <View style={styles.solidBackground} />
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
                                    transform: [{ scale: scaleAnims[route.name] }],
                                },
                            ]}
                        >
                            {route.name === 'Kehadiran' ? (
                                <LinearGradient
                                    colors={focused ? ['#0E509E', '#5FA0DC'] : ['#0E509E', '#357ABD']}
                                    style={styles.kehadiranGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Icon focused={focused} />
                                </LinearGradient>
                            ) : (
                                <>
                                    <Icon focused={focused} />
                                </>
                            )}
                        </Animated.View>
                        {focused && route.name !== 'Kehadiran' && <View style={styles.activeDot} />}
                    </View>
                );
            },
        }),
        [insets, tabBarVisibility, scaleAnims, animateTab],
    );

    const screenList = useMemo(() => {
        return Object.entries(SCREEN_OPTIONS).map(([name, { component }]) => {
            if (name === 'Project' && !hasAccess?.access_project) {
                return null; // Don't render the Project tab if no permission
            }
            return <Tab.Screen key={name} name={name} component={component} />;
        });
    }, [hasAccess]);

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
        shadowColor: '#444',
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
    solidBackground: {
        flex: 1,
        borderRadius: 25,
        backgroundColor: '#ffffff',
    },
    blurOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.08)',
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
        backgroundColor: 'transparent',
        shadowColor: 'transparent',
        shadowOpacity: 0,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 0,
        elevation: 0,
        borderWidth: 0,
        borderColor: 'transparent',
    },
    activeIndicator: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: '#ffffff',
        opacity: 0.6,
    },
    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#0E509E',
        marginTop: 4,
        shadowColor: '#0E509E',
        shadowOpacity: 0.3,
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
        shadowColor: focused ? '#0E509E' : '#0E509E',
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
