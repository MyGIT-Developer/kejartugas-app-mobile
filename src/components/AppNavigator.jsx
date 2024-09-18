import React, { useRef, useCallback, useMemo } from 'react';
import { View, Animated, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Home from '../screens/Home';
import Kehadiran from '../screens/Kehadiran';
import Profile from '../screens/Profile';
import Project from '../screens/Project';
import Tugas from '../screens/Tugas';
import { HomeIcon, KehadiranIcon, ProfileIcon, ProjectIcon, TugasIcon } from '../../assets/icon/icons';

const Tab = createBottomTabNavigator();

const SCREEN_OPTIONS = {
    Home: { component: Home, icon: HomeIcon },
    Tugas: { component: Tugas, icon: TugasIcon },
    Kehadiran: { component: Kehadiran, icon: KehadiranIcon },
    Project: { component: Project, icon: ProjectIcon },
    Profile: { component: Profile, icon: ProfileIcon },
};

const AppNavigator = () => {
    const insets = useSafeAreaInsets();
    const tabBarVisibility = useRef(new Animated.Value(1)).current;

    const screenOptions = useCallback(
        ({ route }) => ({
            tabBarShowLabel: false,
            headerShown: false,
            tabBarStyle: {
                ...styles.tabBar,
                bottom: 10 + insets.bottom,
                height: Platform.OS === 'ios' ? 90 : 70,
                transform: [
                    {
                        translateY: tabBarVisibility.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0],
                        }),
                    },
                ],
            },
            tabBarIcon: ({ focused }) => {
                const Icon = SCREEN_OPTIONS[route.name].icon;
                return (
                    <View
                        style={[
                            styles.iconContainer,
                            focused && styles.activeIconContainer,
                            route.name === 'Kehadiran' && styles.kehadiranIconContainer(focused),
                        ]}
                    >
                        <Icon focused={focused} />
                    </View>
                );
            },
        }),
        [insets, tabBarVisibility],
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
        bottom: 20,
        right: 10,
        left: 10,
        elevation: 4,
        backgroundColor: '#fff',
        borderRadius: 100,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        overflow: 'visible',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
    },
    activeIconContainer: {
        marginBottom: Platform.OS === 'ios' ? 10 : 20,
    },
    kehadiranIconContainer: (focused) => ({
        top: Platform.OS === 'ios' ? -10 : -20,
        width: Platform.OS === 'ios' ? 60 : 70,
        height: Platform.OS === 'ios' ? 60 : 70,
        backgroundColor: focused ? '#16247d' : '#2c3da5',
        borderRadius: Platform.OS === 'ios' ? 25 : 30,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    }),
});

export default AppNavigator;
