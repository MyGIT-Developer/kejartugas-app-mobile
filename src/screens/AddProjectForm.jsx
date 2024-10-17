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
} from 'react-native';
import CheckBox from '@react-native-community/checkbox'; // External CheckBox component
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Progress from 'react-native-progress';
import { Feather } from '@expo/vector-icons';
import { CreateProject } from '../api/projectTask';
import { getEmployeeByCompany, getTeamsByCompany } from '../api/general';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');
import Icon from 'react-native-vector-icons/MaterialIcons'; // Or any other icon library

const AddProjectForm = ({ route }) => {
    const [companyId, setCompanyId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const navigation = useNavigation();
    const [formState, setFormState] = useState({
        company_id: '',
        project_name: '',
        role_id: '',
        jobs_id: '',
        team_id: '',
        assign_by: '',
        assign_to: [],
        start_date: new Date(),
        end_date: new Date(),
        project_desc: '',
        project_type: '',
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
                employees.filter((emp) => 
                    !formState.assign_to.includes(emp.id) && emp.id != employeeId
                )
            );
        }
    }, [employees, formState.assign_to, employeeId]);
    

    const updateFormField = useCallback((field, value) => {
        setFormState((prevState) => ({ ...prevState, [field]: value }));
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
                setFormState((prev) => ({
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
                <View>
                    <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePickerButton}>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="Pilih Tanggal"
                            value={
                                formState[field]
                                    ? formState[field].toLocaleDateString('id-ID', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                      })
                                    : ''
                            }
                            editable={false}
                        />
                        <Feather name="calendar" size={24} color="#27A0CF" />
                    </TouchableOpacity>
                    {showPicker && (
                        <DateTimePicker
                            value={formState[field] || new Date()}
                            mode="date"
                            display="default"
                            borderRadius={25}
                            onChange={(event, selectedDate) => handleDateChange(field, event, selectedDate)}
                        />
                    )}
                </View>
            </View>
        ),
        [formState, handleDateChange],
    );

    const SelectedEmployees = ({ selectedIds, employees, onRemove }) => (
        <ScrollView 
          horizontal={false} 
          style={styles.scrollView}
          contentContainerStyle={styles.selectedEmployeesContainer}
        >
          {selectedIds.map(id => {
            const employee = employees.find(emp => emp.id === id);
            if (!employee) return null;
            return (
              <View key={id} style={styles.selectedEmployee}>
                <Text style={styles.selectedEmployeeName} numberOfLines={1} ellipsizeMode="tail">
                  {employee.employee_name}
                </Text>
                <TouchableOpacity onPress={() => onRemove(id)} style={styles.removeButton}>
                  <Icon name="close" size={18} color="#666" />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      );

    const renderPicker = useCallback(
        (field, label, options, isMulti = false) => (
            <View style={styles.fieldGroup}>
                <Text style={styles.labelText}>{label}</Text>
                <View style={isMulti ? styles.multiPickerContainer : styles.pickerContainer}>
                    {isMulti && (
                        <SelectedEmployees
                            selectedIds={formState.assign_to}
                            employees={employees}
                            onRemove={handleAssignToChange}
                        />
                    )}
                    {isMulti ? (
                        // <View style={styles.flatListContainer}>
                            <FlatList
                            style={styles.flatListContainer}
                                data={availableEmployees}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => handleAssignToChange(item.id)}
                                        style={styles.contactItem}
                                    >
                                        <View
                                            style={[
                                                styles.initialsCircle,
                                                { backgroundColor: getColorForInitials(item.employee_name) },
                                            ]}
                                        >
                                            <Text style={styles.initialsText}>{getInitials(item.employee_name)}</Text>
                                        </View>
                                        <View style={styles.contactInfo}>
                                            <Text style={styles.contactName}>{item.employee_name}</Text>
                                            <Text>{item.job_name}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                scrollEnabled={true}
                                nestedScrollEnabled={true}
                            />
                        // </View>
                    ) : (
                        <Picker
                            selectedValue={formState[field]}
                            onValueChange={(itemValue) => {
                                field === 'assign_by'
                                    ? handleAssignByChange(itemValue)
                                    : updateFormField(field, itemValue);
                            }}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select an option" value="" />
                            {options.map((option) => (
                                <Picker.Item key={option.value} label={option.label} value={option.value} />
                            ))}
                        </Picker>
                    )}
                </View>
            </View>
        ),
        [formState.assign_to, employees, availableEmployees, handleAssignToChange],
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

    const handleAssignByChange = useCallback(
        (value) => {
            updateFormField('assign_by', value);
            updateFormField('assign_to', []);
        },
        [updateFormField],
    );

    const handleAssignToChange = useCallback((value) => {
        setFormState((prevState) => {
            const updatedAssignTo = prevState.assign_to.includes(value)
                ? prevState.assign_to.filter((item) => item !== value)
                : [...prevState.assign_to, value];

            return { ...prevState, assign_to: updatedAssignTo };
        });
    }, []);

    const handleSubmit = useCallback(async () => {
        try {
            const response = await CreateProject(formState);
            setAlert({ show: true, type: 'success', message: response.message });

            setTimeout(() => {
                navigation.goBack();
            }, 2000);
        } catch (error) {
            console.log('Error creating project:', error);
            setAlert({ show: true, type: 'error', message: error.message });
        }
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
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="chevron-left" size={28} color="white" />
                </TouchableOpacity>
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

                {renderPicker(
                    'team_id',
                    'Divisi',
                    teams.map((team) => ({ label: team.team_name, value: team.id })),
                )}

                <View style={styles.dateContainer}>
                    {renderDatePicker('start_date', showStartPicker, setShowStartPicker)}
                    {renderDatePicker('end_date', showEndPicker, setShowEndPicker)}
                </View>

                {/* {renderPicker('assign_by', 'Ditugaskan oleh', employees.map(emp => ({ label: emp.employee_name, value: emp.id })))} */}
                {renderPicker(
                    'assign_to',
                    'Ditugaskan Kepada',
                    availableEmployees.map((emp) => ({ label: emp.employee_name, value: emp.id })),
                    true,
                )}
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
        height: '35%', // Increased slightly
    },
    headerSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingBottom: 30,
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 60,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        paddingTop: 36,
        paddingBottom: 60,
        width: '100%',
    },
    fieldGroup: {
        width: '100%',
        marginBottom: 24,
    },
    labelText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        color: '#333',
    },
    input: {
        height: 54,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        width: '100%',
    },
    dateContainer: {
        flexDirection: 'column', // Changed to column for better layout
    },
    dateFieldContainer: {
        width: '100%',
        marginBottom: 16, // Added space between date fields
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 54,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        backgroundColor: '#f9f9f9',
        width: '100%',
    },
    dateText: {
        fontSize: 16,
        color: '#333',
    },
    buttonContainer: {
        alignItems: 'center',
        marginTop: 36,
        width: '100%',
    },
    button: {
        backgroundColor: '#27A0CF',
        borderRadius: 28,
        paddingVertical: 16,
        paddingHorizontal: 48,
        elevation: 3,
        width: '100%', // Changed to full width
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center',
    },
    dateInput: {
        flex: 1,
        fontSize: 16,
    },
    multiPickerContainer: {
        borderRadius: 12,
        fontSize: 16,
        width: '100%',
    },
    pickerContainer: {
        borderRadius: 12,
        fontSize: 16,
        width: '100%',
        backgroundColor: '#f9f9f9',
        borderColor: '#ddd',
        borderWidth: 1,
    },
    picker: {
        height: 54,
        width: '100%', // Ensure full width
        fontFamily:"Poppins-Medium",
    },
    multiSelectContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
        width: '100%', // Ensure full width
    },
    multiSelectItem: {
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        margin: 6,
        flexBasis: '45%', // Adjust for two columns with some margin
    },
    multiSelectItemSelected: {
        backgroundColor: '#27A0CF',
    },
    multiSelectText: {
        color: '#333',
        fontSize: 15,
    },
    multiSelectTextSelected: {
        color: 'white',
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
        paddingTop: 16,
        width: '100%', // Ensure full width
    },
    flatListContainer: {
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    contactItemSelected: {
        backgroundColor: '#e6f7ff',
    },
    initialsCircle: {
        width: 25,
        height: 25,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    initialsText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    selectedEmployeesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 5,
    },
    selectedEmployee: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d7d7d7',
        borderRadius: 15,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginRight: 5,
        marginBottom: 5,
    },
    selectedEmployeeName: {
        fontSize: 14,
        marginRight: 5,
        fontWeight: 'semibold',
    },
    removeButton: {
        padding: 2,
    },
});

export default AddProjectForm;
