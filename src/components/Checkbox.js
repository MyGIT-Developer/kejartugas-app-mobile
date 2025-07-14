import React from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    Platform,
    AccessibilityRole,
    AccessibilityState,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const CheckBox = ({
    isChecked = false,
    onPress = () => { },
    title = '',
    subtitle = '',
    iconSize = 22,
    iconColor = '#4A90E2',
    uncheckedColor = '#9CA3AF',
}) => {
    const iconName = isChecked ? 'checkbox-marked' : 'checkbox-blank-outline';

    const handlePress = () => {
        if (Platform.OS === 'ios') {
            Haptics.selectionAsync();
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
    };

    return (
        <Pressable
            onPress={handlePress}
            android_ripple={{ color: '#E3F2FD', radius: 28 }}
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed,
            ]}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isChecked }}
        >
            <View style={[styles.iconWrapper, isChecked && styles.checkedContainer]}>
                <MaterialCommunityIcons
                    name={iconName}
                    size={iconSize}
                    color={isChecked ? iconColor : uncheckedColor}
                />
            </View>
            <View style={styles.textWrapper}>
                <Text style={[styles.title, isChecked && styles.checkedTitle]}>
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={styles.subtitle}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
        </Pressable>
    );
};

export default CheckBox;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderRadius: 8,
        minHeight: 36,
    },
    pressed: {
        opacity: 0.75,
    },
    iconWrapper: {
        marginRight: 12,
        padding: 2,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkedContainer: {
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
    },
    textWrapper: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
        lineHeight: 20,
    },
    checkedTitle: {
        color: '#1F2937',
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
        lineHeight: 16,
    },
});
