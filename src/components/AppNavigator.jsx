import React from 'react';
import { View, Animated, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Kehadiran from '../screens/Kehadiran';
import Profile from '../screens/Profile';
import Project from '../screens/Project';
import Tugas from '../screens/Tugas';
import { HomeIcon, KehadiranIcon, ProfileIcon, ProjectIcon, TugasIcon } from '../../assets/icon/icons';

const Tab = createBottomTabNavigator();

const screenOptions = {
    tabBarShowLabel: false,
    headerShown: false,
    tabBarStyle: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        left: 10,
        elevation: 4,
        height: Platform.OS === 'ios' ? 80 : 60,
        backgroundColor: '#fff',
        margin: 10,
        borderRadius: 100,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 5 },
        shadowRadius: 10,
        overflow: 'visible',
    },
};

const AppNavigator = () => (
    <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
            name="Home"
            component={Home}
            options={{
                tabBarIcon: ({ focused }) => (
                    <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                        <HomeIcon focused={focused} style={[styles.icon, focused && styles.activeIcon]} />
                    </View>
                ),
            }}
        />
        <Tab.Screen
            name="Project"
            component={Project}
            options={{
                tabBarIcon: ({ focused }) => (
                    <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                        <ProjectIcon focused={focused} style={[styles.icon, focused && styles.activeIcon]} />
                    </View>
                ),
            }}
        />
          <Tab.Screen
            name="Kehadiran"
            component={Kehadiran}
            options={{
                tabBarIcon: ({ focused }) => (
                    <View
                        style={{
                            top: Platform.OS === 'ios' ? -10 : -20,
                            width: Platform.OS === 'ios' ? 50 : 60,
                            height: Platform.OS === 'ios' ? 50 : 60,
                            backgroundColor: focused ? '#16247d' : '#2c3da5',
                            borderRadius: Platform.OS === 'ios' ? 25 : 30,
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <KehadiranIcon focused={focused} />
                    </View>
                ),
            }}
        />
        <Tab.Screen
            name="Tugas"
            component={Tugas}
            options={{
                tabBarIcon: ({ focused }) => (
                    <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                        <TugasIcon focused={focused} style={[styles.icon, focused && styles.activeIcon]} />
                    </View>
                ),
            }}
        />
        <Tab.Screen
            name="Profile"
            component={Profile}
            options={{
                tabBarIcon: ({ focused }) => (
                    <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
                        <ProfileIcon focused={focused} style={[styles.icon, focused && styles.activeIcon]} />
                    </View>
                ),
            }}
        />
    </Tab.Navigator>
);

const styles = {
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        marginBottom: 0, // No offset when not focused
    },
    activeIconContainer: {
        marginBottom: Platform.OS === 'ios' ? 10 : 20, // Move icon up when focused
    },
    activeKehadiranIconContainer: {
        marginBottom: 0, // No offset as it is already centered when focused
    },
    icon: {
        width: 30,
        height: 30,
        transition: 'all 0.3s ease',
    },
    activeIcon: {
        width: 35, // Increase icon size when focused
        height: 35,
    },
    activeKehadiranIcon: {
        width: Platform.OS === 'ios' ? 60 : 70, // Size for the focused icon
        height: Platform.OS === 'ios' ? 60 : 70,
        backgroundColor: '#16247d', // Background color when focused
        borderRadius: Platform.OS === 'ios' ? 30 : 35,
    },
};

export default AppNavigator;
