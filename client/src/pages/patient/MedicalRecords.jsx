import { useState, useEffect } from 'react';
import { FaFileMedical, FaDownload, FaShareAlt, FaSearch, FaFilter, FaEye } from 'react-icons/fa';
import { getPatientScans } from '../../utils/api';
import Loading from '../../components/Loading';
import { useTranslation } from 'react-i18next';

const MedicalRecords = () => {
    const { t } = useTranslation();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const data = await getPatientScans();
                // Transform backend data to match UI structure if needed
                // Assuming backend returns array of scan objects
                const formattedRecords = data.map(scan => ({
                    id: scan._id,
                    type: scan.scanType,
                    date: new Date(scan.uploadDate).toLocaleDateString(),
                    doctor: scan.doctorName || 'Dr. Unassigned', // Handle missing doctor
                    status: scan.analysisStatus || 'Pending',
                    notes: scan.notes || 'No notes available'
                }));
                setRecords(formattedRecords);
            } catch (error) {
                console.error("Failed to fetch records:", error);
                // Fallback to empty or error state could be handled here
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, []);

    const filteredRecords = records.filter(record => {
        const matchesSearch = record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            record.type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'All' || record.type === filterType;
        return matchesSearch && matchesFilter;
    });

    if (loading) return <Loading text="Fetching medical records..." fullScreen={false} />;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{t('medicalRecords_title', 'Medical Records')}</h1>
                    <p className="text-gray-500 text-sm">{t('medicalRecords_subtitle', 'View and manage your medical history and reports')}</p>
                </div>
                <button className="bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-200 flex items-center">
                    <FaFileMedical className="mr-2" /> {t('requestNewReport_btn', 'Request New Report')}
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-2xl shadow-soft flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('searchByDoctorOrRecord', 'Search by doctor or record type...')}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative w-full md:w-48">
                    <FaFilter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-teal-500 outline-none appearance-none bg-white"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="All">{t('allTypes_opt', 'All Types')}</option>
                        <option value="MRI Scan">MRI Scan</option>
                        <option value="Retinal Scan">Retinal Scan</option>
                        <option value="Lab Report">Lab Report</option>
                        <option value="Prescription">Prescription</option>
                    </select>
                </div>
            </div>

            {/* Records List */}
            <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                <th className="p-4">Date</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Doctor</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600">{record.date}</td>
                                        <td className="p-4">
                                            <span className="font-bold text-gray-800">{record.type}</span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{record.doctor}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${record.status === 'Finalized' ? 'bg-green-100 text-green-700' :
                                                record.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center space-x-3">
                                                <button className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all" title="View Details">
                                                    <FaEye />
                                                </button>
                                                <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Download">
                                                    <FaDownload />
                                                </button>
                                                <button className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" title="Share">
                                                    <FaShareAlt />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        {t('noRecordsFound', 'No records found matching your criteria.')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MedicalRecords;
