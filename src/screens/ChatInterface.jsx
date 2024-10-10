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
    }, [messages])
    const handleBackPress = () => {
        // Option 2: Go back to the previous screen
        navigation.goBack();
    };
    const handleSend = async () => {
        if (!inputText.trim() || !employeeId || !companyId) {
            Alert.alert('Error', 'Missing required information. Please try again.');
            return;
        }

        const newMessage = {
            id: Date.now().toString(),
            message: inputText,
            employee_name: 'You',
            employee_id: employeeId,
            time: new Date().toISOString(),
            status: 'sending',
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);
        setInputText('');
        setSending(true);

        try {
            const response = await sendChatMessage(employeeId, taskId, inputText.trim(), companyId);

            if (response && response.id) {
                setMessages((prevMessages) =>
                    prevMessages.map((msg) =>
                        msg.id === newMessage.id ? { ...msg, status: 'sent', id: response.id.toString() } : msg,
                    ),
                );
            } else {
                setMessages((prevMessages) =>
                    prevMessages.map((msg) => (msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg)),
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to send message. Please try again.');

            setMessages((prevMessages) =>
                prevMessages.map((msg) => (msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg)),
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
    
        const isCurrentUser = item.employee_id === employeeId;
        const showDateHeader =
            index === 0 || new Date(item.time).toDateString() !== new Date(messages[index - 1].time).toDateString();
    
        return (
            <>
                {showDateHeader && <Text style={styles.dateLabel}>{renderDateHeader(item.time)}</Text>}
                <View
                    style={[
                        styles.messageContainer,
                        isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
                    ]}
                >
                    <Text
                        style={[
                            styles.messageSender,
                            isCurrentUser ? styles.currentUserSender : styles.otherUserSender,
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
                            ]}
                        >
                            <Text
                                style={[
                                    styles.messageText,
                                    isCurrentUser ? styles.currentUserText : styles.otherUserText,
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
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerContent}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                            <Ionicons name="arrow-back" color="#fff" size={28} />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.header}>{taskDetails.title || 'Task Title'}</Text>
                            <Text style={styles.subHeader}>{taskDetails.subtitle || 'Task Title'}</Text>
                        </View>
                    </View>
                </LinearGradient>
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
                    placeholder="Ketik pesan..."
                    placeholderTextColor="#999"
                    value={inputText}
                    onChangeText={setInputText}
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending}>
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
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 15,
        padding: 10,
    },
    headerTextContainer: {
        flex: 1,
        alignItems: 'flex-start',
        alignSelf: 'center',
        marginBottom: 5,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2,
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
    messageText: {
        fontSize: 16,
    },
    currentUserText: {
        color: '#FFFFFF',
    },
    otherUserText: {
        color: '#000000',
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
    timeAndIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sendingIcon: {
        marginLeft: 5,
    },
});

export default ChatInterface;