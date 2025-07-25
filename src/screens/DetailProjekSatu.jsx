import React, { useState } from 'react';
import { View, Text, Dimensions, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/fonts';
import Popover from 'react-native-popover-view';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

// Utility function for date formatting
const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options);
};

// Reusable component for info rows
const InfoRow = ({ label, value, icon }) => (
    <View style={styles.infoRow}>
        <View style={styles.infoColumn}>
            <View style={styles.infoItem}>
                <Ionicons name={icon} size={16} color="#666" />
                <Text style={styles.fieldText}>{label ? label : '-'}</Text>
            </View>
            <Text style={styles.fieldValueText}>{value ? value : '-'}</Text>
        </View>
    </View>
);

// Reusable component for count boxes
const CountContainer = ({ label, value, borderColor }) => (
    <View style={[styles.countContainer, { borderColor }]}>
        <Text style={styles.countValue}>{value}</Text>
        <Text style={styles.countLabel}>{label}</Text>
    </View>
);

const DetailProjekSatu = ({ data }) => {
    const [visible, setVisible] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const percentageProject = Math.round(data.percentage).toFixed(0);

    const togglePopover = () => setVisible(!visible);
    const toggleExpand = () => setIsExpanded(!isExpanded);


    const getStatusText = (projectStatus) => {
        switch (projectStatus) {
            case 'workingOnit':
                return 'Working On It';
            case 'Completed':
                return 'Completed';
            case 'onPending':
                return 'Open';
            default:
                return '#dedede';
        }
    };

    const getBackgroundColor = (projectStatus) => {
        switch (projectStatus) {
            case 'workingOnit':
                return '#d4d4d4';
            case 'Completed':
                return '#9bebb0';
            case 'onPending':
                return '#f7eb9e';
            default:
                return '#dedede';
        }
    };

    const getIndicatorDotColor = (projectStatus) => {
        switch (projectStatus) {
            case 'workingOnit':
                return '#636363';
            case 'Completed':
                return '#399e53';
            case 'onPending':
                return '#f7af1e';
            default:
                return '#aaaaaa';
        }
    };
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.upperContainer}>
                <View style={styles.projectHeaderContainer}>
                    <Text style={{
                        fontFamily: FONTS.family.semiBold,
                        fontSize: FONTS.size.md,
                        color: '#919191ff',
                        letterSpacing: -0.5,
                    }}>
                        Nama Proyek
                    </Text>

                    <Popover
                        isVisible={visible}
                        onRequestClose={togglePopover}
                        from={
                            <Pressable onPress={togglePopover} style={styles.iconButton}>
                                <Feather name="more-horizontal" size={24} color="black" />
                            </Pressable>
                        }
                        placement="bottom"
                    >
                        <View style={styles.menuContainer}>
                            <Pressable
                                onPress={() => handleGoToUpdate()}
                                style={styles.menuItem}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#277594' }]}>
                                    <Feather name="edit" size={20} color="white" />
                                </View>

                                <Text style={[styles.optionText, { color: 'black' }]}>Edit Proyek</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    togglePopover();
                                }}
                                style={styles.menuItem}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#27CF56' }]}>
                                    <Feather name="check-circle" size={20} color="white" />
                                </View>

                                <Text style={[styles.optionText, { color: 'black' }]}>Selesai</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    togglePopover();
                                }}
                                style={styles.menuItem}
                            >
                                <View style={[styles.optionIcon, { backgroundColor: '#4078BB' }]}>
                                    <Feather name="share-2" size={20} color="white" />
                                </View>

                                <Text style={[styles.optionText, { color: 'black' }]}>Bagikan</Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.menuItem,
                                    isPressed && styles.pressedItem, // Apply a different style when pressed
                                ]}
                                onPressIn={() => setIsPressed(true)}
                                onPressOut={() => setIsPressed(false)}
                                onPress={() => deleteProjectHandler()}
                            >
                                <View
                                    style={[
                                        styles.optionIcon,
                                        { backgroundColor: isPressed ? '#C43B54' : '#DF4E6E' },
                                    ]}
                                >
                                    <Feather name="trash-2" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.optionText, { color: isPressed ? 'gray' : 'black' }]}>
                                    Hapus
                                </Text>
                            </Pressable>
                        </View>
                    </Popover>
                </View>
                <View style={styles.projectInfoContainer}>
                    <View style={styles.projectTextContainer}>
                        <TouchableOpacity onPress={toggleExpand}>
                            <Text
                                style={styles.projectName}
                                numberOfLines={isExpanded ? undefined : 2}
                                ellipsizeMode="tail"
                            >
                                {data.project_name}
                            </Text>
                        </TouchableOpacity>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: getBackgroundColor(data.project_status) },
                            ]}
                        >
                            <MaterialIcons name={"schedule"} size={16} color={getIndicatorDotColor(data.project_status)} />
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: getIndicatorDotColor(data.project_status) },
                                ]}
                            >
                                {getStatusText(data.project_status)}
                            </Text>
                        </View>
                    </View>
                    <Progress.Circle
                        size={75}
                        progress={percentageProject}
                        thickness={6}
                        color={
                            percentageProject === 0
                                ? '#E0E0E0'
                                : percentageProject < 50
                                    ? '#F69292'
                                    : percentageProject < 75
                                        ? '#F0E08A'
                                        : '#C9F8C1'
                        }
                        unfilledColor="#E8F5E9"
                        borderWidth={0}
                        showsText={true}
                        formatText={() => `${percentageProject}%`}
                        textStyle={{
                            fontFamily: 'Poppins-SemiBold',
                            fontSize: 14,
                            color:
                                percentageProject === 0
                                    ? '#000000'
                                    : percentageProject < 50
                                        ? '#811616'
                                        : percentageProject < 75
                                            ? '#656218'
                                            : '#0A642E', // Text color based on progress
                        }}
                    />
                </View>
            </View>

            <View style={styles.midContainer}>
                <CountContainer
                    label="Dalam Proses"
                    value={data.total_tasks_working_on_it ? data.total_tasks_working_on_it : '0'}
                    borderColor="#DD9968"
                />
                <View style={styles.separator} />
                <CountContainer
                    label="Tugas Selesai"
                    value={data.total_task_completed ? data.total_task_completed : '0'}
                    borderColor="#3AD665"
                />
                <View style={styles.separator} />
                <CountContainer
                    label="Total Tugas"
                    value={data.total_task_created ? data.total_task_created : '0'}
                    borderColor="#DD6868"
                />
            </View>

            <View style={styles.infoContainer}>
                <View style={{ display: 'flex', flexDirection: 'row' }}>
                    <View style={styles.column}>
                        <InfoRow label="Tipe Projek" value={data.project_type} icon={"briefcase-outline"} />
                    </View>
                    <View style={styles.column}>
                        <InfoRow label="Divisi" value={data.team_name} icon={"build-outline"} />
                    </View>
                </View>
                <View style={styles.column}>
                    <InfoRow label="Ditugaskan Oleh" value={data.assign_by_name} icon={"person-circle-outline"} />
                </View>
                <InfoRow
                    label="Ditugaskan Kepada"
                    value={data.assignedEmployees.map((employee) => employee.employee_name).join(', ')}
                    icon={"people-outline"}
                />
                <InfoRow label="Keterangan" value={data.project_desc ?? '-'} icon={"document-text-outline"} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexGrow: 1,
        paddingHorizontal: 20,
        flexDirection: 'column',
        height: height + 100,
        width: SCREEN_WIDTH,
    },
    upperContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
        marginBottom: 20,
    },
    projectHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    projectTextContainer: {
        flexDirection: 'column',
        gap: 5,
        maxWidth: '60%',
    },
    projectInfoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    projectName: {
        fontFamily: FONTS.family.bold,
        fontSize: FONTS.size['xl'],
        color: '#111827',
        marginBottom: 12,
        letterSpacing: -0.5,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 24,
        gap: 6,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusText: {
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size.sm,
        letterSpacing: -0.5,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuContainer: {
        width: '100%',
        padding: 10,
        gap: 10,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    menuText: {
        marginLeft: 10,
        fontSize: 16,
    },
    iconButton: {
        padding: 10,
    },
    optionIcon: {
        padding: 5,
        borderRadius: 5,
    },
    optionText: {
        fontWeight: 'bold',
    },
    lowerContainer: {
        flexGrow: 1,
        width: '100%',
        paddingHorizontal: 20,
    },
    infoContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 20,
        gap: 4,
        borderRadius: 20,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
    },
    column: {
        flex: 1,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoColumn: {
        flex: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    midContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 10,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    countContainer: {
        flex: 1,
        alignItems: 'center',
    },
    countLabel: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: '#666',
        textAlign: 'center',
    },
    countValue: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: '#0E509E',
        marginBottom: 4,
    },
    separator: {
        width: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 8,
    },
    fieldText: {
        fontFamily: FONTS.family.medium,
        color: '#6B7280',
        fontSize: FONTS.size.md,
        // textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    fieldValueText: {
        fontFamily: FONTS.family.medium,
        color: '#111827',
        fontSize: FONTS.size.md,
        lineHeight: 22,
        letterSpacing: -0.5,
    },
});

export default DetailProjekSatu;
