import React from 'react';
import { ScrollView, View, Text } from 'react-native';

const FilteredProgressProjects = ({ projects, status }) => {
  const filteredProjects = projects.filter(item => {
    const onProgressTask = item.task_status_counts.find(
      (task) => task.task_status === status
    );
    return onProgressTask && onProgressTask.count > 0;
  });

  if (filteredProjects.length == 0) {
    return <Text>No projects in progress</Text>;
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flex: 1, flexDirection: 'row' }}
    >
      {filteredProjects.map((item, index) => {
        const onProgressTask = item.task_status_counts.find(
          (task) => task.task_status === status
        );
        const onProgressCount = onProgressTask ? onProgressTask.count : 0;

        return (
          <View
            key={index}
            style={{
              width: 250,
              padding: 10,
              backgroundColor: '#fff',
              marginHorizontal: 5,
              height: 125,
              borderRadius: 10,
              shadowColor: '#000',
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 5 },
              shadowRadius: 10,
              elevation: 5,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ alignSelf: 'flex-start', fontWeight: '600', fontSize: 16 }}>
              {item.project_name}
            </Text>

            <View
              style={{
                padding: 5,
                backgroundColor: status === "workingOnIt" ? 'orange' : 'red',
                borderRadius: 50,
                justifyContent: 'center',
                display: 'flex',
              }}
            >
              <Text style={{ color: 'white' }}>
                {status === "workingOnIt" ? `${onProgressCount} Tugas dalam pengerjaan` : `${onProgressCount} Tugas perlu ditinjau`}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

export default FilteredProgressProjects;