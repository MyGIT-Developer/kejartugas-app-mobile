import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Shimmer from './Shimmer';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

const StatisticSkeleton = () => (
    <View style={[styles.statisticCard, { borderColor: '#e0e0e0' }]}>
        <View style={[styles.textContainer, { gap: 5, display: 'flex', flexDirection: 'column', marginRight: 10 }]}>
            <Shimmer width={60} height={25} style={styles.shimmerTitle} />
            <Shimmer width={50} height={20} style={styles.shimmerTitle} />
        </View>
        <Shimmer width={50} height={55} style={styles.shimmerTitle} />
    </View>
);

const StatisticCard = ({ value, description, color, icon, onPress }) => (
    <TouchableOpacity onPress={onPress}>
        <View style={[styles.statisticCard, { borderColor: color }]}>
            <View style={styles.textContainer}>
                <Text style={styles.valueText}>{value}</Text>
                <Text style={styles.descriptionText}>{description}</Text>
            </View>
            <Feather name={icon} size={30} color={color} style={styles.icon} />
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    statisticCard: {
        width: cardWidth,
        height: 80,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    valueText: {
        fontSize: 24,
        color: 'black',
        fontFamily: 'Poppins-Bold',
        letterSpacing: -0.5,
        lineHeight: 30,
    },
    descriptionText: {
        fontSize: 11,
        color: 'black',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
        lineHeight: 13,
    },
    icon: {
        marginLeft: 8,
    },
    shimmerTitle: {
        borderRadius: 4,
    },
});

export { StatisticCard, StatisticSkeleton };
