import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Shimmer from './Shimmer';

const NotificationIconSkeleton = () => (
    <View style={styles.notificationButton}>
        <Shimmer width={40} height={40} style={styles.shimmerTitle} />
    </View>
);

const NotificationIcon = ({ unreadCount, onPress }) => (
    <TouchableOpacity style={styles.notificationButton} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.iconContainer}>
            <Feather name="bell" size={24} color="white" />
            {unreadCount > 0 && (
                <View style={styles.badgeContainer}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
            )}
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    notificationButton: {
        padding: 8,
        marginLeft: 8,
    },
    iconContainer: {
        position: 'relative',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    badgeContainer: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 2,
        backgroundColor: '#fc5953',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
    },
    shimmerTitle: {
        borderRadius: 40,
    },
});

export { NotificationIcon, NotificationIconSkeleton };
