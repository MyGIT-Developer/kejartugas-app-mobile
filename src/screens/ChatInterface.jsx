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
const GEMINI_API_KEY = 'AIzaSyD6yJ5P7HXcH-R9-YWzU6JHsolVLcEN8Ms';
const GEMINI_MODELS = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
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
    const geminiModeAnim = useRef(new Animated.Value(0)).current;

    // Refs
    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    // Memoized values for better performance
    const headerTitle = useMemo(() => {
        return isGeminiMode ? 'Gemini AI Chat' : taskDetails.title || 'Task Chat';
    }, [isGeminiMode, taskDetails.title]);

    const headerSubtitle = useMemo(() => {
        return isGeminiMode ? '🤖 AI Assistant siap membantu!' : taskDetails.subtitle || 'Diskusi Task';
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

    // Gemini AI integration with better error handling and fallback
    const callGeminiAPI = useCallback(async (prompt) => {
        const tryWithModel = async (modelName) => {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;

            console.log(`Trying Gemini API with model: ${modelName}`);
            console.log('API URL:', apiUrl);

            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1024,
                },
                safetySettings: [
                    {
                        category: 'HARM_CATEGORY_HARASSMENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                    },
                    {
                        category: 'HARM_CATEGORY_HATE_SPEECH',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                    },
                    {
                        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                    },
                    {
                        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
                    },
                ],
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            console.log(`${modelName} response status:`, response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`${modelName} API Error Response:`, errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log(`${modelName} API Response:`, JSON.stringify(data, null, 2));

            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!generatedText) {
                console.error(`No text generated from ${modelName} API response:`, data);
                throw new Error('No content generated');
            }

            return generatedText;
        };

        // Try each model in sequence
        for (const model of GEMINI_MODELS) {
            try {
                const result = await tryWithModel(model);
                console.log(`Successfully got response from ${model}`);
                return result;
            } catch (error) {
                console.warn(`Failed to get response from ${model}:`, error.message);
                // Continue to next model
            }
        }

        // If all models fail, throw a comprehensive error
        console.error('All Gemini models failed');
        throw new Error(
            'Maaf, layanan Gemini AI sedang tidak tersedia. Silakan coba lagi nanti atau gunakan chat biasa.',
        );
    }, []);

    // Enhanced send message handler
    const handleSend = useCallback(async () => {
        if (!canSendMessage) return;

        const trimmedInput = inputText.trim();

        // Handle special commands
        if (trimmedInput === '/gemini' && !isGeminiMode) {
            console.log('Activating Gemini mode...');
            setIsGeminiMode(true);
            setWaitingForYesNo(true);
            const geminiMessage = {
                id: Date.now().toString(),
                message: `🤖 **Halo! Saya Gemini AI Assistant**\n\nSaya siap membantu Anda dengan tugas **"${taskDetails.title}"**\n\n✨ **Saya bisa membantu:**\n• Memberikan panduan langkah demi langkah\n• Menjawab pertanyaan teknis\n• Memberikan tips dan best practices\n• Membantu troubleshooting masalah\n\n❓ **Apakah Anda ingin saya berikan panduan detail untuk menyelesaikan tugas ini?**\n\n💡 *Ketik "ya" untuk panduan detail, atau langsung tanyakan apa yang ingin Anda ketahui*`,
                employee_name: 'Gemini AI',
                employee_id: MESSAGE_TYPES.GEMINI,
                time: new Date().toISOString(),
                status: 'sent',
                type: MESSAGE_TYPES.GEMINI,
            };
            console.log('Adding Gemini message:', geminiMessage);
            setMessages((prev) => [...prev, geminiMessage]);
            setInputText('');
            return;
        }

        if (trimmedInput === '/quit' && isGeminiMode) {
            setIsGeminiMode(false);
            setWaitingForYesNo(false);
            const quitMessage = {
                id: Date.now().toString(),
                message:
                    '👋 **Terima kasih telah menggunakan Gemini AI!**\n\n✅ Sesi AI telah berakhir dan Anda kembali ke mode chat normal.\n\n💬 Silakan lanjutkan diskusi dengan tim atau aktifkan kembali Gemini AI kapan saja dengan tombol 💡 di header.',
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

            if (isGeminiMode) {
                // For Gemini mode, show a user-friendly fallback message
                Alert.alert(
                    'Gemini AI Tidak Tersedia',
                    'Maaf, layanan Gemini AI sedang tidak tersedia. Pesan fallback telah ditambahkan ke chat.',
                    [{ text: 'OK' }],
                );
            } else {
                // For regular mode, show the original error
                Alert.alert('Error', 'Gagal mengirim pesan. Silakan coba lagi.');
                setMessages((prev) =>
                    prev.map((msg) => (msg.id === newMessage.id ? { ...msg, status: 'failed' } : msg)),
                );
            }
        } finally {
            setSending(false);
        }
    }, [canSendMessage, inputText, isGeminiMode, waitingForYesNo, taskDetails.title, employeeId]);

    // Handle Gemini AI messages with fallback
    const handleGeminiMessage = useCallback(
        async (input, userMessage) => {
            console.log('Handling Gemini message:', input);

            if (waitingForYesNo) {
                if (
                    input.toLowerCase().includes('ya') ||
                    input.toLowerCase().includes('iya') ||
                    input.toLowerCase().includes('yes')
                ) {
                    setWaitingForYesNo(false);
                    const prompt = `Kamu adalah asisten AI bernama Gemini yang KHUSUS membantu dengan tugas "${
                        taskDetails.title
                    }".

${taskDetails.subtitle ? `Konteks tambahan: ${taskDetails.subtitle}` : ''}

TUGAS: Berikan panduan detail langkah demi langkah KHUSUS untuk menyelesaikan tugas "${taskDetails.title}".

ATURAN:
- Fokus 100% pada tugas "${taskDetails.title}" saja
- Berikan langkah praktis yang spesifik untuk tugas ini
- Jangan berikan informasi umum atau tidak relevan
- Maksimal 350 kata

FORMAT RESPONS WAJIB:
🎯 **Panduan Menyelesaikan "${taskDetails.title}"**

📋 **Langkah-langkah Detail:**
1. **[Langkah Spesifik 1]** - Penjelasan detail untuk tugas ini
2. **[Langkah Spesifik 2]** - Penjelasan detail untuk tugas ini  
3. **[Langkah Spesifik 3]** - Penjelasan detail untuk tugas ini
4. **[dst...]** - Sesuai kebutuhan tugas

💡 **Tips Khusus untuk Tugas Ini:**
• Tip spesifik 1 untuk "${taskDetails.title}"
• Tip spesifik 2 untuk "${taskDetails.title}"

⚠️ **Hal Penting untuk Tugas Ini:**
• Warning/catatan khusus yang relevan

⏱️ **Estimasi Waktu:** [jika bisa diperkirakan]

✅ **Hasil Akhir:** Apa yang akan dicapai setelah tugas selesai

Pastikan semua poin di atas spesifik untuk tugas "${taskDetails.title}" dan bukan panduan umum.`;

                    try {
                        console.log('Trying to call Gemini API for yes/no response...');
                        const geminiResponse = await callGeminiAPI(prompt);

                        // Clean the response
                        const cleanResponse = geminiResponse.replace(/\n\n+/g, '\n\n').trim();

                        const geminiMessage = {
                            id: Date.now().toString(),
                            message: cleanResponse,
                            employee_name: 'Gemini AI',
                            employee_id: MESSAGE_TYPES.GEMINI,
                            time: new Date().toISOString(),
                            status: 'sent',
                            type: MESSAGE_TYPES.GEMINI,
                        };

                        setMessages((prev) => [...prev, geminiMessage]);
                    } catch (error) {
                        console.log('Gemini API failed, showing fallback message...');
                        // Enhanced fallback response if API fails
                        const fallbackMessage = {
                            id: Date.now().toString(),
                            message: `🤖 **Panduan Menyelesaikan "${taskDetails.title}"**\n\nMaaf, koneksi ke AI sedang terganggu, namun saya dapat memberikan panduan umum:\n\n📋 **Langkah-langkah Umum:**\n1. **Analisis Tugas** - Pahami requirement dan tujuan\n2. **Perencanaan** - Buat timeline dan breakdown task\n3. **Persiapan** - Siapkan tools dan resource yang dibutuhkan\n4. **Eksekusi** - Mulai dengan prioritas tertinggi\n5. **Review & Testing** - Periksa hasil dan lakukan testing\n6. **Dokumentasi** - Catat proses dan hasil\n\n⚠️ **Tips Penting:**\n• Komunikasi rutin dengan tim\n• Backup data secara berkala\n• Minta feedback di tahap awal\n• Dokumentasikan kendala yang ditemui\n\n⏱️ **Estimasi:** Sesuaikan dengan kompleksitas task\n\n💬 Silakan diskusikan detail lebih lanjut dengan tim melalui chat biasa atau coba tanya saya lagi nanti.`,
                            employee_name: 'Gemini AI (Offline)',
                            employee_id: MESSAGE_TYPES.GEMINI,
                            time: new Date().toISOString(),
                            status: 'sent',
                            type: MESSAGE_TYPES.GEMINI,
                        };
                        setMessages((prev) => [...prev, fallbackMessage]);
                    }
                    return;
                } else if (input.toLowerCase().includes('tidak') || input.toLowerCase().includes('no')) {
                    setWaitingForYesNo(false);
                    const noMessage = {
                        id: Date.now().toString(),
                        message: `👌 **Tidak apa-apa!**\n\nSilakan tanyakan apa saja yang ingin Anda ketahui tentang **"${taskDetails.title}"** atau topik lainnya.\n\n💡 **Contoh pertanyaan:**\n• "Bagaimana cara memulai tugas ini?"\n• "Apa tools yang dibutuhkan?"\n• "Berapa estimasi waktu pengerjaannya?"\n• "Ada tips khusus untuk tugas ini?"\n\n🔄 Atau ketik "/quit" untuk kembali ke chat biasa.`,
                        employee_name: 'Gemini AI',
                        employee_id: MESSAGE_TYPES.GEMINI,
                        time: new Date().toISOString(),
                        status: 'sent',
                        type: MESSAGE_TYPES.GEMINI,
                    };
                    setMessages((prev) => [...prev, noMessage]);
                    return;
                }
                setWaitingForYesNo(false);
            }

            // Regular Gemini conversation
            try {
                console.log('Trying to call Gemini API for regular conversation...');

                // Create a more contextual prompt for better AI responses
                const contextualPrompt = `Kamu adalah asisten AI bernama Gemini yang KHUSUS membantu dalam tugas "${
                    taskDetails.title
                }" ${taskDetails.subtitle ? `dengan konteks: ${taskDetails.subtitle}` : ''}.

Pertanyaan user: "${input}"

ATURAN PENTING:
- HANYA jawab pertanyaan yang berkaitan dengan tugas "${taskDetails.title}"
- Jika pertanyaan tidak berkaitan dengan tugas ini, tolak dengan sopan dan arahkan kembali ke topik tugas
- Fokus pada aspek teknis, langkah-langkah, tools, atau solusi untuk tugas ini
- Jangan jawab pertanyaan umum, pribadi, atau topik lain di luar tugas

INSTRUKSI RESPONS (hanya untuk pertanyaan terkait tugas):
1. Jawab dalam bahasa Indonesia yang natural dan profesional
2. Berikan jawaban yang praktis dan dapat ditindaklanjuti untuk tugas ini
3. Gunakan format yang mudah dibaca dengan bullet points atau numbering
4. Maksimal 250 kata agar tidak terlalu panjang
5. Sertakan emoji yang relevan untuk tugas/proyek
6. Selalu kaitkan dengan konteks tugas "${taskDetails.title}"

CONTOH PENOLAKAN (untuk pertanyaan tidak terkait):
"🤖 Maaf, saya khusus membantu dengan tugas **"${taskDetails.title}"**. 

Silakan tanyakan hal-hal seperti:
• Bagaimana cara mengerjakan tugas ini?
• Tools apa yang dibutuhkan?
• Langkah-langkah detail pengerjaan
• Tips dan best practices untuk tugas ini

Atau ketik '/quit' untuk kembali ke chat biasa."

FORMAT RESPONS YANG BAIK (untuk pertanyaan terkait tugas):
"💡 **Jawaban untuk "${taskDetails.title}"**

📝 **Langkah/Solusi:**
• Langkah 1 spesifik untuk tugas ini
• Langkah 2 spesifik untuk tugas ini

💡 **Tips untuk tugas ini:** Saran praktis yang relevan"`;

                const geminiResponse = await callGeminiAPI(contextualPrompt);

                // Clean and format the response better
                let formattedResponse = geminiResponse
                    .replace(/\*\*(.*?)\*\*/g, '**$1**') // Keep bold formatting
                    .replace(/\n\n+/g, '\n\n') // Clean multiple line breaks
                    .replace(/^\s+|\s+$/g, '') // Trim whitespace
                    .trim();

                // Don't add extra emoji if response already has good formatting
                if (!formattedResponse.match(/[🎯💡✅🔧⚡🚀📋💬👍📝]/)) {
                    formattedResponse = `💡 ${formattedResponse}`;
                }

                const geminiMessage = {
                    id: Date.now().toString(),
                    message: formattedResponse,
                    employee_name: 'Gemini AI',
                    employee_id: MESSAGE_TYPES.GEMINI,
                    time: new Date().toISOString(),
                    status: 'sent',
                    type: MESSAGE_TYPES.GEMINI,
                };

                setMessages((prev) => [...prev, geminiMessage]);
            } catch (error) {
                console.log('Gemini API failed for regular conversation, showing fallback...');
                // Enhanced fallback response for general conversation
                const fallbackMessage = {
                    id: Date.now().toString(),
                    message: `🤖 **Maaf, koneksi AI sedang terganggu**\n\nSaya sedang mengalami kendala teknis dan tidak dapat memproses pertanyaan Anda saat ini.\n\n❓ **Pertanyaan Anda:** "${input}"\n\n🔄 **Alternatif yang bisa dilakukan:**\n• Coba tanya saya lagi dalam beberapa menit\n• Diskusikan dengan tim melalui chat biasa\n• Keluar dari mode Gemini dengan tombol 💡 atau ketik '/quit'\n\n💡 **Tip:** Untuk hasil terbaik, tanyakan hal-hal spesifik terkait "${taskDetails.title}" kepada saya.`,
                    employee_name: 'Gemini AI (Offline)',
                    employee_id: MESSAGE_TYPES.GEMINI,
                    time: new Date().toISOString(),
                    status: 'sent',
                    type: MESSAGE_TYPES.GEMINI,
                };
                setMessages((prev) => [...prev, fallbackMessage]);
            }
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
            console.log('Checking message type for:', item.employee_id, 'Gemini type:', MESSAGE_TYPES.GEMINI);
            if (item.employee_id === MESSAGE_TYPES.GEMINI) return MESSAGE_TYPES.GEMINI;
            if (item.employee_id === MESSAGE_TYPES.SYSTEM) return MESSAGE_TYPES.SYSTEM;
            if (item.employee_id === MESSAGE_TYPES.USER) return MESSAGE_TYPES.USER;
            if (item.employee_id === employeeId) return MESSAGE_TYPES.USER;
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
                                    isGemini && styles.geminiSenderName,
                                ]}
                            >
                                {isGemini ? '🤖 ' : ''}
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

    // Toggle Gemini mode function
    const toggleGeminiMode = useCallback(() => {
        if (isGeminiMode) {
            // Exit Gemini mode
            Animated.timing(geminiModeAnim, {
                toValue: 0,
                duration: ANIMATION_DURATION,
                useNativeDriver: false,
            }).start();

            setIsGeminiMode(false);
            setWaitingForYesNo(false);
            const quitMessage = {
                id: Date.now().toString(),
                message:
                    '👋 **Terima kasih telah menggunakan Gemini AI!**\n\n✅ Sesi AI telah berakhir dan Anda kembali ke mode chat normal.\n\n💬 Silakan lanjutkan diskusi dengan tim atau aktifkan kembali Gemini AI kapan saja dengan tombol 💡 di header.',
                employee_name: 'System',
                employee_id: MESSAGE_TYPES.SYSTEM,
                time: new Date().toISOString(),
                status: 'sent',
                type: MESSAGE_TYPES.SYSTEM,
            };
            setMessages((prev) => [...prev, quitMessage]);
        } else {
            // Enter Gemini mode
            Animated.timing(geminiModeAnim, {
                toValue: 1,
                duration: ANIMATION_DURATION,
                useNativeDriver: false,
            }).start();

            console.log('Activating Gemini mode via lamp button...');
            setIsGeminiMode(true);
            setWaitingForYesNo(true);
            const geminiMessage = {
                id: Date.now().toString(),
                message: `🤖 **Halo! Saya Gemini AI Assistant**\n\nSaya siap membantu Anda dengan tugas **"${taskDetails.title}"**\n\n✨ **Saya bisa membantu:**\n• Memberikan panduan langkah demi langkah\n• Menjawab pertanyaan teknis\n• Memberikan tips dan best practices\n• Membantu troubleshooting masalah\n\n❓ **Apakah Anda ingin saya berikan panduan detail untuk menyelesaikan tugas ini?**\n\n💡 *Ketik "ya" untuk panduan detail, atau langsung tanyakan apa yang ingin Anda ketahui*`,
                employee_name: 'Gemini AI',
                employee_id: MESSAGE_TYPES.GEMINI,
                time: new Date().toISOString(),
                status: 'sent',
                type: MESSAGE_TYPES.GEMINI,
            };
            console.log('Adding Gemini message via lamp button:', geminiMessage);
            setMessages((prev) => [...prev, geminiMessage]);
        }
    }, [isGeminiMode, taskDetails.title, geminiModeAnim]);

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
                </View>
                <TouchableOpacity
                    onPress={toggleGeminiMode}
                    style={[styles.geminiButton, isGeminiMode && styles.geminiButtonActive]}
                >
                    <Ionicons
                        name={isGeminiMode ? 'bulb' : 'bulb-outline'}
                        size={24}
                        color={isGeminiMode ? '#FFF' : 'rgba(255, 255, 255, 0.8)'}
                    />
                </TouchableOpacity>
            </LinearGradient>
        );
    }, [isGeminiMode, headerTitle, handleBackPress, toggleGeminiMode]);

    return (
        <SafeAreaView style={[styles.container, isGeminiMode && styles.geminiContainer]}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={isGeminiMode ? '#4285F4' : '#4A90E2'}
                translucent={false}
            />

            {/* Enhanced Header */}
            <View style={[styles.header, isGeminiMode && styles.geminiHeader]}>{renderHeader}</View>

            {/* Gemini Mode Indicator */}
            {isGeminiMode && (
                <Animated.View
                    style={[
                        styles.geminiModeIndicator,
                        {
                            opacity: geminiModeAnim,
                            transform: [
                                {
                                    translateY: geminiModeAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-40, 0],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <Ionicons name="bulb" size={16} color="#4285F4" />
                    <Text style={styles.geminiModeText}>Mode Gemini AI Aktif</Text>
                    <TouchableOpacity onPress={toggleGeminiMode} style={styles.geminiModeCloseButton}>
                        <Ionicons name="close-circle" size={18} color="#6B7280" />
                    </TouchableOpacity>
                </Animated.View>
            )}

            {/* Messages List */}
            <KeyboardAvoidingView
                style={[styles.messagesContainer, isGeminiMode && styles.geminiMessagesContainer]}
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
                        isGeminiMode && styles.geminiInputContainer,
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
                                isGeminiMode
                                    ? "🤖 Tanya Gemini AI tentang task ini... (ketik '/quit' untuk keluar)"
                                    : 'Ketik pesan Anda...'
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
    geminiContainer: {
        backgroundColor: '#F0F4FF',
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
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
    },
    geminiHeader: {
        backgroundColor: '#4285F4',
        elevation: 6,
        shadowOpacity: 0.15,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
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
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: FONTS.semiBold,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    geminiButton: {
        marginLeft: 16,
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    geminiButtonActive: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    geminiModeIndicator: {
        backgroundColor: '#E8F0FE',
        borderBottomWidth: 2,
        borderBottomColor: '#4285F4',
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#4285F4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    geminiModeText: {
        fontSize: 13,
        fontFamily: FONTS.semiBold,
        color: '#4285F4',
        flex: 1,
        textAlign: 'center',
        marginLeft: 20,
    },
    geminiModeCloseButton: {
        padding: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
    },
    messagesContainer: {
        flex: 1,
    },
    geminiMessagesContainer: {
        backgroundColor: '#F0F4FF',
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
    geminiSenderName: {
        color: '#4285F4',
        fontFamily: FONTS.semiBold,
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
        backgroundColor: '#E8F0FE',
        borderWidth: 2,
        borderColor: '#4285F4',
        alignSelf: 'flex-start',
        shadowColor: '#4285F4',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    systemBubble: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#F59E0B',
        alignSelf: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
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
        fontFamily: FONTS.regular,
        lineHeight: 24,
        fontSize: 15,
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
    geminiInputContainer: {
        backgroundColor: '#E8F0FE',
        borderTopColor: '#4285F4',
        borderTopWidth: 3,
        elevation: 12,
        shadowColor: '#4285F4',
        shadowOpacity: 0.2,
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
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        shadowColor: '#4285F4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
        elevation: 6,
        shadowColor: '#4285F4',
        shadowOpacity: 0.35,
        transform: [{ scale: 1.05 }],
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
