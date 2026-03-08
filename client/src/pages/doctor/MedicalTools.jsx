import { FaPrescriptionBottleAlt, FaBookMedical, FaPills, FaSearch } from 'react-icons/fa';

const MedicalTools = () => {
    const tools = [
        { title: 'Drug Interaction Checker', desc: 'Check for potential interactions between medications.', icon: <FaPills />, color: 'bg-red-500' },
        { title: 'Medical Reference', desc: 'Access latest medical guidelines and protocols.', icon: <FaBookMedical />, color: 'bg-blue-500' },
        { title: 'Prescription Templates', desc: 'Manage and use saved prescription templates.', icon: <FaPrescriptionBottleAlt />, color: 'bg-teal-500' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Medical Tools</h1>
                <p className="text-gray-500 text-sm">Utilities to assist your daily practice</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tools.map((tool, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-all cursor-pointer group">
                        <div className={`w-14 h-14 ${tool.color} rounded-2xl flex items-center justify-center text-white text-2xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                            {tool.icon}
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">{tool.title}</h3>
                        <p className="text-gray-500 text-sm mt-2">{tool.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Drug Database Search</h2>
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                    <input
                        type="text"
                        placeholder="Search for generic or brand name drugs..."
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none text-lg transition-all"
                    />
                </div>
                <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium cursor-pointer hover:bg-gray-200">Amoxicillin</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium cursor-pointer hover:bg-gray-200">Ibuprofen</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium cursor-pointer hover:bg-gray-200">Metformin</span>
                </div>
            </div>
        </div>
    );
};

export default MedicalTools;
