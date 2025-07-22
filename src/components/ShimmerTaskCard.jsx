import React from 'react';
import { View, StyleSheet } from 'react-native';
import Shimmer from './Shimmer';

const ShimmerTaskCard = () => (
    <View style={styles.taskCard}>
        <View style={styles.taskContent}>
            <Shimmer width={200} height={20} style={styles.shimmerTitle} />
            <Shimmer width={175} height={20} style={styles.shimmerTitle} />
        </View>
        <Shimmer width={150} height={20} style={[styles.shimmerTitle, { marginBottom: 45 }]} />

        <View style={styles.buttonContainer}>
            <Shimmer width={120} height={25} style={styles.shimmerButton} />
            <Shimmer width={100} height={30} style={styles.shimmerButton} />
        </View>
    </View>
);

const styles = StyleSheet.create({
    taskCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginRight: 16,
        marginBottom: 10,
        width: 300,
        height: 180,
        elevation: 3,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.06)',
    },
    taskContent: {
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        bottom: 15,
        left: 15,
        right: 15,
    },
    shimmerTitle: {
        marginBottom: 10,
    },
    shimmerButton: {
        // No additional styles needed
    },
});

export default ShimmerTaskCard;
