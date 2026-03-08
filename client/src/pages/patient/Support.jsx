import { FaQuestionCircle, FaEnvelope, FaPhoneAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useState } from 'react';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden transition-all duration-300">
            <button
                className="w-full flex justify-between items-center p-4 bg-white hover:bg-gray-50 text-left"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-semibold text-gray-800">{question}</span>
                {isOpen ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
            </button>
            {isOpen && (
                <div className="p-4 bg-gray-50 text-gray-600 text-sm border-t border-gray-200">
                    {answer}
                </div>
            )}
        </div>
    );
};

const Support = () => {
    const faqs = [
        { question: 'How do I book an appointment?', answer: 'Navigate to the "Book Appointment" page, select a doctor, choose a date and time, and confirm your booking.' },
        { question: 'Can I download my medical reports?', answer: 'Yes, go to "Medical Records" or "My Scans" to view and download your reports as PDF.' },
        { question: 'Is my data secure?', answer: 'Absolutely. We use end-to-end encryption and comply with HIPAA regulations to ensure your data is safe.' },
        { question: 'How do I reset my password?', answer: 'Go to the login page and click on "Forgot Password". Follow the instructions sent to your email.' },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800">Help & Support</h1>
                <p className="text-gray-500 mt-2">We're here to help you with any questions or issues.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-soft text-center hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaQuestionCircle className="text-xl" />
                    </div>
                    <h3 className="font-bold text-gray-800">FAQ</h3>
                    <p className="text-sm text-gray-500 mt-1">Find answers to common questions</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-soft text-center hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaEnvelope className="text-xl" />
                    </div>
                    <h3 className="font-bold text-gray-800">Email Support</h3>
                    <p className="text-sm text-gray-500 mt-1">support@medifusion.com</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-soft text-center hover:shadow-lg transition-shadow">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaPhoneAlt className="text-xl" />
                    </div>
                    <h3 className="font-bold text-gray-800">Call Us</h3>
                    <p className="text-sm text-gray-500 mt-1">+1 (800) 123-4567</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft p-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} question={faq.question} answer={faq.answer} />
                    ))}
                </div>
            </div>

            <div className="bg-teal-600 rounded-2xl shadow-lg p-8 text-white text-center">
                <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
                <p className="text-teal-100 mb-6">Our support team is available 24/7 to assist you.</p>
                <button className="bg-white text-teal-700 px-8 py-3 rounded-xl font-bold hover:bg-teal-50 transition-colors">
                    Contact Support
                </button>
            </div>
        </div>
    );
};

export default Support;
