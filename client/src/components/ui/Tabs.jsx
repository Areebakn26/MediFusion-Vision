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
        <div className={`flex gap-1 p-1 bg-surface-secondary rounded-xl border border-white/[0.06] mb-6 ${className}`}>
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
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                ? 'bg-surface text-foreground shadow-sm'
                : 'text-foreground-muted hover:bg-surface-tertiary hover:text-foreground'
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
        <div className={`animate-fade-in ${className}`}>
            {children}
        </div>
    );
};
