import { FaPrescriptionBottleAlt, FaBookMedical, FaPills, FaSearch } from 'react-icons/fa';

const MedicalTools = () => {
    const tools = [
        { title: 'Drug Interaction Checker', desc: 'Check for potential interactions between medications.', icon: <FaPills />, color: 'bg-error' },
        { title: 'Medical Reference', desc: 'Access latest medical guidelines and protocols.', icon: <FaBookMedical />, color: 'bg-accent' },
        { title: 'Prescription Templates', desc: 'Manage and use saved prescription templates.', icon: <FaPrescriptionBottleAlt />, color: 'bg-accent' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Medical Tools</h1>
                <p className="text-foreground-muted text-sm">Utilities to assist your daily practice</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tools.map((tool, index) => (
                    <div key={index} className="bg-surface-secondary p-6 rounded-xl shadow-card hover:shadow-card transition-all cursor-pointer group">
                        <div className={`w-14 h-14 ${tool.color} rounded-xl flex items-center justify-center text-white text-2xl mb-4 shadow-card group-hover:scale-110 transition-transform`}>
                            {tool.icon}
                        </div>
                        <h3 className="font-bold text-foreground text-lg">{tool.title}</h3>
                        <p className="text-foreground-muted text-sm mt-2">{tool.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-surface-secondary rounded-xl shadow-card p-8">
                <h2 className="text-xl font-bold text-foreground mb-6">Drug Database Search</h2>
                <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-subtle text-lg" />
                    <input
                        type="text"
                        placeholder="Search for generic or brand name drugs..."
                        className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/[0.06] focus:border-accent focus:ring-4 focus:ring-accent/20 outline-none text-lg transition-all"
                    />
                </div>
                <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 bg-surface-tertiary text-foreground-muted rounded-full text-xs font-medium cursor-pointer hover:bg-surface-tertiary">Amoxicillin</span>
                    <span className="px-3 py-1 bg-surface-tertiary text-foreground-muted rounded-full text-xs font-medium cursor-pointer hover:bg-surface-tertiary">Ibuprofen</span>
                    <span className="px-3 py-1 bg-surface-tertiary text-foreground-muted rounded-full text-xs font-medium cursor-pointer hover:bg-surface-tertiary">Metformin</span>
                </div>
            </div>
        </div>
    );
};

export default MedicalTools;
