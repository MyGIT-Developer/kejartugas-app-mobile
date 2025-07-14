import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Shimmer from './Shimmer';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40) / 2;

const StatisticSkeleton = () => (
    <View style={[styles.statisticCard, { borderColor: '#e0e0e0', gap: 2 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", gap: 8 }}>
            <Shimmer width={75} height={25} style={styles.shimmerTitle} />
             <Shimmer width={25} height={25} style={styles.shimmerTitle} />
        </View>
        <Shimmer width={50} height={20} style={styles.shimmerTitle} />
    </View>
);

const StatisticCard = ({ value, description, color, icon, onPress }) => (
    <TouchableOpacity onPress={onPress}>
        <View style={[styles.statisticCard]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "space-between", gap: 8 }}>
                <Text style={styles.valueText}>{value}</Text>
                <Feather name={icon} size={20} color={color} />
            </View>
            <Text style={styles.descriptionText}>{description}</Text>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    statisticCard: {
        width: cardWidth,
        backgroundColor: 'white',
        borderRadius: 10,
        paddingHorizontal: 12,
        padding: 8,
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'start',
        // borderWidth: 1,
        // borderOpacity: 0.1,
        // borderColor: '#0E509E',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10
    },
    valueText: {
        fontSize: 18,
        color: '#0E509E',
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: -0.5,
    },
    descriptionText: {
        fontSize: 12,
        color: 'black',
        fontFamily: 'Poppins-Regular',
        letterSpacing: -0.3,
    },
    shimmerTitle: {
        borderRadius: 4,
    },
});

export { StatisticCard, StatisticSkeleton };
