import React, { useState, memo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Platform, Haptics } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/fonts';

const ClientDropdown = memo(
    ({
        clients = [],
        selectedClient,
        onSelectClient,
        placeholder = 'Pilih Klien',
        isVisible = false,
        onToggle,
        style,
        disabled = false,
    }) => {
        const [modalVisible, setModalVisible] = useState(false);

        const handleToggleDropdown = () => {
            if (disabled) return;

            if (Platform.OS === 'ios') {
                Haptics.selectionAsync();
            }

            if (onToggle) {
                onToggle();
            } else {
                setModalVisible(!modalVisible);
            }
        };

        const handleSelectClient = (client) => {
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }

            onSelectClient(client);
            setModalVisible(false);
            if (onToggle) {
                onToggle();
            }
        };

        const renderClientItem = ({ item }) => (
            <TouchableOpacity
                style={[styles.clientItem, selectedClient?.id === item.id && styles.selectedClientItem]}
                onPress={() => handleSelectClient(item)}
                activeOpacity={0.7}
            >
                <View style={styles.clientInfo}>
                    <Text style={[styles.clientName, selectedClient?.id === item.id && styles.selectedClientName]}>
                        {item.name}
                    </Text>
                    {item.address && (
                        <Text
                            style={[
                                styles.clientAddress,
                                selectedClient?.id === item.id && styles.selectedClientAddress,
                            ]}
                        >
                            {item.address}
                        </Text>
                    )}
                </View>
                {selectedClient?.id === item.id && <Ionicons name="checkmark-circle" size={20} color="#4A90E2" />}
            </TouchableOpacity>
        );

        const displayText = selectedClient ? selectedClient.name : placeholder;
        const showModal = onToggle ? isVisible : modalVisible;

        return (
            <View style={[styles.container, style]}>
                <TouchableOpacity
                    style={[
                        styles.dropdownButton,
                        disabled && styles.disabledButton,
                        selectedClient && styles.selectedButton,
                    ]}
                    onPress={handleToggleDropdown}
                    activeOpacity={disabled ? 1 : 0.7}
                    disabled={disabled}
                >
                    <View style={styles.buttonContent}>
                        <Ionicons
                            name="business"
                            size={16}
                            color={disabled ? '#9CA3AF' : selectedClient ? '#4A90E2' : '#6B7280'}
                        />
                        <Text
                            style={[
                                styles.buttonText,
                                disabled && styles.disabledText,
                                selectedClient && styles.selectedText,
                                !selectedClient && styles.placeholderText,
                            ]}
                        >
                            {displayText}
                        </Text>
                    </View>
                    <Ionicons name="chevron-down" size={16} color={disabled ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>

                <Modal
                    visible={showModal}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => {
                        setModalVisible(false);
                        if (onToggle) onToggle();
                    }}
                >
                    <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => {
                            setModalVisible(false);
                            if (onToggle) onToggle();
                        }}
                    >
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Pilih Klien</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setModalVisible(false);
                                        if (onToggle) onToggle();
                                    }}
                                    style={styles.closeButton}
                                >
                                    <Ionicons name="close" size={24} color="#6B7280" />
                                </TouchableOpacity>
                            </View>

                            {clients.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="business-outline" size={48} color="#9CA3AF" />
                                    <Text style={styles.emptyStateText}>Tidak ada klien tersedia</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={clients}
                                    renderItem={renderClientItem}
                                    keyExtractor={(item) => item.id.toString()}
                                    style={styles.clientList}
                                    showsVerticalScrollIndicator={false}
                                    maxHeight={300}
                                />
                            )}
                        </View>
                    </TouchableOpacity>
                </Modal>
            </View>
        );
    },
);

ClientDropdown.displayName = 'ClientDropdown';

const styles = StyleSheet.create({
    container: {
        zIndex: 1000,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 48,
    },
    selectedButton: {
        borderColor: '#4A90E2',
        backgroundColor: '#F0F9FF',
    },
    disabledButton: {
        backgroundColor: '#F3F4F6',
        borderColor: '#D1D5DB',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    buttonText: {
        fontSize: 14,
        fontFamily: FONTS?.family?.medium || 'System',
        color: '#1F2937',
        flex: 1,
    },
    selectedText: {
        color: '#4A90E2',
        fontFamily: FONTS?.family?.semiBold || 'System',
    },
    placeholderText: {
        color: '#9CA3AF',
    },
    disabledText: {
        color: '#9CA3AF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        maxHeight: '70%',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: FONTS?.family?.bold || 'System',
        color: '#1F2937',
    },
    closeButton: {
        padding: 4,
    },
    clientList: {
        maxHeight: 300,
    },
    clientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    selectedClientItem: {
        backgroundColor: '#F0F9FF',
    },
    clientInfo: {
        flex: 1,
        marginRight: 12,
    },
    clientName: {
        fontSize: 16,
        fontFamily: FONTS?.family?.medium || 'System',
        color: '#1F2937',
        marginBottom: 4,
    },
    selectedClientName: {
        color: '#4A90E2',
        fontFamily: FONTS?.family?.semiBold || 'System',
    },
    clientAddress: {
        fontSize: 14,
        fontFamily: FONTS?.family?.regular || 'System',
        color: '#6B7280',
        lineHeight: 20,
    },
    selectedClientAddress: {
        color: '#4A90E2',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyStateText: {
        fontSize: 16,
        fontFamily: FONTS?.family?.medium || 'System',
        color: '#9CA3AF',
        marginTop: 12,
        textAlign: 'center',
    },
});

export default ClientDropdown;
