import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

const WebViewScreen = ({ route, navigation }) => {
    const nav = useNavigation();
    const { url, title } = route.params || {};

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerShown: true,
            title: title || 'Web',
            headerLeft: () => (
                <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={24} color="#0056b3" />
                </TouchableOpacity>
            ),
        });
    }, [navigation, title]);

    return (
        <View style={styles.container}>
            <View style={styles.infoBanner}>
                <Feather name="info" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                <Text style={styles.infoText}>
                    Anda sedang membuka web <Text style={{ fontWeight: 'bold' }}>app.kejartugas.com</Text> untuk
                    melakukan pendaftaran akun. Jika sudah selesai, silakan klik tombol{' '}
                    <Text style={{ fontWeight: 'bold' }}>Back</Text> di kiri atas untuk kembali ke halaman login
                    aplikasi.
                </Text>
            </View>
            <WebView
                source={{ uri: url }}
                startInLoadingState
                javaScriptEnabled
                domStorageEnabled
                style={{ flex: 1 }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? 0 : 0,
    },
    infoBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#DBEAFE',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#BFDBFE',
    },
    infoText: {
        color: '#2563EB',
        fontSize: 13,
        flex: 1,
    },
});

export default WebViewScreen;
