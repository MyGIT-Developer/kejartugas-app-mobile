import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchChatByTaskId, sendChatMessage } from '../api/task';
import Shimmer from '../components/Shimmer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ChatInterface = ({ route, navigation }) => {
    const { taskId, taskDetails, taskSubtitle } = route.params || {};

    if (!taskDetails) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: Task details are not available.</Text>
            </SafeAreaView>
        );
    }

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [sending, setSending] = useState(false);
    const [employeeId, setEmployeeId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGeminiMode, setIsGeminiMode] = useState(false);

    const flatListRef = useRef(null);

    useEffect(() => {
        const getEmployeeAndCompanyId = async () => {
            try {
                const id = await AsyncStorage.getItem('employeeId');
                const compId = await AsyncStorage.getItem('companyId');
                setEmployeeId(id);
                setCompanyId(compId);
            } catch (error) {
                Alert.alert('Error', 'Failed to load user data. Please try again.');
            }
        };
        getEmployeeAndCompanyId();
        loadChatMessages();
    }, [taskId]);

    const loadChatMessages = async () => {
        setIsLoading(true);
        try {
            const response = await fetchChatByTaskId(taskId);
            if (response.status === 'success') {
                const fetchedMessages = response.data.map((msg) => ({
                    id: msg.id.toString(),
                    message: msg.message,
                    employee_name: msg.employee_name,
                    employee_id: msg.employee_id.toString(),
                    time: msg.created_at_wib,
                    status: 'sent',
                }));
                fetchedMessages.sort((a, b) => new Date(a.time) - new Date(b.time));
                setMessages(fetchedMessages);
                scrollToBottom();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load chat messages. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadChatMessages();
        setRefreshing(false);
    };

    const scrollToBottom = () => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleSend = async () => {
        if (!inputText.trim() || !employeeId || !companyId) {
            Alert.alert('Error', 'Missing required information. Please try again.');
            return;
        }

        if (inputText.toLowerCase() === '/gemini' && !isGeminiMode) {
            setIsGeminiMode(true);
            const geminiMessage = {
                id: Date.now().toString(),
                message: "Halo! Saya adalah Gemini AI. Apa yang ingin Anda tanyakan?",
                employee_name: 'Gemini AI',
                employee_id: 'gemini',
                time: new Date().toISOString(),
                status: 'sent',
            };
            setMessages(prevMessages => [...prevMessages, geminiMessage]);
            setInputText('');
            return;
        }

        if (inputText.toLowerCase() === '/quit' && isGeminiMode) {
            setIsGeminiMode(false);
            const quitMessage = {
                id: Date.now().toString(),
                message: "Terima kasih telah menggunakan Gemini AI. Kembali ke mode chat normal.",
                employee_name: 'System',
                employee_id: 'system',
                time: new Date().toISOString(),
                status: 'sent',
            };
            setMessages(prevMessages => [...prevMessages, quitMessage]);
            setInputText('');
            return;
        }

        const newMessage = {
            id: Date.now().toString(),
            message: inputText,
            employee_name: isGeminiMode ? 'You' : 'You',
            employee_id: isGeminiMode ? 'user' : employeeId,
            time: new Date().toISOString(),
            status: 'sending',
        };

        setMessages(prevMessages => [...prevMessages, newMessage]);
        setInputText('');
        setSending(true);

        try {
            if (isGeminiMode) {
                // Call Gemini AI API
                const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyCbw7k1d60bhz7fHM9xgPZNql6LqQLxizM', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: inputText
                                    }
                                ]
                            }
                        ]
                    })
                });

                const data = await response.json();
                const geminiResponse = data.candidates[0].content.parts[0].text;

                const geminiMessage = {
                    id: Date.now().toString(),
                    message: geminiResponse,
                    employee_name: 'Gemini AI',
                    employee_id: 'gemini',
                    time: new Date().toISOString(),
                    status: 'sent',
                };

                setMessages(prevMessages => [...prevMessages, geminiMessage]);
            } else {
                // Existing chat logic
                const response = await sendChatMessage(employeeId, taskId, inputText.trim(), companyId);

                if (response && response.id) {
                    setMessages(prevMessages =>
                        prevMessages.map(msg =>
                            msg.id === newMessage.id ? { ...msg, status: 'sent', id: response.id.toString() } : msg
                        )
                    );
                } else {
                    setMessages(prevMessages =>
                        prevMessages.map(msg => (msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg))
                    );
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send message. Please try again.');

            setMessages(prevMessages =>
                prevMessages.map(msg => (msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg))
            );
        } finally {
            setSending(false);
        }
    };

    const renderShimmer = () => (
        <View style={styles.shimmerContainer}>
            {[...Array(5)].map((_, index) => (
                <View key={index} style={styles.shimmerMessageContainer}>
                    <Shimmer width={40} height={40} style={styles.shimmerAvatar} />
                    <View style={styles.shimmerTextContainer}>
                        <Shimmer width={SCREEN_WIDTH * 0.6} height={20} style={styles.shimmerText} />
                        <Shimmer width={SCREEN_WIDTH * 0.4} height={15} style={[styles.shimmerText, { marginTop: 5 }]} />
                    </View>
                </View>
            ))}
        </View>
    );

    const renderDateHeader = (date) => {
        const messageDate = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (messageDate.toDateString() === today.toDateString()) {
            return 'Hari Ini';
        } else if (messageDate.toDateString() === yesterday.toDateString()) {
            return 'Kemarin';
        } else {
            return messageDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
    };

    const renderMessage = ({ item, index }) => {
        const messageTime = new Date(item.time);
        const timeInGMT7 = messageTime.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });
    
        const isCurrentUser = item.employee_id === employeeId || item.employee_id === 'user';
        const isGemini = item.employee_id === 'gemini';
        const isSystem = item.employee_id === 'system';
        const showDateHeader =
            index === 0 || new Date(item.time).toDateString() !== new Date(messages[index - 1].time).toDateString();
    
        return (
            <>
                {showDateHeader && <Text style={styles.dateLabel}>{renderDateHeader(item.time)}</Text>}
                <View
                    style={[
                        styles.messageContainer,
                        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
                        isGemini && styles.geminiContainer,
                        isSystem && styles.systemContainer,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageSender,
                            isCurrentUser ? styles.currentUserSender : styles.otherUserSender,
                            isGemini && styles.geminiSender,
                            isSystem && styles.systemSender,
                        ]}
                    >
                        {isCurrentUser ? 'You' : item.employee_name}
                    </Text>
                    <View style={styles.bubbleAndTimeContainer}>
                        {isCurrentUser && (
                            <View style={styles.timeAndIconContainer}>
                                <Text style={[styles.messageTime, styles.currentUserTime]}>{timeInGMT7}</Text>
                                {item.status === 'sending' && (
                                    <Ionicons
                                        name="time-outline"
                                        size={12}
                                        color="#777"
                                        style={styles.sendingIcon}
                                    />
                                )}
                                {item.status === 'failed' && (
                                    <Ionicons
                                        name="alert-circle-outline"
                                        size={12}
                                        color="red"
                                        style={styles.sendingIcon}
                                    />
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
                        {!isCurrentUser && (
                            <Text style={[styles.messageTime, styles.otherUserTime]}>{timeInGMT7}</Text>
                        )}
                    </View>
                </View>
            </>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                {isGeminiMode ? (
                    <View style={styles.geminiHeader}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                            <Ionicons name="arrow-back" color="#5F6368" size={24} />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.geminiHeaderTitle} numberOfLines={1} ellipsizeMode="tail">
                                Gemini AI Chat
                            </Text>
                            <Text style={styles.geminiHeaderSubtitle} numberOfLines={1} ellipsizeMode="tail">
                                Ask me anything!
                            </Text>
                        </View>
                        <View style={styles.geminiLogo}>
                            <View style={styles.geminiLogoCircle} />
                            <View style={[styles.geminiLogoCircle, { backgroundColor: '#EA4335' }]} />
                            <View style={[styles.geminiLogoCircle, { backgroundColor: '#FBBC05' }]} />
                            <View style={[styles.geminiLogoCircle, { backgroundColor: '#34A853' }]} />
                        </View>
                    </View>
                ) : (
                    <LinearGradient
                        colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                        style={styles.headerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.headerContent}>
                            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                                <Ionicons name="arrow-back" color="#fff" size={24} />
                            </TouchableOpacity>
                            <View style={styles.headerTextContainer}>
                                <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
                                    {taskDetails.title || 'Task Title'}
                                </Text>
                                <Text style={styles.headerSubtitle} numberOfLines={1} ellipsizeMode="tail">
                                    {taskDetails.subtitle || 'Task Subtitle'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                )}
            </View>

            {isLoading ? (
                renderShimmer()
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messageContainerStyle}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    onContentSizeChange={scrollToBottom}
                    onLayout={scrollToBottom}
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder={isGeminiMode ? "Ask Gemini AI... (or type 'quit' to exit)" : "Ketik pesan..."}
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity style={[styles.sendButton, isGeminiMode && styles.geminiSendButton]} onPress={handleSend} disabled={sending}>
                    <Ionicons name="paper-plane" color="#fff" size={24} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
    },
    backgroundBox: {
        height: 130,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        paddingTop: 40,
        paddingHorizontal: 20,
        elevation: 5,
    },
    header: {
        height: 100, // Reduced height
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
    },
    headerGradient: {
        flex: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 15,
    },
    backButton: {
        padding: 8,
        marginRight: 10,
    },
    headerTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#f0f0f0',
    },
    subHeader: {
        color: '#dfefff',
        fontSize: 12,
        marginTop: 0,
    },
    messageContainerStyle: {
        flexGrow: 1,
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    dateLabel: {
        alignSelf: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        color: '#6b6b6b',
        fontSize: 12,
        marginVertical: 10,
    },
    messageContainer: {
        marginBottom: 15,
        maxWidth: '80%',
    },
    currentUserContainer: {
        alignSelf: 'flex-end',
    },
    otherUserContainer: {
        alignSelf: 'flex-start',
    },
    geminiContainer: {
        alignSelf: 'flex-start',
    },
    systemContainer: {
        alignSelf: 'center',
        maxWidth: '90%',
    },
    messageSender: {
        fontSize: 12,
        marginBottom: 2,
    },
    currentUserSender: {
        color: '#777',
        textAlign: 'right',
    },
    otherUserSender: {
        color: '#555',
    },
    geminiHeader: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 40,
        paddingHorizontal: 15,
        backgroundColor: '#F1F3F4',
    },
    geminiHeaderTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#202124',
        marginBottom: 2,
    },
    geminiHeaderSubtitle: {
        fontSize: 12,
        color: '#5F6368',
    },
    geminiLogo: {
        flexDirection: 'row',
        marginLeft: 10,
    },
    geminiLogoCircle: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4285F4',
        marginHorizontal: 2,
    },
    geminiSender: {
        color: '#4285F4',
        fontWeight: 'bold',
    },
    systemSender: {
        color: '#888',
        fontStyle: 'italic',
    },
    bubbleAndTimeContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    messageBubble: {
        padding: 10,
        borderRadius: 15,
    },
    currentUserBubble: {
        backgroundColor: '#27A0CF',
    },
    otherUserBubble: {
        backgroundColor: '#D9D9D9',
    },
    geminiBubble: {
        backgroundColor: '#E8F0FE',
        borderWidth: 1,
        borderColor: '#4285F4',
    },
    systemBubble: {
        backgroundColor: '#F0F0F0',
        borderWidth: 1,
        borderColor: '#CCCCCC',
    },
    messageText: {
        fontSize: 16,
    },
    currentUserText: {
        color: '#FFFFFF',
    },
    otherUserText: {
        color: '#000000',
    },
    geminiText: {
        color: '#000000',
    },
    systemText: {
        color: '#555555',
        fontStyle: 'italic',
    },
    messageTime: {
        fontSize: 12,
        marginTop: 2,
    },
    currentUserTime: {
        color: '#777',
        marginRight: 5,
    },
    otherUserTime: {
        color: '#777',
        marginLeft: 5,
    },
    timeAndIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sendingIcon: {
        marginLeft: 5,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        fontSize: 16,
        color: '#333',
    },
    sendButton: {
        marginLeft: 10,
        backgroundColor: '#0E509E',
        padding: 10,
        borderRadius: 50,
    },
    geminiSendButton: {
        backgroundColor: '#4285F4',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        fontWeight: 'bold',
    },
    shimmerContainer: {
        flex: 1,
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    shimmerMessageContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    shimmerAvatar: {
        borderRadius: 20,
        marginRight: 10,
    },
    shimmerTextContainer: {
        flex: 1,
    },
    shimmerText: {
        borderRadius: 5,
    },
});

export default ChatInterface;
