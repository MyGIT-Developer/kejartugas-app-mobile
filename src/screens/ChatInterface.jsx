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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchChatByTaskId } from '../api/task';

const ChatInterface = ({ route }) => {
    const { taskId, taskDetails } = route.params || {};

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
    const [refreshing, setRefreshing] = useState(false);

    const flatListRef = useRef(null);

    useEffect(() => {
        const getEmployeeId = async () => {
            const id = await AsyncStorage.getItem('employeeId');
            setEmployeeId(id);
            console.log('Fetched Employee ID:', id);
        };
        getEmployeeId();

        const loadChatMessages = async () => {
            try {
                const response = await fetchChatByTaskId(taskId);
                console.log('Fetched Messages:', response);
                if (response.status === 'success') {
                    const fetchedMessages = response.data.map((msg) => ({
                        id: msg.id.toString(),
                        message: msg.message,
                        employee_name: msg.employee_name,
                        employee_id: msg.employee_id.toString(),
                        time: msg.created_at,
                        status: 'sent',
                    }));
                    setMessages(fetchedMessages);
                }
            } catch (error) {
                console.error('Error fetching chat messages:', error.message);
            }
        };

        loadChatMessages();
    }, [taskId]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const response = await fetchChatByTaskId(taskId);
            if (response.status === 'success') {
                const fetchedMessages = response.data.map((msg) => ({
                    id: msg.id.toString(),
                    message: msg.message,
                    employee_name: msg.employee_name,
                    employee_id: msg.employee_id.toString(),
                    time: msg.created_at,
                    status: 'sent',
                }));
                setMessages(fetchedMessages);
            }
        } catch (error) {
            console.error('Error refreshing chat messages:', error.message);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (flatListRef.current && messages.length > 0) {
            flatListRef.current.scrollToEnd({ animated: false });
        }
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage = {
            id: (messages.length + 1).toString(),
            message: inputText,
            employee_name: 'You',
            employee_id: employeeId,
            time: new Date().toISOString(),
            status: 'sending',
        };

        setMessages([...messages, newMessage]);
        setInputText('');
        setSending(true);

        setTimeout(() => {
            setMessages((prevMessages) =>
                prevMessages.map((msg) => (msg.id === newMessage.id ? { ...msg, status: 'sent' } : msg)),
            );
            setSending(false);
        }, 2000);
    };

    const renderMessage = ({ item }) => {
        const messageTime = new Date(item.time);
        const timeInGMT7 = new Date(messageTime.setHours(messageTime.getHours() + 7)).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const isCurrentUser = item.employee_id === employeeId;

        return (
            <View
                style={[
                    styles.messageContainer,
                    isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
                ]}
            >
                <Text style={[styles.messageSender, isCurrentUser ? styles.currentUserSender : styles.otherUserSender]}>
                    {isCurrentUser ? 'You' : item.employee_name}
                </Text>
                <View style={styles.bubbleAndTimeContainer}>
                    {isCurrentUser && <Text style={[styles.messageTime, styles.currentUserTime]}>{timeInGMT7}</Text>}
                    <View
                        style={[
                            styles.messageBubble,
                            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
                        ]}
                    >
                        <Text
                            style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}
                        >
                            {item.message}
                        </Text>
                    </View>
                    {!isCurrentUser && <Text style={[styles.messageTime, styles.otherUserTime]}>{timeInGMT7}</Text>}
                </View>
                {item.status === 'sending' && (
                    <Ionicons name="time-outline" size={12} color="#777" style={styles.sendingIcon} />
                )}
            </View>
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
                        <TouchableOpacity style={styles.backButton}>
                            <Ionicons name="arrow-back" color="#fff" size={28} />
                        </TouchableOpacity>
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.header}>{taskDetails.title || 'Task Title'}</Text>
                            <Text style={styles.subHeader}>Kejartugas</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageContainerStyle}
                ListHeaderComponent={() => <Text style={styles.dateLabel}>Hari Ini</Text>}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />

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
        height: 110,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
        paddingTop: 40, // Adjust this value to give more space for the header
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
        marginBottom: 5, // Reduced margin to pull the text up
    },
    header: {
        fontSize: 20, // Slightly larger font size
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 2, // Spacing between title and subtitle
    },
    subHeader: {
        color: '#dfefff',
        fontSize: 12, // Slightly smaller font size
        marginTop: 0, // Removed top margin to keep it close to the header
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
        marginBottom: 10,
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
});

export default ChatInterface;
