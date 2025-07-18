import React from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions } from 'react-native';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

const FilteredProgressProjects = ({ projects, status }) => {
    const filteredProjects = projects.filter((item) => {
        const onProgressTask = item.task_status_counts.find((task) => task.task_status === status);
        return onProgressTask && onProgressTask.count > 0;
    });

    if (filteredProjects.length == 0) {
        return (
            <View style={styles.cardContainer}>
                <View
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 19,
                        padding: 15,
                        height: 125,
                        width: 312,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 5,
                        justifyContent: 'center',
                        textAlign: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text style={{ fontSize: 18, fontFamily: 'Poppins-Medium', letterSpacing: -0.3 }}>
                        No projects found
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filteredProjects.map((item, index) => {
                const onProgressTask = item.task_status_counts.find((task) => task.task_status === status);
                const onProgressCount = onProgressTask ? onProgressTask.count : 0;

                return (
                    <View style={styles.cardContainer}>
                        <View key={index} style={styles.card}>
                            <Text
                                style={{
                                    alignSelf: 'flex-start',
                                    fontWeight: '600',
                                    fontSize: 16,
                                    fontFamily: 'Poppins-Medium',
                                    letterSpacing: -0.3,
                                }}
                            >
                                {item.project_name}
                            </Text>

                            <View
                                style={{
                                    paddingVertical: 5,
                                    paddingHorizontal: 10,
                                    backgroundColor: status === 'workingOnIt' ? 'orange' : 'red',
                                    borderRadius: 50,
                                    justifyContent: 'center',
                                    display: 'flex',
                                }}
                            >
                                <Text style={{ color: 'white', fontFamily: 'Poppins-Medium', letterSpacing: -0.3 }}>
                                    {status === 'workingOnIt'
                                        ? `${onProgressCount} Tugas dalam pengerjaan`
                                        : `${onProgressCount} Tugas perlu ditinjau`}
                                </Text>
                            </View>
                        </View>
                    </View>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        marginHorizontal: 20,
        marginVertical: 15,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        height: 125,
        width: 312,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default FilteredProgressProjects;
