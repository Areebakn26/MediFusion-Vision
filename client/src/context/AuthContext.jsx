import { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, registerUser, getMe } from '../services/api';
import { useTranslation } from 'react-i18next';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const { i18n } = useTranslation();

    // Apply language and accessibility when user state changes
    useEffect(() => {
        if (user) {
            // Language
            const lang = user.preferredLanguage || user.preferred_language;
            if (lang && i18n.language !== lang) {
                i18n.changeLanguage(lang);
            }

            // RTL handling (Urdu)
            const dir = lang === 'ur' ? 'rtl' : 'ltr';
            document.documentElement.dir = dir;
            if (dir === 'rtl') {
                document.documentElement.classList.add('rtl');
            } else {
                document.documentElement.classList.remove('rtl');
            }

            // Accessibility Settings
            let settings = {};
            if (user.profile && user.profile.accessibility_settings) {
                settings = { ...settings, ...user.profile.accessibility_settings };
            }
            // user.accessibilitySettings should override profile since it's the one we update locally
            settings = { ...settings, ...(user.accessibilitySettings || user.accessibility_settings || {}) };

            if (settings.highContrast) {
                document.body.classList.add('high-contrast');
            } else {
                document.body.classList.remove('high-contrast');
            }

            if (settings.largeText) {
                document.body.classList.add('large-text');
            } else {
                document.body.classList.remove('large-text');
            }
        } else {
            // Reset to defaults
            document.body.classList.remove('high-contrast', 'large-text');
            document.documentElement.dir = 'ltr';
            document.documentElement.classList.remove('rtl');
        }
    }, [user, i18n]);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');

            // Timeout after 5 seconds - don't block forever
            const timeoutId = setTimeout(() => {
                setLoading(false);
                console.warn('Auth check timed out');
            }, 5000);

            if (token) {
                try {
                    const { data } = await getMe();
                    clearTimeout(timeoutId);
                    setUser(data);
                } catch (error) {
                    clearTimeout(timeoutId);
                    console.error("Auth check failed:", error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                }
            } else {
                clearTimeout(timeoutId);
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        const { data } = await loginUser({ email, password });
        // Store tokens correctly - backend returns accessToken and refreshToken
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        setUser(data);
        return data;
    };

    const register = async (userData) => {
        const { data } = await registerUser(userData);
        // Registration doesn't return token, user needs to verify email first
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
    };

    const updateUser = (updatedData) => {
        setUser(prev => ({ ...prev, ...updatedData }));
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
