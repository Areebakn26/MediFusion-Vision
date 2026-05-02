import { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        welcome: "Welcome to MediFusion",
        dashboard: "Dashboard",
        appointments: "Appointments",
        patients: "Patients",
        scans: "Scans",
        settings: "Settings",
        logout: "Logout",
        profile: "Profile",
        findDoctors: "Find Doctors",
        uploadScan: "Upload Scan",
        bookAppointment: "Book Appointment",
        medicalRecords_title: "Medical Records",
        myHealth: "My Health",
        login: "Login",
        register: "Register",
        email: "Email Address",
        password: "Password",
        signIn: "Sign In",
        searchDoctors: "Search doctors by name...",
        specialization: "Specialization",
        consultationFee: "Consultation Fee",
        bookNow: "Book Now",
        upload: "Upload",
        analyzing: "Analyzing...",
        results: "Results",
        diagnosis: "Diagnosis",
        confidence: "Confidence",
        severity: "Severity",
        doctorReview: "Doctor Review",
        pending: "Pending",
        confirmed: "Confirmed",
        completed: "Completed",
        cancelled: "Cancelled",
        // Extended keys
        noShow: "No Show",
        virtual: "Virtual",
        physical: "Physical",
        scanResults: "Scan Results",
        aiDiagnosis: "AI Diagnosis",
        downloadReport: "Download Report",
        medicalHistory: "Medical History",
        consultationNotes: "Consultation Notes",
        appointmentHistory: "Appointment History",
        myScans: "My Scans",
        viewResults: "View Results",
        notifications: "Notifications",
        markAllRead: "Mark all as read",
        noNotifications: "No notifications yet",
        sessionActive: "Session Active",
        micRecording: "Mic Recording",
        analytics: "Analytics",
        diagnostics: "Diagnostics",
        billing: "Billing",
        support: "Support",
        type: "Type",
        status: "Status",
        date: "Date",
        doctor: "Doctor",
        patient: "Patient",
        viewNotes: "View Notes",
        noAppointments: "No appointments found",
        noNotes: "No consultation notes found",
        noScans: "No scans found",
        loading: "Loading...",
        error: "Something went wrong",
    },
    ur: {
        welcome: "میڈی فیوژن میں خوش آمدید",
        dashboard: "ڈیش بورڈ",
        appointments: "ملاقاتیں",
        patients: "مریض",
        scans: "اسکینز",
        settings: "ترتیبات",
        logout: "لاگ آؤٹ",
        profile: "پروفائل",
        findDoctors: "ڈاکٹر تلاش کریں",
        uploadScan: "اسکین اپ لوڈ کریں",
        bookAppointment: "ملاقات طے کریں",
        medicalRecords_title: "طبی ریکارڈ",
        myHealth: "میری صحت",
        login: "لاگ ان",
        register: "رجسٹر",
        email: "ای میل پتہ",
        password: "پاس ورڈ",
        signIn: "سائن ان",
        searchDoctors: "ڈاکٹر کا نام تلاش کریں...",
        specialization: "تخصص",
        consultationFee: "مشورہ فیس",
        bookNow: "ابھی بک کریں",
        upload: "اپ لوڈ کریں",
        analyzing: "تجزیہ ہو رہا ہے...",
        results: "نتائج",
        diagnosis: "تشخیص",
        confidence: "اعتماد",
        severity: "شدت",
        doctorReview: "ڈاکٹر کا جائزہ",
        pending: "زیر التواء",
        confirmed: "تصدیق شدہ",
        completed: "مکمل",
        cancelled: "منسوخ",
        // Extended keys
        noShow: "غیر حاضر",
        virtual: "آن لائن",
        physical: "حضوری",
        scanResults: "اسکین نتائج",
        aiDiagnosis: "اے آئی تشخیص",
        downloadReport: "رپورٹ ڈاؤنلوڈ کریں",
        medicalHistory: "طبی تاریخ",
        consultationNotes: "مشورے کے نوٹس",
        appointmentHistory: "ملاقاتوں کی تاریخ",
        myScans: "میرے اسکین",
        viewResults: "نتائج دیکھیں",
        notifications: "اطلاعات",
        markAllRead: "سب پڑھا ہوا نشان کریں",
        noNotifications: "ابھی کوئی اطلاع نہیں",
        sessionActive: "سیشن فعال",
        micRecording: "مائیک ریکارڈنگ",
        analytics: "تجزیات",
        diagnostics: "تشخیصی",
        billing: "بلنگ",
        support: "مدد",
        type: "قسم",
        status: "حیثیت",
        date: "تاریخ",
        doctor: "ڈاکٹر",
        patient: "مریض",
        viewNotes: "نوٹس دیکھیں",
        noAppointments: "کوئی ملاقات نہیں ملی",
        noNotes: "کوئی مشاورتی نوٹس نہیں ملے",
        noScans: "کوئی اسکین نہیں ملا",
        loading: "لوڈ ہو رہا ہے...",
        error: "کچھ غلط ہو گیا",
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => localStorage.getItem('lang') || 'en');

    // Apply/remove html.rtl class so index.css RTL rules activate
    useEffect(() => {
        if (language === 'ur') {
            document.documentElement.classList.add('rtl');
        } else {
            document.documentElement.classList.remove('rtl');
        }
    }, [language]);

    const t = (key, fallback) => {
        return translations[language][key] || fallback || key;
    };

    const toggleLanguage = () => {
        const next = language === 'en' ? 'ur' : 'en';
        setLanguage(next);
        localStorage.setItem('lang', next);
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            <div dir={language === 'ur' ? 'rtl' : 'ltr'} className={language === 'ur' ? 'font-urdu' : 'font-sans'}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
