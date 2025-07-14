# 📱 Kejar Tugas - Mobile Task Management App

<div align="center">
  <img src="./assets/images/kt-512.png" alt="Kejar Tugas Logo" width="150" height="150">
  
  [![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)](https://github.com/MyGIT-Developer/kejartugas-app-mobile)
  [![React Native](https://img.shields.io/badge/React%20Native-0.79.5-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-53.0.19-blue.svg)](https://expo.dev/)
  [![License](https://img.shields.io/badge/license-Private-red.svg)](LICENSE)

**Solusi manajemen tugas yang powerful dan user-friendly untuk meningkatkan produktivitas tim Anda!**

</div>

---

## ✨ Fitur Utama

🎯 **Task Management**

-   ✅ Manajemen tugas adhoc dan project-based
-   📊 Dashboard analytics dengan visualisasi data
-   📅 Penjadwalan dan tracking deadline
-   🔄 Real-time task updates

👥 **Team Collaboration**

-   👤 Multi-user support dengan role management
-   💬 Notifikasi push untuk update tugas
-   📱 Interface yang responsif dan intuitif
-   🎨 Modern UI dengan animasi yang smooth

📍 **Location & Attendance**

-   🗺️ GPS tracking untuk absensi
-   📸 Photo capture untuk dokumentasi
-   ⏰ Time tracking otomatis
-   📊 Laporan kehadiran

🔐 **Security & Authentication**

-   🔑 JWT-based authentication
-   🛡️ Secure API communication
-   📱 Biometric authentication support

## 🛠️ Tech Stack

| Technology             | Version | Purpose                            |
| ---------------------- | ------- | ---------------------------------- |
| **React Native**       | 0.79.5  | Cross-platform mobile development  |
| **Expo**               | 53.0.19 | Development platform & build tools |
| **React Navigation**   | 6.x     | Navigation & routing               |
| **Axios**              | 1.7.5   | HTTP client for API calls          |
| **React Native Paper** | 5.12.5  | Material Design components         |
| **Lottie**             | 7.2.2   | Beautiful animations               |
| **React Native Maps**  | 1.20.1  | Map integration                    |
| **Chart Kit**          | 6.12.0  | Data visualization                 |

## 📱 Screenshots

<div align="center">
  <img src="./assets/images/kt_splash_screen.png" alt="Splash Screen" width="200">
  <!-- Add more screenshots here -->
</div>

## 🚀 Quick Start

### Prerequisites

Pastikan Anda memiliki:

-   [Node.js](https://nodejs.org/) (versi 16 atau lebih baru)
-   [Expo CLI](https://docs.expo.dev/get-started/installation/)
-   [Git](https://git-scm.com/)

### Installation

1. **Clone repository**

    ```bash
    git clone https://github.com/MyGIT-Developer/kejartugas-app-mobile.git
    cd kejartugas-app-mobile
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Setup environment**

    ```bash
    # Copy environment template
    cp .env.example .env.local

    # Edit .env.local dengan konfigurasi API Anda
    ```

4. **Start development server**

    ```bash
    npm start
    ```

5. **Run on device/simulator**

    ```bash
    # Android
    npm run android

    # iOS
    npm run ios

    # Web (development only)
    npm run web
    ```

## 📁 Project Structure

```
kejartugas-app-mobile/
├── 📂 src/
│   ├── 📂 api/           # API service layer
│   ├── 📂 components/    # Reusable components
│   ├── 📂 constants/     # App constants
│   ├── 📂 hooks/         # Custom React hooks
│   ├── 📂 navigation/    # Navigation configuration
│   ├── 📂 screens/       # Screen components
│   └── 📂 utils/         # Utility functions
├── 📂 assets/
│   ├── 📂 animations/    # Lottie animations
│   ├── 📂 fonts/         # Custom fonts (Poppins)
│   ├── 📂 icon/          # Icon components
│   └── 📂 images/        # Static images
├── 📄 App.js            # Main app component
├── 📄 app.json          # Expo configuration
└── 📄 package.json      # Dependencies
```

## 🔧 Development

### Available Scripts

| Command           | Description                    |
| ----------------- | ------------------------------ |
| `npm start`       | Start Expo development server  |
| `npm run android` | Run on Android device/emulator |
| `npm run ios`     | Run on iOS device/simulator    |
| `npm run web`     | Run web version (development)  |

### Key Components

-   **📊 Dashboard**: Real-time analytics dan overview
-   **📋 Task Management**: CRUD operations untuk tugas
-   **👤 User Management**: Authentication dan profile
-   **📍 Location Services**: GPS tracking dan maps
-   **📱 Notifications**: Push notifications untuk updates
-   **📊 Charts**: Visualisasi data dengan Chart Kit

## 🎨 Design System

### Colors

-   **Primary**: #0E509E (Blue)
-   **Background**: #FFFFFF (White)
-   **Success**: #4CAF50 (Green)
-   **Warning**: #FF9800 (Orange)
-   **Error**: #F44336 (Red)

### Typography

-   **Font Family**: Poppins (Regular, Medium, SemiBold, Bold)
-   **Sizes**: 12px - 32px scale

### Animations

-   Lottie animations untuk loading states
-   Smooth transitions dengan React Native Animatable
-   Haptic feedback untuk better UX

## 📋 API Integration

Aplikasi ini mengintegrasikan dengan backend API untuk:

-   🔐 Authentication & authorization
-   📋 Task management operations
-   👤 User profile management
-   📊 Analytics & reporting
-   📱 Push notifications
-   📍 Location tracking

## 🤝 Contributing

1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📄 License

Project ini bersifat private. Unauthorized copying atau distribution dilarang.

## 👨‍💻 Developer

Dikembangkan dengan ❤️ oleh [MyGIT Developer](https://github.com/MyGIT-Developer)

---

<div align="center">
  <p>⭐ Jika project ini membantu, jangan lupa berikan star!</p>
  
  **Happy Coding! 🚀**
</div>
