import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    ScrollView,
    Animated,
    PanResponder,
} from 'react-native';
import { useFonts } from '../utils/UseFonts'; // Import the useFonts hook

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fungsi untuk menghitung ukuran font responsif
const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375; // 375 adalah lebar base untuk iPhone X
    return Math.round(size * scale);
};

const AdhocModalDetail = ({
    visible,
    onClose,
    title = 'Judul Modal', // Default title
    children, // Custom content to be rendered
    customButtonText = 'Tutup', // Default button text changed to 'Tutup'
    showChatButton = false, // Prop untuk menampilkan tombol chat
    onChatPress, // Fungsi untuk handle chat
}) => {
    const fontsLoaded = useFonts();
    const modalY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const modalOpacity = useRef(new Animated.Value(0)).current;

    // Pan responder untuk drag gesture - hanya untuk handle area
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => {
                // Hanya aktif jika gesture dimulai dari area handle (bagian atas modal)
                return evt.nativeEvent.locationY < 60;
            },
            onMoveShouldSetPanResponder: (evt, gestureState) => {
                // Hanya set responder jika:
                // 1. Gesture dimulai dari area handle
                // 2. Movement lebih besar dari threshold
                return evt.nativeEvent.locationY < 60 && Math.abs(gestureState.dy) > 10;
            },
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dy > 0) {
                    modalY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dy > 150 || gestureState.vy > 0.5) {
                    handleClose();
                } else {
                    Animated.spring(modalY, {
                        toValue: 0,
                        useNativeDriver: true,
                        bounciness: 8,
                        speed: 12,
                    }).start();
                }
            },
        }),
    ).current;

    // Animation for modal show/hide - mengikuti pattern DraggableModalTask dengan easing yang smooth
    useEffect(() => {
        if (visible) {
            // Reset position
            modalY.setValue(SCREEN_HEIGHT);
            modalOpacity.setValue(0);

            // Animate in dengan easing yang smooth seperti DraggableModalTask
            Animated.parallel([
                Animated.timing(modalOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(modalY, {
                    toValue: 0,
                    useNativeDriver: true,
                    bounciness: 8,
                    speed: 12,
                }),
            ]).start();
        } else {
            // Animate out
            Animated.parallel([
                Animated.timing(modalOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(modalY, {
                    toValue: SCREEN_HEIGHT,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    // Enhanced close function with smooth animation seperti DraggableModalTask
    const handleClose = () => {
        Animated.parallel([
            Animated.timing(modalOpacity, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }),
            Animated.timing(modalY, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            if (finished) {
                onClose();
            }
        });
    };

    if (!fontsLoaded) {
        return null;
    }

    return (
        <Modal transparent={true} visible={visible} onRequestClose={handleClose} animationType="none">
            <Animated.View
                style={[
                    styles.modalContainer,
                    {
                        opacity: modalOpacity,
                    },
                ]}
            >
                <TouchableOpacity style={styles.overlay} onPress={handleClose} activeOpacity={1} />
                <Animated.View
                    style={[
                        styles.bottomSheetContainer,
                        {
                            transform: [{ translateY: modalY }],
                        },
                    ]}
                >
                    <View style={styles.bottomSheet}>
                        {/* Handle bar yang lebih responsive untuk drag - Area khusus untuk gesture */}
                        <View style={styles.handleContainer} {...panResponder.panHandlers}>
                            <View style={styles.handle} />
                        </View>

                        <ScrollView
                            style={styles.content}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            bounces={true}
                            nestedScrollEnabled={true}
                        >
                            <Text style={styles.title}>{title}</Text>
                            <View style={styles.contentContainer}>{children}</View>
                        </ScrollView>

                        {/* Tombol Chat & Selesai sejajar */}
                        <View style={styles.buttonRow}>
                            {showChatButton ? (
                                <>
                                    {/* Tombol Chat */}
                                    <TouchableOpacity style={styles.chatButtonFlex} onPress={onChatPress}>
                                        <Text style={styles.chatButtonText}>Chat Tugas</Text>
                                    </TouchableOpacity>
                                    {/* Tombol Selesai */}
                                    <TouchableOpacity style={styles.buttonFlex} onPress={handleClose}>
                                        <Text style={styles.buttonText}>Selesai</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                // Default: hanya tombol selesai
                                <TouchableOpacity style={styles.buttonFlex} onPress={handleClose}>
                                    <Text style={styles.buttonText}>Selesai</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    bottomSheetContainer: {
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: SCREEN_HEIGHT * 0.85,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
        paddingHorizontal: 24,
        cursor: 'grab',
        minHeight: 40, // Ensure adequate touch area
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#D1D5DB',
        borderRadius: 2,
        marginBottom: 4,
    },
    content: {
        paddingHorizontal: 24,
        paddingTop: 8,
        flex: 1, // Allow flex growth
        maxHeight: SCREEN_HEIGHT * 0.6, // Adjusted for better scrolling
    },
    contentContainer: {
        paddingBottom: 20,
    },
    title: {
        fontSize: calculateFontSize(20),
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
        fontFamily: 'Poppins-Bold',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    buttonFlex: {
        flex: 1,
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 120,
        maxWidth: 180,
        marginLeft: 0,
        marginRight: 0,
        shadowColor: '#4A90E2',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontSize: calculateFontSize(14),
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: 0.3,
    },
    chatButtonFlex: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#4A90E2',
        paddingVertical: 12,
        alignItems: 'center',
        minWidth: 120,
        maxWidth: 180,
        marginLeft: 0,
        marginRight: 0,
        shadowColor: '#4A90E2',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    chatButtonText: {
        color: '#4A90E2',
        fontSize: calculateFontSize(14),
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600',
    },
});

export default AdhocModalDetail;
