import React, { useState, createContext, useContext } from 'react';

const TabsContext = createContext();

export const TabGroup = ({ children, defaultValue, tabs, onChange, className = "" }) => {
    const [activeTab, setActiveTab] = useState(defaultValue || (tabs && tabs[0]?.id));

    const handleTabChange = (value) => {
        setActiveTab(value);
        if (onChange) onChange(value);
    };

    return (
        <TabsContext.Provider value={{ activeTab, handleTabChange }}>
            <div className={`flex flex-col ${className}`}>
                {tabs && (
                    <TabList>
                        {tabs.map(tab => (
                            <Tab key={tab.id} value={tab.id}>
                                <div className="flex items-center justify-center gap-2">
                                    {tab.icon}
                                    {tab.label}
                                </div>
                            </Tab>
                        ))}
                    </TabList>
                )}
                {typeof children === 'function' ? children(activeTab) : children}
            </div>
        </TabsContext.Provider>
    );
};

export const TabList = ({ children, className = "" }) => {
    return (
        <div className={`flex gap-2 p-1 bg-gray-100/50 rounded-2xl mb-6 ${className}`}>
            {children}
        </div>
    );
};

export const Tab = ({ value, children, className = "" }) => {
    const { activeTab, handleTabChange } = useContext(TabsContext);
    const isActive = activeTab === value;

    return (
        <button
            onClick={() => handleTabChange(value)}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                isActive 
                ? 'bg-white text-blue-600 shadow-sm border border-blue-50' 
                : 'text-gray-500 hover:bg-gray-200/50 hover:text-gray-700'
            } ${className}`}
        >
            {children}
        </button>
    );
};

export const TabPanels = ({ children, className = "" }) => {
    return <div className={`flex-1 ${className}`}>{children}</div>;
};

export const TabPanel = ({ value, children, className = "" }) => {
    const { activeTab } = useContext(TabsContext);
    if (activeTab !== value) return null;

    return (
        <div className={`animate-in fade-in slide-in-from-bottom-2 duration-300 ${className}`}>
            {children}
        </div>
    );
};
