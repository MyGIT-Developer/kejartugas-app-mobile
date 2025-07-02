import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Alert,
    Dimensions,
    StatusBar,
    Platform,
    KeyboardAvoidingView,
    Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchChatByTaskId, sendChatMessage, fetchChatByAdhocId, sendAdhocChatMessage } from '../api/task';
import Shimmer from '../components/Shimmer';
import { FONTS } from '../constants/fonts';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Constants for better maintainability
const GEMINI_API_KEY = 'AIzaSyCbw7k1d60bhz7fHM9xgPZNql6LqQLxizM';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
const MESSAGE_LIMIT = 500;
const ANIMATION_DURATION = 300;

// Optimized date formatting
const formatMessageDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
        return 'Hari Ini';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return 'Kemarin';
    } else {
        return messageDate.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    }
};

// Message types for better type safety
const MESSAGE_TYPES = {
    USER: 'user',
    GEMINI: 'gemini',
    SYSTEM: 'system',
    EMPLOYEE: 'employee',
};

const ChatInterface = ({ route, navigation }) => {
    const { taskId, adhocId, taskDetails, taskSubtitle, isAdhoc = false } = route.params || {};

    // Early return with better error UI
    if (!taskDetails) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />
                <View style={styles.errorContent}>
                    <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                    <Text style={styles.errorTitle}>Oops! Terjadi Kesalahan</Text>
                    <Text style={styles.errorText}>Detail task tidak tersedia. Silakan coba kembali.</Text>
                    <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
                        <Text style={styles.errorButtonText}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // State management with better organization
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [employeeId, setEmployeeId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeminiMode, setIsGeminiMode] = useState(false);
    const [waitingForYesNo, setWaitingForYesNo] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Refs
    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    // Memoized values for better performance
    const headerTitle = useMemo(() => {
        return isGeminiMode ? 'Gemini AI Chat' : taskDetails.title || 'Task Chat';
    }, [isGeminiMode, taskDetails.title]);

    const headerSubtitle = useMemo(() => {
        return isGeminiMode ? 'Ask me anything!' : taskDetails.subtitle || 'Diskusi Task';
    }, [isGeminiMode, taskDetails.subtitle]);

    const canSendMessage = useMemo(() => {
        return inputText.trim().length > 0 && !sending && employeeId && companyId;
    }, [inputText, sending, employeeId, companyId]);

    // Initialize component with better error handling and animation
    useEffect(() => {
        const initializeChat = async () => {
            try {
                // Start entrance animations
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: ANIMATION_DURATION,
                        useNativeDriver: true,
                    }),
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        tension: 80,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                ]).start();

                // Load user data
                const [id, compId] = await Promise.all([
                    AsyncStorage.getItem('employeeId'),
                    AsyncStorage.getItem('companyId'),
                ]);

                setEmployeeId(id);
                setCompanyId(compId);

                // Load chat messages
                await loadChatMessages();
            } catch (error) {
                console.error('Failed to initialize chat:', error);
                Alert.alert('Error', 'Gagal memuat data chat. Silakan coba lagi.');
            }
        };

        initializeChat();
    }, [taskId, adhocId]);

    // Optimized message loading with better error handling
    const loadChatMessages = useCallback(async () => {
        setIsLoading(true);
        try {
            // Use different API based on whether it's adhoc or regular task
            const response = isAdhoc ? await fetchChatByAdhocId(adhocId) : await fetchChatByTaskId(taskId);

            if (response.status === 'success' && response.data) {
                const fetchedMessages = response.data.map((msg) => ({
                    id: msg.id.toString(),
                    message: msg.message,
                    employee_name: msg.employee_name,
                    employee_id: msg.employee_id.toString(),
                    time: msg.created_at_wib,
                    status: 'sent',
                    type: MESSAGE_TYPES.EMPLOYEE,
                }));

                // Sort messages by time
                fetchedMessages.sort((a, b) => new Date(a.time) - new Date(b.time));
                setMessages(fetchedMessages);

                // Scroll to bottom after a brief delay for better UX
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error('Failed to load messages:', error);
            Alert.alert('Error', 'Gagal memuat pesan chat. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    }, [taskId, adhocId, isAdhoc]);

    // Optimized refresh function
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadChatMessages();
        setRefreshing(false);
    }, [loadChatMessages]);

    // Improved scroll to bottom function
    const scrollToBottom = useCallback(() => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages.length]);

    // Auto-scroll when messages update
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(scrollToBottom, 100);
        }
    }, [messages, scrollToBottom]);

    // Enhanced back button handler
    const handleBackPress = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    // Gemini AI integration with better error handling
    const callGeminiAPI = useCallback(async (prompt) => {
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: prompt,
                                },
                            ],
                        },
                    ],
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return (
                data.candidates?.[0]?.content?.parts?.[0]?.text ||
                'Maaf, saya tidak dapat memproses permintaan Anda saat ini.'
            );
        } catch (error) {
            console.error('Gemini API error:', error);
            throw new Error('Gagal menghubungi Gemini AI. Silakan coba lagi.');
        }
    }, []);

    // Enhanced send message handler
    const handleSend = useCallback(async () => {
        if (!canSendMessage) return;

        const trimmedInput = inputText.trim();

        // Handle special commands
        if (trimmedInput === '/gemini' && !isGeminiMode) {
            setIsGeminiMode(true);
            setWaitingForYesNo(true);
            const geminiMessage = {
                id: Date.now().toString(),
                message: `Halo! Saya adalah Gemini AI. Apakah Anda ingin bertanya tentang "${taskDetails.title}"?`,
                employee_name: 'Gemini AI',
                employee_id: MESSAGE_TYPES.GEMINI,
                time: new Date().toISOString(),
                status: 'sent',
                type: MESSAGE_TYPES.GEMINI,
            };
            setMessages((prev) => [...prev, geminiMessage]);
            setInputText('');
            return;
        }

        if (trimmedInput === '/quit' && isGeminiMode) {
            setIsGeminiMode(false);
            setWaitingForYesNo(false);
            const quitMessage = {
                id: Date.now().toString(),
                message: 'Terima kasih telah menggunakan Gemini AI. Kembali ke mode chat normal.',
                employee_name: 'System',
                employee_id: MESSAGE_TYPES.SYSTEM,
                time: new Date().toISOString(),
                status: 'sent',
                type: MESSAGE_TYPES.SYSTEM,
            };
            setMessages((prev) => [...prev, quitMessage]);
            setInputText('');
            return;
        }

        // Create new message
        const newMessage = {
            id: Date.now().toString(),
            message: trimmedInput,
            employee_name: isGeminiMode ? 'You' : 'You',
            employee_id: isGeminiMode ? MESSAGE_TYPES.USER : employeeId,
            time: new Date().toISOString(),
            status: 'sending',
            type: isGeminiMode ? MESSAGE_TYPES.USER : MESSAGE_TYPES.EMPLOYEE,
        };

        setMessages((prev) => [...prev, newMessage]);
        setInputText('');
        setSending(true);

        try {
            if (isGeminiMode) {
                await handleGeminiMessage(trimmedInput, newMessage);
            } else {
                await handleRegularMessage(trimmedInput, newMessage);
            }
        } catch (error) {
            console.error('Send message error:', error);
            Alert.alert('Error', 'Gagal mengirim pesan. Silakan coba lagi.');

            setMessages((prev) => prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg)));
        } finally {
            setSending(false);
        }
    }, [canSendMessage, inputText, isGeminiMode, waitingForYesNo, taskDetails.title, employeeId]);

    // Handle Gemini AI messages
    const handleGeminiMessage = useCallback(
        async (input, userMessage) => {
            if (waitingForYesNo) {
                if (input.toLowerCase().includes('ya') || input.toLowerCase().includes('iya')) {
                    setWaitingForYesNo(false);
                    const prompt = `Tolong jelaskan langkah-langkah detail cara mengerjakan atau menyelesaikan "${taskDetails.title}". ${
                        taskDetails.subtitle ? `Konteks tambahan: ${taskDetails.subtitle}` : ''
                    }`;

                    const geminiResponse = await callGeminiAPI(prompt);
                    const geminiMessage = {
                        id: Date.now().toString(),
                        message: geminiResponse,
                        employee_name: 'Gemini AI',
                        employee_id: MESSAGE_TYPES.GEMINI,
                        time: new Date().toISOString(),
                        status: 'sent',
                        type: MESSAGE_TYPES.GEMINI,
                    };

                    setMessages((prev) => [...prev, geminiMessage]);
                    return;
                }
                setWaitingForYesNo(false);
            }

            // Regular Gemini conversation
            const geminiResponse = await callGeminiAPI(input);
            const geminiMessage = {
                id: Date.now().toString(),
                message: geminiResponse,
                employee_name: 'Gemini AI',
                employee_id: MESSAGE_TYPES.GEMINI,
                time: new Date().toISOString(),
                status: 'sent',
                type: MESSAGE_TYPES.GEMINI,
            };

            setMessages((prev) => [...prev, geminiMessage]);
        },
        [waitingForYesNo, taskDetails.title, taskDetails.subtitle, callGeminiAPI],
    );

    // Handle regular chat messages
    const handleRegularMessage = useCallback(
        async (input, userMessage) => {
            // Use different API based on whether it's adhoc or regular task
            const response = isAdhoc
                ? await sendAdhocChatMessage(employeeId, adhocId, input, companyId)
                : await sendChatMessage(employeeId, taskId, input, companyId);

            if (response?.id) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === userMessage.id ? { ...msg, status: 'sent', id: response.id.toString() } : msg,
                    ),
                );
            } else {
                setMessages((prev) =>
                    prev.map((msg) => (msg.id === userMessage.id ? { ...msg, status: 'sent' } : msg)),
                );
            }
        },
        [employeeId, taskId, adhocId, companyId, isAdhoc],
    );

    // Enhanced shimmer component with better design
    const renderShimmer = useCallback(
        () => (
            <Animated.View
                style={[
                    styles.shimmerContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                {Array.from({ length: 6 }, (_, index) => (
                    <View key={index} style={styles.shimmerMessageContainer}>
                        <View
                            style={[
                                styles.shimmerMessageBubble,
                                index % 2 === 0 ? styles.shimmerOtherUser : styles.shimmerCurrentUser,
                            ]}
                        >
                            <Shimmer
                                width={SCREEN_WIDTH * (0.3 + Math.random() * 0.4)}
                                height={16}
                                style={styles.shimmerLine}
                            />
                            <Shimmer
                                width={SCREEN_WIDTH * (0.2 + Math.random() * 0.3)}
                                height={14}
                                style={[styles.shimmerLine, { marginTop: 6 }]}
                            />
                        </View>
                    </View>
                ))}
            </Animated.View>
        ),
        [fadeAnim, slideAnim],
    );

    // Optimized message type detection
    const getMessageType = useCallback(
        (item) => {
            if (item.employee_id === MESSAGE_TYPES.GEMINI) return MESSAGE_TYPES.GEMINI;
            if (item.employee_id === MESSAGE_TYPES.SYSTEM) return MESSAGE_TYPES.SYSTEM;
            if (item.employee_id === MESSAGE_TYPES.USER || item.employee_id === employeeId) return MESSAGE_TYPES.USER;
            return MESSAGE_TYPES.EMPLOYEE;
        },
        [employeeId],
    );

    // Memoized message renderer for better performance
    const renderMessage = useCallback(
        ({ item, index }) => {
            const messageTime = new Date(item.time);
            const timeInGMT7 = messageTime.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
            });

            const messageType = getMessageType(item);
            const isCurrentUser = messageType === MESSAGE_TYPES.USER;
            const isGemini = messageType === MESSAGE_TYPES.GEMINI;
            const isSystem = messageType === MESSAGE_TYPES.SYSTEM;

            const showDateHeader =
                index === 0 || new Date(item.time).toDateString() !== new Date(messages[index - 1].time).toDateString();

            return (
                <>
                    {showDateHeader && (
                        <View style={styles.dateHeader}>
                            <Text style={styles.dateText}>{formatMessageDate(item.time)}</Text>
                        </View>
                    )}

                    <Animated.View
                        style={[
                            styles.messageContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        {!isCurrentUser && (
                            <Text
                                style={[
                                    styles.senderName,
                                    {
                                        color: isGemini ? '#4285F4' : isSystem ? '#F59E0B' : '#6B7280',
                                    },
                                ]}
                            >
                                {item.employee_name}
                            </Text>
                        )}

                        <View style={styles.bubbleAndTimeContainer}>
                            {isCurrentUser && (
                                <View style={styles.timeAndIconContainer}>
                                    <Text style={styles.currentUserTime}>{timeInGMT7}</Text>
                                    {item.status === 'sending' && (
                                        <Ionicons name="time-outline" size={12} color="#94A3B8" />
                                    )}
                                    {item.status === 'failed' && (
                                        <Ionicons name="alert-circle-outline" size={12} color="#EF4444" />
                                    )}
                                </View>
                            )}

                            <View
                                style={[
                                    styles.messageBubble,
                                    isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
                                    isGemini && styles.geminiBubble,
                                    isSystem && styles.systemBubble,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.messageText,
                                        isCurrentUser ? styles.currentUserText : styles.otherUserText,
                                        isGemini && styles.geminiText,
                                        isSystem && styles.systemText,
                                    ]}
                                >
                                    {item.message}
                                </Text>
                            </View>

                            {!isCurrentUser && <Text style={styles.otherUserTime}>{timeInGMT7}</Text>}
                        </View>
                    </Animated.View>
                </>
            );
        },
        [messages, getMessageType, fadeAnim, slideAnim],
    );

    // Optimized key extractor
    const keyExtractor = useCallback((item) => item.id, []);

    // Enhanced header component
    const renderHeader = useMemo(() => {
        return (
            <LinearGradient
                colors={isGeminiMode ? ['#4285F4', '#34A853'] : ['#4A90E2', '#5FA0DC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerContent}
            >
                <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>{headerTitle}</Text>
                    <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
                </View>
            </LinearGradient>
        );
    }, [isGeminiMode, headerTitle, headerSubtitle, handleBackPress]);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar
                barStyle={isGeminiMode ? 'dark-content' : 'light-content'}
                backgroundColor={isGeminiMode ? '#F8F9FA' : '#4A90E2'}
                translucent={false}
            />

            {/* Enhanced Header */}
            <View style={styles.header}>{renderHeader}</View>

            {/* Messages List */}
            <KeyboardAvoidingView
                style={styles.messagesContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {isLoading ? (
                    renderShimmer()
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={renderMessage}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.messageContainerStyle}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[isGeminiMode ? '#4285F4' : '#4A90E2']}
                                tintColor={isGeminiMode ? '#4285F4' : '#4A90E2'}
                            />
                        }
                        onContentSizeChange={scrollToBottom}
                        onLayout={scrollToBottom}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={8}
                        updateCellsBatchingPeriod={100}
                        initialNumToRender={15}
                        windowSize={8}
                        getItemLayout={null} // Remove for better performance with dynamic heights
                    />
                )}

                {/* Enhanced Input Container */}
                <Animated.View
                    style={[
                        styles.inputContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.inputWrapper}>
                        <TextInput
                            ref={inputRef}
                            style={[
                                styles.input,
                                isGeminiMode && styles.geminiInput,
                                inputText.length > MESSAGE_LIMIT * 0.9 && { borderColor: '#F59E0B' },
                            ]}
                            placeholder={
                                isGeminiMode ? "Tanya Gemini AI... (ketik '/quit' untuk keluar)" : 'Ketik pesan Anda...'
                            }
                            placeholderTextColor="#9CA3AF"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline={true}
                            maxLength={MESSAGE_LIMIT}
                            scrollEnabled={true}
                            textAlignVertical="top"
                            returnKeyType="send"
                            onSubmitEditing={handleSend}
                            blurOnSubmit={false}
                        />

                        <TouchableOpacity
                            style={[
                                styles.sendButton,
                                { opacity: canSendMessage ? 1 : 0.5 },
                                isGeminiMode && styles.geminiSendButton,
                            ]}
                            onPress={handleSend}
                            disabled={!canSendMessage}
                        >
                            <Ionicons
                                name={sending ? 'hourglass-outline' : 'send'}
                                size={20}
                                color={isGeminiMode ? '#4285F4' : '#FFFFFF'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Character count indicator */}
                    {inputText.length > MESSAGE_LIMIT * 0.8 && (
                        <Text
                            style={[
                                styles.characterCount,
                                inputText.length > MESSAGE_LIMIT * 0.9 && { color: '#F59E0B' },
                                inputText.length >= MESSAGE_LIMIT && { color: '#EF4444' },
                            ]}
                        >
                            {inputText.length}/{MESSAGE_LIMIT}
                        </Text>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    errorContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    errorContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontFamily: FONTS.semiBold,
        color: '#1F2937',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 16,
        fontFamily: FONTS.regular,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    errorButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    errorButtonText: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: '#FFFFFF',
    },
    header: {
        backgroundColor: '#4A90E2',
        paddingTop: Platform.OS === 'ios' ? 0 : 8,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 60,
    },
    backButton: {
        marginRight: 16,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.semiBold,
        color: '#FFFFFF',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        fontFamily: FONTS.regular,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    messagesContainer: {
        flex: 1,
    },
    messageContainerStyle: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexGrow: 1,
    },
    messageContainer: {
        marginBottom: 16,
    },
    dateHeader: {
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 16,
        marginTop: 8,
    },
    dateText: {
        fontSize: 12,
        fontFamily: FONTS.medium,
        color: '#6B7280',
        textAlign: 'center',
    },
    senderName: {
        fontSize: 13,
        fontFamily: FONTS.medium,
        marginBottom: 4,
        marginLeft: 4,
    },
    bubbleAndTimeContainer: {
        alignItems: 'flex-end',
    },
    timeAndIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        gap: 4,
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 18,
        maxWidth: '80%',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    currentUserBubble: {
        backgroundColor: '#4A90E2',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 6,
    },
    otherUserBubble: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    geminiBubble: {
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#4285F4',
        alignSelf: 'flex-start',
    },
    systemBubble: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#F59E0B',
        alignSelf: 'center',
    },
    messageText: {
        fontSize: 16,
        fontFamily: FONTS.regular,
        lineHeight: 22,
    },
    currentUserText: {
        color: '#FFFFFF',
    },
    otherUserText: {
        color: '#1F2937',
    },
    geminiText: {
        color: '#1F2937',
    },
    systemText: {
        color: '#92400E',
    },
    currentUserTime: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        color: '#94A3B8',
        textAlign: 'right',
    },
    otherUserTime: {
        fontSize: 11,
        fontFamily: FONTS.regular,
        color: '#9CA3AF',
        marginTop: 4,
        marginLeft: 4,
    },
    inputContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: FONTS.regular,
        color: '#1F2937',
        backgroundColor: '#F9FAFB',
        maxHeight: 120,
        minHeight: 44,
    },
    geminiInput: {
        borderColor: '#4285F4',
        backgroundColor: '#F8F9FF',
    },
    sendButton: {
        backgroundColor: '#4A90E2',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    geminiSendButton: {
        backgroundColor: '#4285F4',
    },
    characterCount: {
        fontSize: 12,
        fontFamily: FONTS.regular,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },
    shimmerContainer: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    shimmerMessageContainer: {
        marginBottom: 16,
    },
    shimmerMessageBubble: {
        borderRadius: 18,
        padding: 16,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    shimmerOtherUser: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 6,
        maxWidth: '75%',
    },
    shimmerCurrentUser: {
        alignSelf: 'flex-end',
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        borderColor: 'rgba(74, 144, 226, 0.2)',
        borderBottomRightRadius: 6,
        maxWidth: '70%',
    },
    shimmerLine: {
        borderRadius: 6,
    },
});

export default ChatInterface;
