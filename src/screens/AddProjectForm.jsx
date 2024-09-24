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
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { Feather } from '@expo/vector-icons';
import { CreateProject } from '../api/projectTask';
import { getEmployeeByCompany } from '../api/general';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

const AddProjectForm = ({ route }) => {
    const [companyId, setCompanyId] = useState('');
    const navigation = useNavigation();
    const [formState, setFormState] = useState({
        company_id: companyId,
        project_name: "",
        role_id: "",
        jobs_id: "",
        team_id: "",
        assign_by: "",
        assign_to: [],
        start_date: new Date(),
        end_date: new Date(),
        project_desc: "",
        project_type: "",
    });
    const [employees, setEmployees] = useState([]);

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

    const updateFormField = useCallback((field, value) => {
        setFormState((prevState) => ({ ...prevState, [field]: value }));
    }, []);

    useEffect(() => {
        const getData = async () => {
            try {
                const companyId = await AsyncStorage.getItem('companyId');
                setCompanyId(companyId);
                setFormState(prev => ({ ...prev, company_id: companyId }));
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
        if (companyId) fetchEmployees();
    }, [companyId]);

    const handleDateChange = useCallback(
        (field, event, selectedDate) => {
            const currentDate = selectedDate || formState[field];
            setFormState((prevState) => ({ ...prevState, [field]: currentDate }));
            field === 'start_date' ? setShowStartPicker(false) : setShowEndPicker(false);
        },
        [formState],
    );

    const renderDatePicker = useCallback(
        (field, showPicker, setShowPicker) => (
            <View style={styles.fieldGroup}>
                <Text style={styles.labelText}>{field === 'start_date' ? 'Mulai' : 'Selesai'}</Text>
                <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePickerButton}>
                    <TextInput
                        style={styles.dateInput}
                        placeholder="Pilih Tanggal"
                        value={formState[field].toLocaleDateString()}
                        editable={false}
                    />
                    <Feather name="calendar" size={24} color="#27A0CF" />
                </TouchableOpacity>
                {showPicker && (
                    <DateTimePicker
                        value={formState[field]}
                        mode="date"
                        display="default"
                        onChange={(event, selectedDate) => handleDateChange(field, event, selectedDate)}
                    />
                )}
            </View>
        ),
        [formState, handleDateChange],
    );

    const renderPicker = useCallback(
        (field, label, options, isMulti = false) => (
            <View style={styles.fieldGroup}>
                <Text style={styles.labelText}>{label}</Text>
                {isMulti ? (
                    <View style={styles.multiSelectContainer}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.multiSelectItem,
                                    formState[field].includes(option.value) && styles.multiSelectItemSelected
                                ]}
                                onPress={() => handleAssignToChange(option.value)}
                            >
                                <Text style={formState[field].includes(option.value) ? styles.multiSelectTextSelected : styles.multiSelectText}>
                                    {option.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={formState[field]}
                            style={styles.picker}
                            onValueChange={(itemValue) => field === 'assign_by' ? handleAssignByChange(itemValue) : updateFormField(field, itemValue)}
                        >
                            <Picker.Item label={`Pilih ${label}`} value="" />
                            {options.map((option) => (
                                <Picker.Item key={option.value} label={option.label} value={option.value} />
                            ))}
                        </Picker>
                    </View>
                )}
            </View>
        ),
        [formState, updateFormField],
    );

    const handleAssignByChange = useCallback((value) => {
        updateFormField('assign_by', value);
        updateFormField('assign_to', []);
    }, [updateFormField]);

    const handleAssignToChange = useCallback((value) => {
        const assignTo = formState.assign_to.includes(value)
            ? formState.assign_to.filter((item) => item !== value)
            : [...formState.assign_to, value];
        updateFormField('assign_to', assignTo);
    }, [formState, updateFormField]);

    const handleSubmit = useCallback(async () => {
        // try {
        //     const response = await CreateProject(formState);
        //     setAlert({ show: true, type: 'success', message: response.message });
        //     // setFormState({
        //     //     company_id: companyId
        //     // });
        // } catch (error) {
        //     setAlert({ show: true, type: 'error', message: error.message });
        // }
        console.log(formState);
    }, [formState, companyId]);

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <LinearGradient
                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                style={styles.backgroundGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />
            <View style={styles.headerSection}>
                <Feather name="chevron-left" style={styles.backIcon} onPress={() => navigation.goBack()} />
                <Text style={styles.header}>Projek Baru</Text>
            </View>
            <View style={styles.formContainer}>
                <View style={styles.fieldGroup}>
                    <Text style={styles.labelText}>Nama Proyek</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Masukkan Nama Proyek"
                        value={formState.project_name}
                        onChangeText={(value) => updateFormField('project_name', value)}
                    />
                </View>

                <View style={styles.dateContainer}>
                    {renderDatePicker('start_date', showStartPicker, setShowStartPicker)}
                    {renderDatePicker('end_date', showEndPicker, setShowEndPicker)}
                </View>

                {renderPicker('assign_by', 'Ditugaskan oleh', employees.map(emp => ({ label: emp.employee_name, value: emp.id })))}
                {renderPicker('assign_to', 'Ditugaskan Kepada', employees.map(emp => ({ label: emp.employee_name, value: emp.id })), true)}
                {renderPicker('project_type', 'Tipe Proyek', [
                    { label: 'General', value: 'general' },
                    { label: 'Maintenance', value: 'maintenance' },
                ])}

                <View style={styles.fieldGroup}>
                    <Text style={styles.labelText}>Keterangan</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Masukkan Keterangan Proyek"
                        value={formState.project_desc}
                        onChangeText={(value) => updateFormField('project_desc', value)}
                        multiline
                        numberOfLines={4}
                    />
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                        <Text style={styles.buttonText}>Simpan</Text>
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
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 200,
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 50,
        paddingBottom: 20,
    },
    backIcon: {
        position: 'absolute',
        left: 20,
        top: 50,
        color: 'white',
        fontSize: 24,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 50,
    },
    fieldGroup: {
        marginBottom: 20,
    },
    labelText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 15,
        backgroundColor: '#f9f9f9',
    },
    dateInput: {
        flex: 1,
        fontSize: 16,
    },
    pickerContainer: {
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#f9f9f9',
    },
    picker: {
        height: 50,
    },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    multiSelectItem: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        margin: 5,
    },
    multiSelectItemSelected: {
        backgroundColor: '#27A0CF',
    },
    multiSelectText: {
        color: '#333',
    },
    multiSelectTextSelected: {
        color: 'white',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 15,
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 30,
    },
    button: {
        backgroundColor: '#27A0CF',
        borderRadius: 25,
        paddingVertical: 15,
        paddingHorizontal: 40,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },

});

export default AddProjectForm;
