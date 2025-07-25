import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    RefreshControl,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Animated,
    Modal
} from 'react-native';
import CheckBox from '@react-native-community/checkbox'; // External CheckBox component
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { Feather } from '@expo/vector-icons';
import { CreateProject, UpdateProject } from '../api/projectTask';
import { getEmployeeByCompany, getTeamsByCompany } from '../api/general';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon library
import { FONTS } from '../constants/fonts';


const ProjectForm = () => {
    const route = useRoute();
    const { mode = 'create', initialProjectData = null } = route.params;
    const [companyId, setCompanyId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [jobsId, setJobsId] = useState('');
    const [roleId, setRoleId] = useState('');
    const navigation = useNavigation();
    const [formData, setFormData] = useState({
        company_id: companyId,
        project_name: initialProjectData?.project_name || '',
        role_id: initialProjectData?.role_id || jobsId,
        jobs_id: initialProjectData?.jobs_id || jobsId,
        team_id: initialProjectData?.team_id || '',
        assign_by: initialProjectData?.assign_by || employeeId,
        assign_to: initialProjectData?.assignedEmployees.map(employee => employee.id) || [],
        start_date: initialProjectData?.start_date ? new Date(initialProjectData.start_date) : new Date(),
        end_date: initialProjectData?.end_date ? new Date(initialProjectData.end_date) : new Date(),
        project_desc: initialProjectData?.project_desc || '',
        project_type: initialProjectData?.project_type || '',
    });
    const [employees, setEmployees] = useState([]);
    const [teams, setTeams] = useState([]);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [availableEmployees, setAvailableEmployees] = useState([]);

    useEffect(() => {
        if (employees.length > 0) {
            setAvailableEmployees(
                employees.filter((emp) => !formData.assign_to.includes(emp.id) && emp.id != employeeId),
            );
        }
    }, [employees, formData.assign_to, employeeId]);

    const updateFormField = (field, value) => {
        setFormData((prevData) => ({
            ...prevData,
            [field]: value,
        }));
    };

    const handleAssignByChange = (value) => {
        setFormData((prevData) => ({
            ...prevData,
            assign_by: value,
        }));
    };

    const handleAssignToChange = useCallback((value) => {
        setFormData((prevState) => {
            const updatedAssignTo = prevState.assign_to.includes(value)
                ? prevState.assign_to.filter((item) => item !== value)
                : [...prevState.assign_to, value];

            return { ...prevState, assign_to: updatedAssignTo };
        });
    }, []);

    useEffect(() => {
        const getData = async () => {
            try {
                const companyId = await AsyncStorage.getItem('companyId');
                const employeeId = await AsyncStorage.getItem('employeeId');
                const jobsId = await AsyncStorage.getItem('userJob');
                const roleId = await AsyncStorage.getItem('userRole');
                setCompanyId(companyId);
                setEmployeeId(employeeId);
                setJobsId(jobsId);
                setRoleId(roleId);
                setFormData((prev) => ({
                    ...prev,
                    company_id: companyId,
                    role_id: roleId,
                    jobs_id: jobsId,
                    assign_by: employeeId,
                }));
            } catch (error) {
                console.error('Error fetching AsyncStorage data:', error);
            }
        };
        getData();
    }, []);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const employees = await getEmployeeByCompany(companyId);
                setEmployees(employees);
            } catch (error) {
                console.error('Failed to fetch employees:', error);
            }
        };

        const fetchTeams = async () => {
            try {
                const teams = await getTeamsByCompany(companyId);
                setTeams(teams);
            } catch (error) {
                console.error('Failed to fetch teams:', error);
            }
        };

        if (companyId) {
            fetchEmployees();
            fetchTeams();
        }
    }, [companyId]);

    const handleDateChange = useCallback(
        (field, event, selectedDate) => {
            const currentDate = selectedDate || formData[field];
            setFormData((prevState) => ({ ...prevState, [field]: currentDate }));
            field === 'start_date' ? setShowStartPicker(false) : setShowEndPicker(false);
        },
        [formData],
    );

    const renderDatePicker = useCallback(
        (field, showPicker, setShowPicker) => (
            <View style={styles.fieldGroup}>
                <Text style={styles.labelText}>{field === 'start_date' ? 'Mulai' : 'Selesai'}</Text>
                <View>
                    <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePickerButton}>
                        <Feather name="calendar" size={24} color="#27A0CF" />
                        <TextInput
                            style={styles.dateInput}
                            placeholder="Pilih Tanggal"
                            value={
                                formData[field]
                                    ? formData[field].toLocaleDateString('id-ID', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })
                                    : ''
                            }
                            editable={false}
                        />

                    </TouchableOpacity>
                    {showPicker && (
                        <DateTimePicker
                            value={formData[field] || new Date()}
                            mode="date"
                            display="default"
                            borderRadius={25}
                            onChange={(event, selectedDate) => handleDateChange(field, event, selectedDate)}
                        />
                    )}
                </View>
            </View>
        ),
        [formData, handleDateChange],
    );

    const projectTypeOptions = useMemo(
        () => [
            { label: 'General', value: 'general' },
            { label: 'Maintenance', value: 'maintenance' },
        ],
        [],
    );

    const renderPicker = useCallback(
        (field, label, options) => {
            const [isModalVisible, setModalVisible] = useState(false);

            const handleSelect = (value) => {
                setModalVisible(false);
                if (field === 'assign_by') {
                    handleAssignByChange(value);
                } else {
                    updateFormField(field, value);
                }
            };

            const selectedLabel = options.find(opt => opt.value === formData[field])?.label || 'Select an option';

            return (
                <View style={styles.fieldGroup}>
                    {/* <Text style={styles.label}>{label}</Text> */}
                    <TouchableOpacity
                        style={styles.customPickerBox}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.selectedText}>{selectedLabel}</Text>
                    </TouchableOpacity>

                    <Modal visible={isModalVisible} animationType="slide" transparent={true} statusBarTranslucent={true}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>{label}</Text>
                                <FlatList
                                    data={options}
                                    keyExtractor={(item) => item.value.toString()}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.optionItem}
                                            onPress={() => handleSelect(item.value)}
                                        >
                                            <Text style={styles.optionText}>{item.label}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        onPress={() => setModalVisible(false)}
                                        style={styles.cancelButton}
                                    >
                                        <Text style={styles.cancelButtonText}>Batal</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </View>
            );
        },
        [formData, updateFormField]
    );

    const renderMultiPicker = useCallback(
        (label, description, isMulti = false) => {
            const [isModalVisible, setIsModalVisible] = useState(false);
            const [tempSelection, setTempSelection] = useState([...formData.assign_to]);

            const handleTempSelection = (employeeId) => {
                setTempSelection(prev =>
                    prev.includes(employeeId)
                        ? prev.filter(id => id !== employeeId)
                        : [...prev, employeeId]
                );
            };

            const handleSaveSelection = () => {
                // Apply temp selection to actual form data
                tempSelection.forEach(id => {
                    if (!formData.assign_to.includes(id)) {
                        handleAssignToChange(id);
                    }
                });
                formData.assign_to.forEach(id => {
                    if (!tempSelection.includes(id)) {
                        handleAssignToChange(id);
                    }
                });
                setIsModalVisible(false);
            };

            const handleCancelSelection = () => {
                setTempSelection([...formData.assign_to]);
                setIsModalVisible(false);
            };

            // Add search state to your component
            const [searchQuery, setSearchQuery] = useState('');

            // Filter function for employees based on search
            const filteredEmployees = useMemo(() => {
                if (!searchQuery.trim()) {
                    return availableEmployees;
                }

                return availableEmployees.filter(employee =>
                    employee.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    employee.job_name.toLowerCase().includes(searchQuery.toLowerCase())
                );
            }, [availableEmployees, searchQuery]);


            return (
                <View style={styles.fieldGroup}>
                    <View style={styles.labelContainer}>
                        <Feather name="users" size={18} color="#0E509E" />
                        <Text style={[styles.labelText, { marginLeft: 10 }]}>{label}</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                        {description}
                    </Text>

                    {/* Selection Trigger */}
                    <TouchableOpacity
                        style={styles.selectionTrigger}
                        onPress={() => setIsModalVisible(true)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.triggerLeft}>
                            <View style={styles.triggerIcon}>
                                <Feather name="user-plus" size={20} color="#0E509E" />
                            </View>
                            <View>
                                <Text style={styles.triggerTitle}>
                                    {formData.assign_to.length > 0
                                        ? `${formData.assign_to.length} Anggota Dipilih`
                                        : 'Pilih Anggota Tim'
                                    }
                                </Text>
                                {/* <Text style={styles.triggerSubtitle}>
                                    Tap untuk memilih dari {availableEmployees.length} karyawan
                                </Text> */}
                            </View>
                        </View>
                        <Feather name="chevron-right" size={24} color="#444" />
                    </TouchableOpacity>

                    {/* Selected Employees Display */}
                    {formData.assign_to.length > 0 && (
                        <View style={styles.selectedDisplay}>
                            <Text style={styles.selectedDisplayTitle}>Tim yang Dipilih:</Text>
                            <View style={styles.selectedContainer}>
                                {employees
                                    .filter((emp) => formData.assign_to.includes(emp.id))
                                    .map((emp) => (
                                        <View key={emp.id} style={styles.chip}>
                                            <Text style={styles.chipText}>
                                                {getInitials(emp.employee_name)} - {emp.employee_name.split(" ")[0]}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => handleAssignToChange(emp.id)}
                                                style={styles.removeButton}
                                            >
                                                <Text style={styles.removeButtonText}>×</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                            </View>

                        </View>
                    )}

                    {/* Modal */}
                    <Modal
                        visible={isModalVisible}
                        animationType="slide"
                        transparent={true}
                        statusBarTranslucent={true}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContainer}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Pilih Anggota Tim</Text>
                                    <Text style={styles.modalSubtitle}>
                                        {tempSelection.length} dari {availableEmployees.length} dipilih
                                    </Text>
                                </View>

                                {/* Search Input */}
                                <View style={styles.searchContainer}>
                                    <View style={styles.searchInputWrapper}>
                                        <Feather name="search" size={20} color="#64748B" style={styles.searchIcon} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Cari nama atau jabatan..."
                                            placeholderTextColor="#94A3B8"
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                            autoCorrect={false}
                                            autoCapitalize="none"
                                        />
                                        {searchQuery.length > 0 && (
                                            <TouchableOpacity
                                                onPress={() => setSearchQuery('')}
                                                style={styles.clearButton}
                                            >
                                                <Feather name="x" size={18} color="#64748B" />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Search Results Counter */}
                                    {searchQuery.length > 0 && (
                                        <Text style={styles.searchResultsText}>
                                            {filteredEmployees.length} hasil ditemukan
                                        </Text>
                                    )}
                                </View>

                                <View style={styles.modalContent}>
                                    {filteredEmployees.length > 0 ? (
                                        <FlatList
                                            data={filteredEmployees}
                                            keyExtractor={(item) => item.id.toString()}
                                            renderItem={({ item }) => {
                                                const isSelected = tempSelection.includes(item.id);
                                                return (
                                                    <TouchableOpacity
                                                        onPress={() => handleTempSelection(item.id)}
                                                        style={[styles.modalEmployeeItem, isSelected && styles.modalEmployeeItemSelected]}
                                                    >
                                                        <View style={[styles.modalAvatar, { backgroundColor: getColorForInitials(item.employee_name) }]}>
                                                            <Text style={styles.modalAvatarText}>{getInitials(item.employee_name)}</Text>
                                                        </View>
                                                        <View style={styles.modalEmployeeInfo}>
                                                            <Text style={[styles.modalEmployeeName, isSelected && styles.modalEmployeeNameSelected]}>
                                                                {item.employee_name}
                                                            </Text>
                                                            <Text style={[styles.modalEmployeeRole, isSelected && styles.modalEmployeeRoleSelected]}>
                                                                {item.job_name}
                                                            </Text>
                                                        </View>
                                                        <View style={[styles.modalCheckbox, isSelected && styles.modalCheckboxSelected]}>
                                                            {isSelected && <Feather name="check" size={18} color="white" />}
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            }}
                                            showsVerticalScrollIndicator={false}
                                            keyboardShouldPersistTaps="handled"
                                        />
                                    ) : (
                                        <View style={styles.emptySearchState}>
                                            <Feather name="search" size={48} color="#CBD5E0" />
                                            <Text style={styles.emptySearchTitle}>Tidak ada hasil</Text>
                                            <Text style={styles.emptySearchSubtitle}>
                                                Coba kata kunci lain atau periksa ejaan
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Bottom Action Buttons */}
                                <View style={styles.modalFooter}>
                                    <TouchableOpacity
                                        style={styles.cancelButton}
                                        onPress={handleCancelSelection}
                                    >
                                        <Text style={styles.cancelButtonText}>Batal</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.saveButton}
                                        onPress={handleSaveSelection}
                                    >
                                        <Text style={styles.saveButtonText}>
                                            Simpan ({tempSelection.length})
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                </View>
            );
        },
        [formData.assign_to, employees, availableEmployees, handleAssignToChange],
    );


    const getInitials = (name) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getColorForInitials = (name) => {
        const colors = ['#4A90E2', '#50E3C2', '#E35050', '#E3A050'];
        if (typeof name !== 'string' || name.length === 0) {
            return colors[0];
        }
        const charCode = name.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const validateForm = () => {
        if (mode === 'create') {
            if (!formData.project_name || !formData.assign_to.length) {
                throw new Error('Harap isi semua field yang wajib');
            }
        }
        return true;
    };

    const handleSubmit = useCallback(async () => {
        try {
            validateForm();

            const response =
                mode === 'create'
                    ? await CreateProject(formData)
                    : await UpdateProject(initialProjectData.id, formData);

            setAlert({
                show: true,
                type: 'success',
                message: response.message || `Projek berhasil ${mode === 'create' ? 'dibuat' : 'diperbarui'}`,
            });

            setTimeout(() => {
                navigation.goBack();
            }, 2000);
        } catch (error) {
            console.log(`Error ${mode === 'create' ? 'creating' : 'updating'} task:`, error);
            setAlert({ show: true, type: 'error', message: error.message });
        }
    }, [formData, mode, initialProjectData]);

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <LinearGradient
                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Enhanced Header Section */}
            <View style={styles.headerSection}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Feather name="chevron-left" style={styles.backButtonContainer} color="white" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.header}>{mode === 'create' ? 'Projek Baru' : 'Update Projek'}</Text>
                    <Text style={styles.subHeader}>
                        {mode === 'create' ? 'Buat proyek baru untuk tim Anda' : 'Perbarui informasi proyek'}
                    </Text>
                </View>
            </View>

            {/* Enhanced Form Container */}
            <View style={styles.formContainer}>
                {/* Project Name Field */}
                <View style={styles.fieldGroup}>
                    <View style={styles.labelContainer}>
                        <Feather name="folder" size={18} color="#0E509E" />
                        <Text style={[styles.labelText, { marginLeft: 10 }]}>
                            Nama Proyek {mode === 'create' && <Text style={styles.required}>*</Text>}
                        </Text>
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[
                                styles.input,
                                mode === 'create' && !formData.project_name && styles.requiredField,
                                formData.project_name && styles.inputFilled
                            ]}
                            placeholder="Masukkan nama proyek"
                            placeholderTextColor={'#999'}
                            placeholderTextStyle={{ fontFamily: FONTS.family.regular, letterSpacing: -0.5, fontSize: FONTS.size.sm }}
                            value={formData.project_name}
                            onChangeText={(value) => updateFormField('project_name', value)}
                        />
                        {formData.project_name ? (
                            <Feather name="check-circle" size={20} color="#10B981" style={styles.inputIcon} />
                        ) : null}
                    </View>
                </View>

                {/* Team/Division Selection */}
                <View style={styles.fieldGroup}>
                    <View style={styles.labelContainer}>
                        <Feather name="users" size={18} color="#0E509E" />
                        <Text style={[styles.labelText, { marginLeft: 10 }]}>Divisi</Text>
                    </View>
                    <Text style={styles.fieldDescription}>
                        Pilih divisi yang akan bertanggung jawab atas proyek ini
                    </Text>
                    {renderPicker(
                        'team_id',
                        '',
                        teams.map((team) => ({ label: team.team_name, value: team.id })),
                    )}
                </View>

                {/* Enhanced Date Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionHeader}>
                        <Feather name="calendar" size={20} color="#0E509E" />
                        <Text style={styles.sectionTitle}>Timeline Proyek</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                        Tentukan periode waktu pelaksanaan proyek
                    </Text>
                    <View style={styles.dateContainer}>
                        {renderDatePicker('start_date', showStartPicker, setShowStartPicker)}
                        {renderDatePicker('end_date', showEndPicker, setShowEndPicker)}
                    </View>
                </View>

                {/* Assignment Section - Conditional for Update Mode */}
                {mode === 'update' && (
                    <View style={styles.fieldGroup}>
                        <View style={styles.labelContainer}>
                            <Feather name="user-check" size={18} color="#0E509E" />
                            <Text style={styles.labelText}>Ditugaskan Oleh</Text>
                        </View>
                        <Text style={styles.fieldDescription}>
                            Siapa yang menugaskan proyek ini
                        </Text>
                        {renderPicker(
                            'assign_by',
                            'Pilih Penugasan',
                            employees.map((emp) => ({ label: emp.employee_name, value: emp.id })),
                        )}
                    </View>
                )}

                {/* Team Assignment Section */}
                <View style={styles.sectionContainer}>

                    {renderMultiPicker(
                        'Ditugaskan Kepada',
                        'Pilih anggota tim yang akan terlibat dalam proyek ini',
                        availableEmployees.map((emp) => ({ label: emp.employee_name, value: emp.id })),
                        true,
                    )}
                </View>

                {/* Project Type Selection */}
                <View style={styles.fieldGroup}>
                    <View style={styles.labelContainer}>
                        <Feather name="layers" size={18} color="#0E509E" />
                        <Text style={[styles.labelText, { marginLeft: 10 }]}>Tipe Proyek</Text>
                    </View>
                    <Text style={styles.fieldDescription}>
                        Kategori atau jenis proyek yang akan dikerjakan
                    </Text>
                    {renderPicker(
                        'project_type',
                        'Pilih Tipe Proyek',
                        projectTypeOptions.map((option) => ({ label: option.label, value: option.value })),
                    )}
                </View>

                {/* Enhanced Description Field */}
                <View style={styles.fieldGroup}>
                    <View style={styles.labelContainer}>
                        <Feather name="file-text" size={18} color="#0E509E" />
                        <Text style={[styles.labelText, { marginLeft: 10 }]}>Keterangan</Text>
                    </View>
                    <Text style={styles.fieldDescription}>
                        Jelaskan detail proyek, tujuan, dan ekspektasi hasil
                    </Text>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[
                                styles.input,
                                styles.textArea,
                                formData.project_desc && styles.inputFilled
                            ]}
                            placeholder="Masukkan deskripsi lengkap proyek, tujuan, deliverables, dan requirements khusus..."
                            placeholderTextColor={'#999'}
                            placeholderTextStyle={{ fontFamily: FONTS.family.regular, letterSpacing: -0.5, fontSize: FONTS.size.sm }}
                            value={formData.project_desc}
                            onChangeText={(value) => updateFormField('project_desc', value)}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </View>
                </View>

                {/* Enhanced Submit Button */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            !formData.project_name ? styles.buttonDisabled : null
                        ]}
                        onPress={handleSubmit}
                        disabled={!formData.project_name}
                    >
                        <LinearGradient
                            colors={
                                !formData.project_name
                                    ? ['#CBD5E0', '#A0AEC0']
                                    : ['#0E509E', '#27A0CF']
                            }
                            style={styles.buttonGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.buttonText}>
                                {mode === 'create' ? 'Buat Proyek' : 'Update Proyek'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>

            <ReusableBottomPopUp
                show={alert.show}
                alertType={alert.type}
                message={alert.message}
                onConfirm={() => setAlert((prev) => ({ ...prev, show: false }))}
            />
        </ScrollView>
    )
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F8FAFC',
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '40%',
    },
    headerSection: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        position: 'relative',
    },
    backButtonContainer: {
        position: 'absolute',
        top: 25,
        left: 0,
        color: 'white',
        fontSize: 24,
    },
    headerContent: {
        alignItems: 'center',
        // marginTop: 20,
    },
    header: {
        fontSize: FONTS.size["3xl"],
        fontFamily: FONTS.family.bold,
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subHeader: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.regular,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: 8,
        letterSpacing: -0.5,
    },
    formContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
        gap: 20,
    },
    fieldGroup: {
        marginBottom: 10,
    },
    sectionContainer: {
        marginBottom: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.bold,
        color: '#555',
        marginLeft: 12,
        letterSpacing: -0.5,
    },
    sectionDescription: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.regular,
        color: '#444',
        marginBottom: 16,
        lineHeight: 20,
        letterSpacing: -0.5,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    labelText: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.bold,
        letterSpacing: -0.5,
        color: '#555',
        flex: 1,
    },
    fieldDescription: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.regular,
        letterSpacing: -0.5,
        color: '#444',
        marginBottom: 12,
        lineHeight: 18,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        height: 56,
        borderColor: '#E2E8F0',
        borderWidth: 2,
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingRight: 50,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#555',
        // shadowColor: '#000',
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.05,
        // shadowRadius: 8,
        // elevation: 2,
        placeholderTextColor: '#A0AEC0',
        fontFamily: FONTS.family.regular,
        letterSpacing: -0.5,
        fontSize: FONTS.size.md
    },
    inputFilled: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    inputIcon: {
        position: 'absolute',
        right: 16,
        top: 18,
    },
    requiredField: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    required: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateFieldContainer: {
        marginBottom: 0,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
        borderColor: '#E2E8F0',
        borderWidth: 2,
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        gap: 4,
    },
    dateText: {
        fontSize: FONTS.size.md,
        color: '#555',
        fontFamily: FONTS.family.regular,
        letterSpacing: -0.5,
    },
    multiPickerContainer: {
        borderRadius: 14,
    },
    pickerContainer: {
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    picker: {
        height: "100%",
        width: '100%',
        fontSize: 16,
        color: '#555',
        fontFamily: FONTS.family.medium
    },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        padding: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    multiSelectItem: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 20,
        paddingVertical: 12,
        paddingHorizontal: 18,
        margin: 6,
        flexBasis: '45%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    multiSelectItemSelected: {
        backgroundColor: '#0E509E',
        borderColor: '#0E509E',
        shadowColor: '#0E509E',
        shadowOpacity: 0.3,
        elevation: 3,
    },
    multiSelectText: {
        color: '#555',
        fontSize: 15,
        fontWeight: '500',
        textAlign: 'center',
    },
    multiSelectTextSelected: {
        color: 'white',
        fontWeight: '600',
    },
    textArea: {
        height: 120,
        paddingTop: 18,
        paddingBottom: 18,
        paddingRight: 18,
    },
    flatListContainer: {
        maxHeight: 240,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    contactItemSelected: {
        backgroundColor: '#EBF8FF',
        borderBottomColor: '#BEE3F8',
    },
    initialsCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    initialsText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 2,
    },
    selectedEmployeesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    selectedEmployee: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0E509E',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        shadowColor: '#0E509E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedEmployeeName: {
        fontSize: 14,
        marginRight: 8,
        fontWeight: '600',
        color: 'white',
    },
    removeButton: {
        padding: 2,
    },
    buttonContainer: {
        marginTop: 0,
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#0E509E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonDisabled: {
        shadowOpacity: 0.1,
        elevation: 2,
    },
    buttonGradient: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: FONTS.size.lg,
        fontFamily: FONTS.family.semiBold,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    // Option 3: Modal-based Selection
    selectionTrigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    triggerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    triggerIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EBF8FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    triggerTitle: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.semiBold,
        color: '#555',
        letterSpacing: -0.5,
    },
    triggerSubtitle: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        color: '#444',
        marginTop: 2,
        letterSpacing: -0.5,
    },
    selectedDisplay: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
    },
    selectedDisplayTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 12,
    },
    selectedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -6,
    },
    selectedMember: {
        width: '48%',
        alignItems: 'center',
        margin: 6,
        padding: 12,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    memberAvatarText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    memberName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        textAlign: 'center',
        marginBottom: 2,
    },
    memberRole: {
        fontSize: 12,
        color: '#444',
        textAlign: 'center',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
        height: '100%',
    },
    modalContainer: {
        height: '80%',
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },

    // Modal Header Updates
    modalHeader: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: 'white',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A202C',
        textAlign: 'center',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
    },
    // Keep all other existing modal styles unchanged
    modalCancel: {
        fontSize: 16,
        color: '#64748B',
    },

    modalSave: {
        fontSize: 16,
        fontWeight: '600',
        color: '#0E509E',
    },
    modalEmployeeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        backgroundColor: 'white',
    },
    modalEmployeeItemSelected: {
        backgroundColor: '#EBF8FF',
    },
    modalAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    modalAvatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalEmployeeInfo: {
        flex: 1,
    },
    modalEmployeeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A202C',
        marginBottom: 2,
    },
    modalEmployeeNameSelected: {
        color: '#0E509E',
    },
    modalEmployeeRole: {
        fontSize: 14,
        color: '#64748B',
    },
    modalEmployeeRoleSelected: {
        color: '#0E509E',
    },
    modalCheckbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#CBD5E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCheckboxSelected: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    modalFooter: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 34, // Extra padding for safe area
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
    },

    // Search Styles
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A202C',
        paddingVertical: 0, // Remove default padding
    },
    clearButton: {
        padding: 4,
        marginLeft: 8,
    },
    searchResultsText: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 8,
        textAlign: 'center',
        fontWeight: '500',
    },

    // Empty Search State
    emptySearchState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptySearchTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySearchSubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
    },

    // Bottom Action Buttons
    cancelButton: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    saveButton: {
        flex: 2,
        backgroundColor: '#0E509E',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    selectedContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginVertical: 12,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2FE',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
    },
    chipText: {
        color: '#0369A1',
        fontSize: 14,
        marginRight: 6,
    },
    removeButton: {
        backgroundColor: '#0369A1',
        borderRadius: 999,
        width: 18,
        height: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        color: 'white',
        fontSize: 12,
        lineHeight: 12,
        fontWeight: 'bold',
    },
    customPickerBox: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    selectedText: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.regular,
        color: '#444',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '60%',
    },
    optionItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    modalClose: {
        padding: 12,
        alignItems: 'center',
    },
    closeText: {
        color: 'red',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ProjectForm;
