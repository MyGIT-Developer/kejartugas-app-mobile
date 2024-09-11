// icons.jsx
import React from 'react';
import { View, Text } from 'react-native';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Define icons with text labels based on screen names
export const HomeIcon = ({ focused }) => (
    <View style={{ alignItems: 'center' }}>
        <AntDesign name="home" size={24} color={focused ? '#16247d' : '#111'} />
        <Text style={{ fontSize: 12, color: focused ? '#16247d' : '#111' }}>Home</Text>
    </View>
);

export const KehadiranIcon = ({ focused }) => (
    <View style={{ alignItems: 'center' }}>
        <MaterialCommunityIcons
            name="calendar-check" // Choose an appropriate icon name for attendance
            size={24}
            color={focused ? '#fff' : '#fff'}
        />
    </View>
);

export const ProfileIcon = ({ focused }) => (
    <View style={{ alignItems: 'center' }}>
        <Feather name="user" size={24} color={focused ? '#16247d' : '#111'} />
        <Text style={{ fontSize: 12, color: focused ? '#16247d' : '#111' }}>Profile</Text>
    </View>
);

export const ProjectIcon = ({ focused }) => (
    <View style={{ alignItems: 'center' }}>
        <AntDesign name="folderopen" size={24} color={focused ? '#16247d' : '#111'} />
        <Text style={{ fontSize: 12, color: focused ? '#16247d' : '#111' }}>Project</Text>
    </View>
);

export const TugasIcon = ({ focused }) => (
    <View style={{ alignItems: 'center' }}>
        <Feather name="clipboard" size={24} color={focused ? '#16247d' : '#111'} />
        <Text style={{ fontSize: 12, color: focused ? '#16247d' : '#111' }}>Tugas</Text>
    </View>
);
