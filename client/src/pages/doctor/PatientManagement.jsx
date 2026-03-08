import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaHeartbeat, FaHistory } from 'react-icons/fa';
import { GlassCard, Button, Input, Badge } from '../../components/ui';
import api from '../../services/api';

const PatientManagement = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock Data Fetch - replace with api.get('/doctor/patients')
        const fetchPatients = async () => {
            setLoading(true);
            try {
                // const { data } = await api.get('/doctor/patients');
                // setPatients(data);

                setTimeout(() => {
                    setPatients([
                        { id: 1, name: 'Alice Johnson', age: 32, gender: 'Female', lastVisit: '2023-10-20', condition: 'Migraine', status: 'Stable', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
                        { id: 2, name: 'Bob Smith', age: 45, gender: 'Male', lastVisit: '2023-10-18', condition: 'Hypertension', status: 'Critical', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
                        { id: 3, name: 'Charlie Brown', age: 28, gender: 'Male', lastVisit: '2023-10-15', condition: 'Routine Checkup', status: 'Stable', image: 'https://randomuser.me/api/portraits/men/12.jpg' },
                        { id: 4, name: 'Diana Prince', age: 35, gender: 'Female', lastVisit: '2023-10-10', condition: 'Flu', status: 'Recovered', image: 'https://randomuser.me/api/portraits/women/65.jpg' },
                    ]);
                    setLoading(false);
                }, 500);
            } catch (error) {
                console.error("Error fetching patients", error);
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const filteredPatients = patients.filter(patient =>
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status) => {
        const variants = {
            Stable: 'success',
            Critical: 'danger',
            Recovered: 'primary'
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                        Patient Management
                    </h1>
                    <p className="text-gray-500 mt-1">View and manage your patient records</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Input
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <Button variant="outline" className="px-3">
                        <FaFilter />
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading patients...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map((patient, index) => (
                        <motion.div
                            key={patient.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <GlassCard className="p-6 hover:shadow-lg transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FaHeartbeat className="w-24 h-24 text-primary-blue" />
                                </div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <img
                                                src={patient.image}
                                                alt={patient.name}
                                                className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md"
                                            />
                                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${patient.status === 'Stable' ? 'bg-green-500' :
                                                    patient.status === 'Critical' ? 'bg-red-500' : 'bg-blue-500'
                                                }`}></div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800 group-hover:text-primary-blue transition-colors">{patient.name}</h3>
                                            <p className="text-sm text-gray-500">{patient.age} yrs, {patient.gender}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(patient.status)}
                                </div>

                                <div className="space-y-3 mb-6 relative z-10 bg-white/50 p-3 rounded-xl">
                                    <div className="flex items-center text-sm text-gray-700">
                                        <FaHeartbeat className="mr-3 text-primary-blue" />
                                        <span>Condition: <span className="font-semibold">{patient.condition}</span></span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-700">
                                        <FaHistory className="mr-3 text-primary-blue" />
                                        <span>Last Visit: {new Date(patient.lastVisit).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 relative z-10">
                                    <Button className="flex-1" size="sm">
                                        View Profile
                                    </Button>
                                    <Button variant="outline" className="flex-1" size="sm">
                                        Add Note
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientManagement;
