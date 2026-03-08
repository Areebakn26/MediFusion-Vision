import { createContext, useState, useContext } from 'react';

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
        uploadScan: "Upload Scan",
        bookAppointment: "Book Appointment",
        myHealth: "My Health",
        doctorSearch: "Find Doctors",
        adminPanel: "Admin Panel",
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
        cancelled: "Cancelled"
    },
    ur: {
        welcome: "میڈی فیوژن میں خوش آمدید",
        dashboard: "ڈیش بورڈ",
        appointments: "ملاقاتیں",
        patients: "مریض",
        scans: "اسکینز",
        settings: "ترتیبات",
        logout: "لاگ آؤٹ",
        uploadScan: "اسکین اپ لوڈ کریں",
        bookAppointment: "ملاقات طے کریں",
        myHealth: "میری صحت",
        doctorSearch: "ڈاکٹر تلاش کریں",
        adminPanel: "ایڈمن پینل",
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
        cancelled: "منسوخ"
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en');

    const t = (key) => {
        return translations[language][key] || key;
    };

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'en' ? 'ur' : 'en'));
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
