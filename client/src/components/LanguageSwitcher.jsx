import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    return (
        <div className="language-switcher">
            <select
                value={i18n.language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="w-full sm:w-auto px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                aria-label="Select Language"
            >
                <option value="en">English</option>
                <option value="ur">اردو (Urdu)</option>
            </select>
        </div>
    );
};

export default LanguageSwitcher;
