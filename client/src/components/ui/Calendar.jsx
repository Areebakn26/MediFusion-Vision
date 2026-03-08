import { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

const Calendar = ({
    selectedDate,
    onDateSelect,
    disabledDates = [],
    minDate,
    maxDate
}) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
    ).getDate();

    const firstDayOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
    ).getDay();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const isDateDisabled = (day) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateString = date.toISOString().split('T')[0];

        if (disabledDates.includes(dateString)) return true;
        if (minDate && date < new Date(minDate)) return true;
        if (maxDate && date > new Date(maxDate)) return true;

        return false;
    };

    const isDateSelected = (day) => {
        if (!selectedDate) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return date.toISOString().split('T')[0] === selectedDate;
    };

    const handleDateClick = (day) => {
        if (isDateDisabled(day)) return;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        onDateSelect(date.toISOString().split('T')[0]);
    };

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(day);
    }

    return (
        <div className="bg-white/70 backdrop-blur-md rounded-2xl shadow-glass border border-white/20 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-primary-blue/10 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <h3 className="text-lg font-bold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>

                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-primary-blue/10 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                    if (typeof day !== 'number') {
                        return <div key={`empty-${index}`} />;
                    }

                    const disabled = isDateDisabled(day);
                    const selected = isDateSelected(day);

                    return (
                        <motion.button
                            key={day}
                            whileHover={!disabled ? { scale: 1.05 } : {}}
                            whileTap={!disabled ? { scale: 0.95 } : {}}
                            onClick={() => handleDateClick(day)}
                            disabled={disabled}
                            className={clsx(
                                'aspect-square rounded-lg text-sm font-medium transition-all',
                                selected && 'bg-gradient-to-r from-primary-blue to-primary-teal text-white shadow-md',
                                !selected && !disabled && 'hover:bg-primary-blue/10 text-gray-700',
                                disabled && 'text-gray-300 cursor-not-allowed'
                            )}
                        >
                            {day}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
