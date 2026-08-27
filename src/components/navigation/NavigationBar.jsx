import React from 'react';
import { Home, Layers, PlusCircle, MapPin, User } from 'lucide-react';

export default function NavigationBar({ activeTab, onTabChange, onReportClick }) {
  const tabs = [
    { id: 'home',    label: 'Home',    icon: Home },
    { id: 'hub',     label: 'My Hub',  icon: Layers },
    { id: 'report',  label: 'Report',  icon: PlusCircle, isProminent: true },
    { id: 'map',     label: 'Map',     icon: MapPin },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        if (tab.isProminent) {
          return (
            <button
              key={tab.id}
              onClick={onReportClick}
              className="bottom-nav-report"
              aria-label="Report a new issue"
            >
              <PlusCircle size={20} />
              <span>Report</span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
