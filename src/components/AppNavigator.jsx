// src/components/AppNavigator.js

import React from 'react';
import { View, Platform } from 'react-native';
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
        bottom: 0,
        right: 0,
        left: 0,
        elevation: 0,
        height: Platform.OS === 'ios' ? 80 : 60, // Adjust height for iOS
        backgroundColor: '#fff',
    },
};

const AppNavigator = () => (
    <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
            name="Home"
            component={Home}
            options={{
                tabBarIcon: ({ focused }) => (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <HomeIcon focused={focused} />
                    </View>
                ),
            }}
        />
        <Tab.Screen
            name="Project"
            component={Project}
            options={{
                tabBarIcon: ({ focused }) => (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <ProjectIcon focused={focused} />
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
                            backgroundColor: focused ? '#fff' : '#16247d',
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
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <TugasIcon focused={focused} />
                    </View>
                ),
            }}
        />
        <Tab.Screen
            name="Profile"
            component={Profile}
            options={{
                tabBarIcon: ({ focused }) => (
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <ProfileIcon focused={focused} />
                    </View>
                ),
            }}
        />
    </Tab.Navigator>
);

export default AppNavigator;
