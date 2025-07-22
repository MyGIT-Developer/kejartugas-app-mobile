import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375;
    const newSize = size * scale;
    return Math.round(newSize);
};

export const styles = StyleSheet.create({
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
    content: {
        flex: 1,
        position: 'relative',
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
    floatingActionButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#4A90E2',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
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
        backgroundColor: '#E1F5FE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 15,
    },
    statusText: {
        color: '#03A9F4',
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
    myTaskDetailContent: {
        padding: 16,
    },
    detailSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: calculateFontSize(16),
        color: '#333',
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Regular',
    },
    detailValue: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Medium',
    },
    descriptionText: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Regular',
        lineHeight: 20,
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: calculateFontSize(16),
        fontFamily: 'Poppins-Medium',
    },
    approvalItem: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#444',
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
    approvalContent: {
        padding: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    infoItem: {
        flex: 1,
    },
    infoLabel: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
    },
    descriptionContainer: {
        marginBottom: 15,
    },
    descriptionLabel: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginBottom: 4,
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
        gap: 10,
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
    myTaskDetailContent: {
        padding: 20,
    },
    taskHeaderSection: {
        marginBottom: 24,
    },
    taskTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    taskMainTitle: {
        fontSize: calculateFontSize(18),
        color: '#1f1f1f',
        fontFamily: 'Poppins-SemiBold',
        flex: 1,
    },
    assignerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    assignerText: {
        fontSize: calculateFontSize(14),
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    timelineSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: calculateFontSize(16),
        color: '#1f1f1f',
        fontFamily: 'Poppins-SemiBold',
        marginBottom: 16,
    },
    timelineContainer: {
        paddingHorizontal: 16,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
    },
    timelineConnector: {
        width: 2,
        height: 24,
        backgroundColor: '#E0E0E0',
        marginLeft: 5,
    },
    timelineContent: {
        marginLeft: 16,
        flex: 1,
    },
    timelineLabel: {
        fontSize: calculateFontSize(14),
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    timelineDate: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Medium',
    },
    descriptionSection: {
        marginBottom: 24,
    },
    descriptionCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    bulletPoints: {
        marginTop: 12,
    },
    bulletPoint: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4A90E2',
        marginRight: 12,
    },
    bulletText: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Regular',
    },
    attachmentsSection: {
        marginBottom: 24,
    },
    attachmentCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 12,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    attachmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    attachmentInfo: {
        flex: 1,
    },
    attachmentName: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
    },
    attachmentSize: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    downloadButton: {
        padding: 8,
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: calculateFontSize(16),
        fontFamily: 'Poppins-Medium',
    },
});

export default styles;
