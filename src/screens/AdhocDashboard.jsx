import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from '../utils/UseFonts';
import ReusableModalBottom from '../components/ReusableModalBottom';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Fungsi untuk menghitung ukuran font responsif
const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375; // 375 adalah lebar base untuk iPhone X
    const newSize = size * scale;
    return Math.round(newSize);
};

const AdhocDashboard = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Tugas Dibuat');
    const [selectedTask, setSelectedTask] = useState(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [expandedSection, setExpandedSection] = useState(null);
    const tabs = ['Tugas Dibuat', 'Tugas Saya', 'Persetujuan', 'Riwayat'];
    const fontsLoaded = useFonts();

    useEffect(() => {
        if (fontsLoaded) {
            // Fonts are loaded, you can perform any additional actions here if needed
        }
    }, [fontsLoaded]);

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab ? styles.activeTab : styles.inactiveTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === tab ? styles.activeTabText : styles.inactiveTabText,
                            fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null,
                            { fontSize: calculateFontSize(12) }, // Responsive font size
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {tab}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderTaskItem = (index) => {
        const isSelected = selectedTask === index;

        return (
            <View style={[styles.taskItem, isSelected && styles.selectedTaskItem]} key={index}>
                <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                        KejarTugas Maintenance
                    </Text>
                    <View style={styles.taskActions}>
                        <TouchableOpacity
                            style={styles.moreButton}
                            onPress={() => setSelectedTask(isSelected ? null : index)}
                        >
                            <Feather name="more-horizontal" size={24} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.detailButton} onPress={() => setIsDetailModalVisible(true)}>
                            <Text
                                style={[
                                    styles.detailButtonText,
                                    fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null,
                                ]}
                            >
                                Detail
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {isSelected && (
                    <View style={styles.dropdownMenu}>
                        <TouchableOpacity style={styles.dropdownItem}>
                            <Feather name="edit-2" size={20} color="#4A90E2" />
                            <Text style={[styles.dropdownText, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>
                                Ubah Tugas
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdownItem}>
                            <Feather name="trash-2" size={20} color="red" />
                            <Text
                                style={[
                                    styles.dropdownText,
                                    { color: 'red' },
                                    fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null,
                                ]}
                            >
                                Hapus
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderDetailModalContent = () => (
        <View style={styles.myTaskDetailContent}>
            {/* Task Header Section */}
            <View style={styles.taskHeaderSection}>
                <View style={styles.taskTitleWrapper}>
                    <Text style={styles.taskMainTitle}>KejarTugas Maintenance</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={[styles.statusText, { color: '#4CAF50' }]}>Selesai</Text>
                    </View>
                </View>
                <View style={styles.assignerInfo}>
                    <Feather name="user" size={16} color="#666" />
                    <Text style={styles.assignerText}>Ditugaskan oleh John Doe</Text>
                </View>
            </View>

            {/* Timeline Section */}
            <View style={styles.timelineSection}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                <View style={styles.timelineContainer}>
                    <View style={styles.timelineItem}>
                        <View style={styles.timelineDot} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineLabel}>Mulai</Text>
                            <Text style={styles.timelineDate}>03 Sep 2024</Text>
                        </View>
                    </View>
                    <View style={styles.timelineConnector} />
                    <View style={styles.timelineItem}>
                        <View style={[styles.timelineDot, { backgroundColor: '#FF5252' }]} />
                        <View style={styles.timelineContent}>
                            <Text style={styles.timelineLabel}>Tenggat</Text>
                            <Text style={styles.timelineDate}>07 Sep 2024</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Description Section */}
            <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Deskripsi Tugas</Text>
                <View style={styles.descriptionCard}>
                    <Text style={styles.descriptionText}>
                        Melakukan maintenance rutin pada sistem KejarTugas termasuk:
                    </Text>
                    <View style={styles.bulletPoints}>
                        <View style={styles.bulletPoint}>
                            <View style={styles.bullet} />
                            <Text style={styles.bulletText}>Pembaruan database sistem</Text>
                        </View>
                        <View style={styles.bulletPoint}>
                            <View style={styles.bullet} />
                            <Text style={styles.bulletText}>Optimisasi performa aplikasi</Text>
                        </View>
                        <View style={styles.bulletPoint}>
                            <View style={styles.bullet} />
                            <Text style={styles.bulletText}>Pemeriksaan keamanan sistem</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Attachments Section */}
            <View style={styles.attachmentsSection}>
                <Text style={styles.sectionTitle}>Lampiran</Text>
                <View style={styles.attachmentCard}>
                    <View style={styles.attachmentItem}>
                        <View style={styles.attachmentIcon}>
                            <Feather name="file-text" size={20} color="#4A90E2" />
                        </View>
                        <View style={styles.attachmentInfo}>
                            <Text style={styles.attachmentName}>Documentation.pdf</Text>
                            <Text style={styles.attachmentSize}>2.5 MB</Text>
                        </View>
                        <TouchableOpacity style={styles.downloadButton}>
                            <Feather name="download" size={20} color="#4A90E2" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Submit Tugas</Text>
            </TouchableOpacity>
        </View>
    );

    const renderMyTaskItem = (index) => {
        return (
            <TouchableOpacity style={styles.myTaskItem} key={index} onPress={() => setIsDetailModalVisible(true)}>
                <View style={styles.myTaskHeader}>
                    <Text style={[styles.myTaskTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                        KejarTugas Maintenance
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                        <Text style={[styles.statusText, { color: '#4CAF50' }]}>Selesai</Text>
                    </View>
                </View>

                <View style={styles.myTaskInfo}>
                    <View style={styles.infoItem}>
                        <Feather name="calendar" size={16} color="#666" />
                        <Text style={styles.infoText}>Deadline: 7 Sep 2024</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Feather name="user" size={16} color="#666" />
                        <Text style={styles.infoText}>Dari: John Doe</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderApprovalItem = (item) => {
        return (
            <View style={styles.approvalItem}>
                {/* Header */}
                <View style={styles.approvalHeader}>
                    <View style={styles.approvalTitleContainer}>
                        <Text style={styles.approvalTitle}>{item.title}</Text>
                        <View style={styles.statusContainer}>
                            <Text style={styles.statusText}>Menunggu Persetujuan</Text>
                        </View>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.approvalContent}>
                    {/* Assignment and Deadline Row */}
                    <View style={styles.infoRow}>
                        <View style={styles.infoItemHalf}>
                            <Text style={styles.infoLabel}>Ditugaskan kepada</Text>
                            <View style={styles.infoValueContainer}>
                                <MaterialIcons name="person" size={20} color="#666" style={styles.infoIcon} />
                                <Text style={styles.infoValue} numberOfLines={1}>
                                    {item.assignedTo}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.infoItemHalf}>
                            <Text style={styles.infoLabel}>Tenggat waktu</Text>
                            <View style={styles.infoValueContainer}>
                                <MaterialIcons name="calendar-today" size={20} color="#666" style={styles.infoIcon} />
                                <Text style={styles.infoValue}>{item.deadline}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <View style={styles.descriptionContainer}>
                        <Text style={styles.descriptionLabel}>Deskripsi tugas:</Text>
                        <Text style={styles.approvalDescription}>{item.description}</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Action Buttons */}
                    <View style={styles.approvalActions}>
                        <TouchableOpacity style={styles.rejectButton}>
                            <MaterialIcons name="close" size={20} color="#FFF" />
                            <Text style={styles.rejectButtonText}>Tolak</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.approveButton}>
                            <MaterialIcons name="check" size={20} color="#FFF" />
                            <Text style={styles.approveButtonText}>Setujui</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const approvalItems = [
        {
            title: 'Oracle DBA',
            description: 'Melanjutkan penyusunan FSD dan menyelesaikan Review',
            assignedTo: 'Jefri Doe',
            deadline: '07/10/2024',
        },
        {
            title: 'Kejar Tugas AI',
            description: 'Testing dan Documentation',
            assignedTo: 'Jefri Doe',
            deadline: '07/10/2024',
        },
        {
            title: 'Splunk',
            description: 'Upgrade Splunk v 2.0',
            assignedTo: 'Jefri Doe',
            deadline: '07/10/2024',
        },
    ];

    const renderHistoryItem = (section) => {
        const isExpanded = expandedSection === section.title;

        return (
            <View style={styles.historySection} key={section.title}>
                <View style={styles.historySectionHeader}>
                    <View style={styles.historySectionTitleContainer}>
                        <Text style={styles.historySectionTitle}>{section.title}</Text>
                        <View style={styles.historySectionBadge}>
                            <Text style={styles.historySectionBadgeText}>5</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => setExpandedSection(isExpanded ? null : section.title)}
                    >
                        <Text style={styles.expandButtonText}>{isExpanded ? 'Tutup' : 'Lihat semua'}</Text>
                        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#4A90E2" />
                    </TouchableOpacity>
                </View>

                {isExpanded ? (
                    <DetailList items={section.detailItems} />
                ) : (
                    <View style={styles.historyPreviewContainer}>
                        {section.items.map((item, index) => (
                            <TouchableOpacity key={index} style={styles.historyPreviewItem} activeOpacity={0.7}>
                                <View style={styles.historyPreviewContent}>
                                    <View style={styles.historyIconContainer}>
                                        <Feather name="file-text" size={24} color="#4A90E2" />
                                    </View>
                                    <View style={styles.historyPreviewInfo}>
                                        <Text style={styles.historyPreviewTitle}>{item.documentation}</Text>
                                        <Text style={styles.historyPreviewDate}>Last updated: Today, 14:30</Text>
                                    </View>
                                    <Feather name="chevron-right" size={20} color="#C5C5C5" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                <View style={styles.historySeparator} />
            </View>
        );
    };

    const historyItems = [
        {
            title: 'Tugas Dibuat',
            items: [{ documentation: '& documentation', report: 'Laporan' }],
            detailItems: [
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
            ],
        },
        {
            title: 'Tugas Saya',
            items: [{ documentation: '& documentation', report: 'Laporan' }],
            detailItems: [
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
            ],
        },
        {
            title: 'Tugas Persetujuan',
            items: [{ documentation: '& documentation', report: 'Laporan' }],
            detailItems: [
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
                { title: 'Testing & documentation' },
            ],
        },
    ];

    const DetailList = ({ items }) => (
        <View style={styles.detailList}>
            {items.map((item, index) => (
                <TouchableOpacity key={index} style={styles.detailItem} activeOpacity={0.7}>
                    <View style={styles.detailItemContent}>
                        <View style={styles.detailItemIcon}>
                            <Feather name="file-text" size={20} color="#4A90E2" />
                        </View>
                        <View style={styles.detailItemInfo}>
                            <Text style={styles.detailItemTitle}>{item.title}</Text>
                            <Text style={styles.detailItemDate}>Created: Sep 15, 2024</Text>
                        </View>
                        <View style={styles.detailItemStatus}>
                            <View style={styles.detailItemStatusBadge}>
                                <Text style={styles.detailItemStatusText}>Completed</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#C5C5C5" />
                        </View>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
            <LinearGradient colors={['#4A90E2', '#4A90E2']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="chevron-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null]}>
                        Tugas Ad Hoc
                    </Text>
                    <View style={styles.placeholder} />
                </View>
                {renderTabs()}
            </LinearGradient>
            <View style={styles.content}>
                <ScrollView style={styles.taskList} contentContainerStyle={styles.taskListContent}>
                    {activeTab === 'Tugas Dibuat' && [...Array(6)].map((_, index) => renderTaskItem(index))}
                    {activeTab === 'Tugas Saya' && [...Array(6)].map((_, index) => renderMyTaskItem(index))}
                    {activeTab === 'Persetujuan' && approvalItems.map((item, index) => renderApprovalItem(item, index))}
                    {activeTab === 'Riwayat' && historyItems.map((section) => renderHistoryItem(section))}
                </ScrollView>
                {activeTab === 'Tugas Dibuat' && (
                    <TouchableOpacity style={styles.addButton}>
                        <Feather name="plus" size={24} color="#4A90E2" />
                    </TouchableOpacity>
                )}
            </View>
            <ReusableModalBottom
                visible={isDetailModalVisible}
                onClose={() => setIsDetailModalVisible(false)}
                title="Detail Tugas"
            >
                {renderDetailModalContent()}
            </ReusableModalBottom>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F0F0',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 24,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        padding: 3,
        marginTop: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 25,
    },
    activeTab: {
        backgroundColor: '#FFF',
    },
    inactiveTab: {
        backgroundColor: 'transparent',
    },
    tabText: {
        textAlign: 'center',
    },
    activeTabText: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    inactiveTabText: {
        color: '#FFF',
        fontWeight: 'normal',
    },
    taskList: {
        flex: 1,
    },
    taskListContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 80,
    },
    taskItem: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    selectedTaskItem: {
        marginBottom: 20,
    },
    taskContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    taskActions: {
        alignItems: 'flex-end',
    },
    moreButton: {
        padding: 5,
        marginBottom: 5,
    },
    detailButton: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    detailButtonText: {
        color: '#000',
        fontSize: 12,
    },
    dropdownMenu: {
        backgroundColor: '#F8F8F8',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    dropdownItem: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dropdownText: {
        marginTop: 5,
        fontSize: 12,
        textAlign: 'center',
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#FFFFFFFF',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    content: {
        flex: 1,
        position: 'relative',
    },
    detailContent: {
        paddingHorizontal: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    detailTitle: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Bold',
    },
    detailLabel: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Bold',
    },
    detailValue: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Medium',
        textAlign: 'left',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 10,
    },
    statusText: {
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
    keteranganContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    myTaskItem: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        elevation: 2,
    },
    myTaskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    myTaskTitle: {
        fontSize: calculateFontSize(16),
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    myTaskInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    approvalItem: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    approvalHeader: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    approvalTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    approvalTitle: {
        fontSize: calculateFontSize(16),
        color: '#333',
        fontFamily: 'Poppins-SemiBold',
        flex: 1,
    },
    statusContainer: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#FB8C00',
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
    approvalContent: {
        padding: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    infoItemHalf: {
        flex: 1,
    },
    infoLabel: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginBottom: 8,
    },
    infoValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
    },
    infoIcon: {
        marginRight: 8,
    },
    infoValue: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
        flex: 1,
    },
    descriptionContainer: {
        marginTop: 15,
    },
    descriptionLabel: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginBottom: 8,
    },
    approvalDescription: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Regular',
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 15,
    },
    approvalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    approveButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#F44336',
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    approveButtonText: {
        color: '#FFF',
        fontSize: calculateFontSize(14),
        fontFamily: 'Poppins-Medium',
    },
    rejectButtonText: {
        color: '#FFF',
        fontSize: calculateFontSize(14),
        fontFamily: 'Poppins-Medium',
    },
    historySection: {
        marginBottom: 20,
        backgroundColor: '#FFF',
        borderRadius: 12,
        elevation: 2,
        marginHorizontal: 2,
    },
    historySectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    historySectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historySectionTitle: {
        fontSize: calculateFontSize(16),
        color: '#333',
        fontFamily: 'Poppins-SemiBold',
    },
    historySectionBadge: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    historySectionBadgeText: {
        color: '#4A90E2',
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expandButtonText: {
        color: '#4A90E2',
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
    historyPreviewContainer: {
        padding: 12,
    },
    historyPreviewItem: {
        marginBottom: 8,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        overflow: 'hidden',
    },
    historyPreviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    historyIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyPreviewInfo: {
        flex: 1,
        marginRight: 8,
    },
    historyPreviewTitle: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    historyPreviewDate: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    historySeparator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 16,
    },
    detailList: {
        padding: 12,
    },
    detailItem: {
        marginBottom: 8,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        overflow: 'hidden',
    },
    detailItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    detailItemIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    detailItemInfo: {
        flex: 1,
    },
    detailItemTitle: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    detailItemDate: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    detailItemStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailItemStatusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    detailItemStatusText: {
        color: '#4CAF50',
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
});

export default AdhocDashboard;
