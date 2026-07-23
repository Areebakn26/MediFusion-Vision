import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDoctors } from '../../services/api';

const DoctorSearch = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        specialization: '',
        minRating: 0,
        searchQuery: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchDoctors();
    }, [filters]);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const { data } = await getDoctors(filters);

            // Transform API data to match UI component structure if needed
            // Backend returns: { id, specialization, consultation_fee, User: { name }, ... }
            const formattedDoctors = data.map(doc => ({
                id: doc.id,
                name: doc.User.name,
                specialization: doc.specialization,
                rating: 4.8, // Placeholder as DB might not have ratings yet
                experience: doc.experience_years,
                fee: doc.consultation_fee,
                image: doc.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(doc.User?.name || 'D')}&size=96&background=6366f1&color=fff&bold=true`
            }));

            setDoctors(formattedDoctors);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch doctors", error);
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-secondary p-4 rounded-xl shadow-card">
                <div className="w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Search doctors by name..."
                        className="w-full border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent focus:border-transparent"
                        value={filters.searchQuery}
                        onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <select
                        className="border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent"
                        value={filters.specialization}
                        onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
                    >
                        <option value="">All Specializations</option>
                        <option value="Cardiologist">Cardiologist</option>
                        <option value="Neurologist">Neurologist</option>
                        <option value="Dermatologist">Dermatologist</option>
                        <option value="General Physician">General Physician</option>
                    </select>
                    <select
                        className="border border-white/[0.14] rounded-xl px-4 py-2 focus:ring-2 focus:ring-accent"
                        value={filters.minRating}
                        onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
                    >
                        <option value="0">All Ratings</option>
                        <option value="4">4+ Stars</option>
                        <option value="4.5">4.5+ Stars</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading doctors...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doctor) => (
                        <div key={doctor.id} className="bg-surface-secondary rounded-xl shadow-card hover:shadow-card-hover transition-shadow overflow-hidden border border-white/5">
                            <div className="p-6 flex flex-col items-center text-center">
                                <img src={doctor.image} alt={doctor.name} className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-accent-subtle" />
                                <h3 className="text-xl font-bold text-foreground">{doctor.name}</h3>
                                <p className="text-accent font-medium">{doctor.specialization}</p>
                                <div className="flex items-center mt-2 text-foreground-muted text-sm">
                                    <span className="flex items-center text-warning mr-2">
                                        ★ {doctor.rating}
                                    </span>
                                    <span>• {doctor.experience} Years Exp.</span>
                                </div>
                                <div className="mt-4 w-full pt-4 border-t border-white/5 flex justify-between items-center">
                                    <div className="text-left">
                                        <p className="text-xs text-foreground-muted">Consultation Fee</p>
                                        <p className="text-lg font-bold text-foreground">Rs. {doctor.fee}</p>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/patient/book-appointment?doctorId=${doctor.id}`)}
                                        className="bg-accent text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors"
                                    >
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DoctorSearch;
