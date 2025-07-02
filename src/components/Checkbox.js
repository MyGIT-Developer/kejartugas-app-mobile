import { Pressable, StyleSheet, Text, View, Platform, Haptics } from 'react-native';
import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const CheckBox = (props) => {
    const iconName = props.isChecked ? 'checkbox-marked' : 'checkbox-blank-outline';

    const handlePress = () => {
        // Add haptic feedback for better UX
        if (Platform.OS === 'ios') {
            Haptics.selectionAsync();
        }
        props.onPress();
    };

    return (
        <Pressable style={styles.container} onPress={handlePress} android_ripple={{ color: '#E3F2FD', radius: 28 }}>
            <View style={[styles.checkboxContainer, props.isChecked && styles.checkedContainer]}>
                <MaterialCommunityIcons name={iconName} size={22} color={props.isChecked ? '#4A90E2' : '#9CA3AF'} />
            </View>
            <Text style={[styles.title, props.isChecked && styles.checkedTitle]}>{props.title}</Text>
        </Pressable>
    );
};

export default CheckBox;

const styles = StyleSheet.create({
    container: {
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 8,
    },
    checkboxContainer: {
        marginRight: 12,
        borderRadius: 4,
        padding: 2,
    },
    checkedContainer: {
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
    },
    title: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        flex: 1,
        lineHeight: 20,
    },
    checkedTitle: {
        color: '#1F2937',
        fontWeight: '600',
    },
});
