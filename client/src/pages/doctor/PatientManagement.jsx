import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaHeartbeat, FaHistory } from 'react-icons/fa';
import { GlassCard, Button, Input, Badge } from '../../components/ui';
import api from '../../services/api';

const PatientManagement = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPatients = async () => {
            setLoading(true);
            try {
                const { data } = await api.get('/doctors/my-patients');
                // Backend now returns Patient objects directly (not wrapped in appointment)
                const formatted = data.map(patient => ({
                    id: patient.id,
                    name: patient.User?.name || 'Unknown',
                    email: patient.User?.email || '',
                    age: calculateAge(patient.date_of_birth),
                    gender: patient.gender || 'N/A',
                    blood_group: patient.blood_group || '—',
                    lastVisit: patient.lastVisit,
                    condition: patient.MedicalHistories?.[0]?.condition || patient.medical_history?.[0]?.condition || 'General',
                    status: patient.MedicalHistories?.[0]?.status || 'Stable',
                    image: `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.User?.name || 'P')}&background=random`
                }));
                setPatients(formatted);
            } catch (error) {
                console.error('Error fetching patients', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const calculateAge = (dob) => {
        if (!dob) return 'N/A';
        const today = new Date();
        const birthDate = new Date(dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

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
                    <h1 className="text-3xl font-bold text-accent">
                        Patient Management
                    </h1>
                    <p className="text-foreground-muted mt-1">View and manage your patient records</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Input
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground-subtle" />
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
                            <GlassCard className="p-6 hover:shadow-card-hover transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <FaHeartbeat className="w-24 h-24 text-accent" />
                                </div>

                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <img
                                                src={patient.image}
                                                alt={patient.name}
                                                className="w-16 h-16 rounded-full object-cover ring-4 ring-surface-secondary shadow-card"
                                            />
                                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-surface-secondary ${patient.status === 'Stable' ? 'bg-success' :
                                                    patient.status === 'Critical' ? 'bg-error' : 'bg-accent'
                                                }`}></div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">{patient.name}</h3>
                                            <p className="text-sm text-foreground-muted">{patient.age !== 'N/A' ? `${patient.age} yrs` : 'Age N/A'}, {patient.gender}</p>
                                            <p className="text-xs text-foreground-subtle">{patient.email}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(patient.status)}
                                </div>

                                <div className="space-y-2 mb-5 relative z-10 bg-surface-secondary/50 p-3 rounded-xl">
                                    <div className="flex items-center text-sm text-foreground">
                                        <FaHeartbeat className="mr-3 text-accent shrink-0" />
                                        <span>Condition: <span className="font-semibold">{patient.condition}</span></span>
                                    </div>
                                    <div className="flex items-center text-sm text-foreground">
                                        <span className="mr-3 text-lg">🩸</span>
                                        <span>Blood Group: <span className="font-semibold">{patient.blood_group}</span></span>
                                    </div>
                                    <div className="flex items-center text-sm text-foreground">
                                        <FaHistory className="mr-3 text-accent shrink-0" />
                                        <span>Last Visit: {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 relative z-10">
                                    <Button 
                                        className="flex-1" 
                                        size="sm"
                                        onClick={() => navigate(`/doctor/patients/${patient.id}`)}
                                    >
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
