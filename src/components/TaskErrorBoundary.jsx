import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

class TaskErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('TaskErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.iconContainer}>
                        <MaterialIcons name="error-outline" size={64} color="#FF6B6B" />
                    </View>
                    <Text style={styles.title}>Oops! Terjadi Kesalahan</Text>
                    <Text style={styles.message}>
                        Aplikasi mengalami masalah tak terduga.{'\n'}
                        Silakan coba muat ulang halaman.
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => this.setState({ hasError: false, error: null })}
                    >
                        <Text style={styles.retryText}>Coba Lagi</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F0F0F0',
    },
    iconContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 30,
    },
    retryButton: {
        backgroundColor: '#0E509E',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
    },
});

export default TaskErrorBoundary;
