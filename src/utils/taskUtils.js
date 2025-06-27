// Calculate remaining days from today to end date
export const calculateRemainingDays = (endDate, status) => {
    if (status === 'Completed') {
        return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const timeDiff = end.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

// Get status badge color and label
export const getStatusBadgeColor = (status, endDate) => {
    if (status === 'Completed') {
        return { color: '#C9F8C1', textColor: '#333333', label: 'Selesai' };
    } else if (status === 'onPending') {
        return { color: '#F0E08A', textColor: '#333333', label: 'Tersedia' };
    } else if (status === 'onHold') {
        return { color: '#F69292', textColor: '#811616', label: 'Ditunda' };
    } else if (status === 'rejected') {
        return { color: '#F69292', textColor: '#811616', label: 'Ditolak' };
    } else if (status === 'onReview') {
        return { color: '#f6e092', textColor: '#ee9000', label: 'Dalam Peninjauan' };
    }

    const remainingDays = calculateRemainingDays(endDate, status);

    if (remainingDays === 0) {
        return { color: '#F69292', textColor: '#811616', label: 'Deadline Tugas Hari Ini' };
    } else if (remainingDays < 0) {
        return { color: '#F69292', textColor: '#811616', label: `Terlambat selama ${Math.abs(remainingDays)} hari` };
    } else if (remainingDays > 0) {
        return { color: '#FFE9CB', textColor: '#E07706', label: `Tersisa ${remainingDays} hari` };
    }

    // Existing status handling logic
    switch (status) {
        case 'workingOnIt':
            return { color: '#aeaeae', textColor: '#000000', label: 'Dalam Pengerjaan' };
        case 'onReview':
            return { color: '#f6e092', textColor: '#ee9000', label: 'Dalam Peninjauan' };
        case 'rejected':
            return { color: '#F69292', textColor: '#811616', label: 'Ditolak' };
        case 'onHold':
            return { color: '#F69292', textColor: '#811616', label: 'Ditunda' };
        case 'Completed':
            return { color: '#C9F8C1', textColor: '#0A642E', label: 'Selesai' };
        case 'onPending':
            return { color: '#F0E08A', textColor: '#656218', label: 'Tersedia' };
        default:
            return { color: '#E0E0E0', textColor: '#000000', label: status };
    }
};

// Get status appearance for task display
export const getStatusAppearance = (status) => {
    switch (status) {
        case 'workingOnIt':
            return { color: '#CCC8C8', textColor: '#333333', label: 'Dalam Pengerjaan' };
        case 'onReview':
            return { color: '#ffd000', textColor: '#333333', label: 'Dalam Peninjauan' };
        default:
            return { color: '#E0E0E0', textColor: '#333333', label: status };
    }
};

// Group tasks by project name
export const groupTasksByProject = (tasks) => {
    const groupedTasks = {};
    tasks.forEach((task) => {
        groupedTasks[task.project_name] = groupedTasks[task.project_name] || [];
        groupedTasks[task.project_name].push(task);
    });
    return groupedTasks;
};

// Get greeting based on current time
export const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
        return 'Selamat Pagi';
    } else if (currentHour < 15) {
        return 'Selamat Siang';
    } else if (currentHour < 19) {
        return 'Selamat Sore';
    } else {
        return 'Selamat Malam';
    }
};

// Get collection status badge color and label
export const getCollectionStatusBadgeColor = (status) => {
    switch (status) {
        case 'finish':
            return { color: '#A7C8E5', textColor: '#092D58', label: 'Tepat Waktu' };
        case 'earlyFinish':
            return { color: '#9ADFAD', textColor: '#0A642E', label: 'Selesai Lebih Awal' };
        case 'finish in delay':
            return { color: '#F0E089', textColor: '#80490A', label: 'Selesai Terlambat' };
        case 'overdue':
            return { color: '#F69292', textColor: '#811616', label: 'Terlambat' };
        default:
            return { color: '#E0E0E0', textColor: '#000000', label: status || 'Belum Dikumpulkan' };
    }
};
