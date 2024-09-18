import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const ICON_SIZE = 26;
const LABEL_SIZE = 12;
const ACTIVE_COLOR = '#16247d';
const INACTIVE_COLOR = '#111';
const KEHADIRAN_COLOR = '#fff';

const IconWithLabel = ({ IconComponent, name, label, focused, color }) => (
    <View style={styles.iconContainer}>
        <IconComponent name={name} size={ICON_SIZE} color={focused ? color.active : color.inactive} />
        {label && <Text style={[styles.label, { color: focused ? color.active : color.inactive }]}>{label}</Text>}
    </View>
);

export const HomeIcon = ({ focused }) => (
    <IconWithLabel
        IconComponent={AntDesign}
        name="home"
        label="Home"
        focused={focused}
        color={{ active: ACTIVE_COLOR, inactive: INACTIVE_COLOR }}
    />
);

export const KehadiranIcon = ({ focused }) => (
    <IconWithLabel
        IconComponent={MaterialCommunityIcons}
        name="calendar-check"
        focused={focused}
        color={{ active: KEHADIRAN_COLOR, inactive: KEHADIRAN_COLOR }}
    />
);

export const ProfileIcon = ({ focused }) => (
    <IconWithLabel
        IconComponent={Feather}
        name="user"
        label="Profile"
        focused={focused}
        color={{ active: ACTIVE_COLOR, inactive: INACTIVE_COLOR }}
    />
);

export const ProjectIcon = ({ focused }) => (
    <IconWithLabel
        IconComponent={AntDesign}
        name="folderopen"
        label="Project"
        focused={focused}
        color={{ active: ACTIVE_COLOR, inactive: INACTIVE_COLOR }}
    />
);

export const TugasIcon = ({ focused }) => (
    <IconWithLabel
        IconComponent={Feather}
        name="clipboard"
        label="Tugas"
        focused={focused}
        color={{ active: ACTIVE_COLOR, inactive: INACTIVE_COLOR }}
    />
);

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
    },
    label: {
        fontSize: LABEL_SIZE,
    },
});
