import React, { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import SplashScreen from './components/auth/SplashScreen';
import LanguageSelectScreen from './components/auth/LanguageSelectScreen';
import SignUpScreen from './components/auth/SignUpScreen';
import EmailOtpScreen from './components/auth/EmailOtpScreen';
import DemoIdentityScreen from './components/auth/DemoIdentityScreen';
import LoginScreen from './components/auth/LoginScreen';
import RecoveryScreen from './components/auth/RecoveryScreen';
import CitizenProfileScreen from './components/auth/CitizenProfileScreen';

import HomeScreen from './components/citizen/HomeScreen';
import CitizenPortal from './components/CitizenPortal';
import CivicHeatmapView from './components/citizen/CivicHeatmapView';
import Civic3DHeatmapView from './components/citizen/Civic3DHeatmapView';
import NavigationBar from './components/navigation/NavigationBar';
import NotificationDrawer from './components/citizen/NotificationDrawer';
import SyncStatusBanner from './components/citizen/SyncStatusBanner';
import OfflineQueueModal from './components/citizen/OfflineQueueModal';
import ComplaintTimelineModal from './components/citizen/ComplaintTimelineModal';
import ReportIssueContainer from './components/intake/ReportIssueContainer';

import OfficerPortal from './components/OfficerPortal';
import AdminDashboard from './components/AdminDashboard';
import { INITIAL_MOCK_COMPLAINTS } from './mockData';
import { apiService } from './utils/apiService';

export default function App() {
  const [lang, setLang] = useState('English');
  const [activeRole, setActiveRole] = useState('CITIZEN'); // 'CITIZEN' | 'OFFICER' | 'ADMIN'
  const [complaints, setComplaints] = useState(INITIAL_MOCK_COMPLAINTS);
  
  // Navigation & Modal State
  const [authStep, setAuthStep] = useState('splash'); // 'splash' | 'language' | 'signup' | 'otp' | 'identity' | 'login' | 'app'
  const [activeTab, setActiveTab] = useState('home');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState(null);

  const [registrationData, setRegistrationData] = useState({ email: '', password: '', demoOtp: '' });
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [govOpen, setGovOpen] = useState(false); // collector/admin governance portal toggle
  const [map3D, setMap3D] = useState(false); // 2D vs 3D heatmap toggle

  // Check existing session token on mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        if (apiService.getToken()) {
          const profile = await apiService.getUserProfile();
          setUserProfile(profile);
          setIsAuthenticated(true);
          setLang(profile.preferred_language || 'English');
          setActiveRole(profile.role || 'CITIZEN');
          setAuthStep('app');
        }
      } catch (e) {
        apiService.clearTokens();
        setIsAuthenticated(false);
      }
    };
    checkExistingAuth();
  }, []);

  const handleAuthSuccess = (tokenData) => {
    setIsAuthenticated(true);
    const role = tokenData.role || 'CITIZEN';
    setActiveRole(role);
    setGovOpen(false);
    setUserProfile({
      civic_user_id: tokenData.user_id,
      role: role,
      preferred_language: tokenData.preferred_language || 'English',
      email: tokenData.email || (role === 'OFFICER' ? 'officer@gov.in' : 'citizen@example.com'),
      officer_id: tokenData.officer_id || null,
      name: tokenData.name,
      department: tokenData.department,
      district: tokenData.district,
      zone: tokenData.zone,
      tier: tokenData.tier,
    });
    setAuthStep('app');
    setActiveTab('home');
  };

  const handleLogout = () => {
    apiService.clearTokens();
    setIsAuthenticated(false);
    setUserProfile(null);
    setAuthStep('login');
    setActiveRole('CITIZEN');
    setActiveTab('home');
    setGovOpen(false);
  };

  const handleNewComplaintCreated = (newIssue) => {
    // Tag the new issue with the current citizen's identity so it shows up
    // in their "My Filed Complaints" hub.
    const tagged = {
      ...newIssue,
      reporter_id: userProfile?.civic_user_id || userProfile?.user_id || null,
      civic_user_id: userProfile?.civic_user_id || userProfile?.user_id || null,
      reporterEmail: userProfile?.email || null,
      reporter_email: userProfile?.email || null,
      reportedBy: userProfile?.email || userProfile?.civic_user_id || 'citizen',
      // Synthesise display fields the hub list expects
      titleEn: newIssue.processed_description || newIssue.titleEn || newIssue.description || 'New civic issue',
      processed_description: newIssue.processed_description || newIssue.description || 'New civic issue',
      categoryEn: newIssue.categoryEn || newIssue.category || 'General Civic Issue',
      status: newIssue.status || 'OPEN',
      createdAt: newIssue.created_at || new Date().toISOString(),
    };
    setComplaints(prev => [tagged, ...prev]);
    setActiveTab('hub');
  };

  const handleOpenIssueDetail = (issue) => {
    setSelectedIssueDetail(issue);
    setIsTimelineModalOpen(true);
  };

  const formattedPublicIssues = complaints.map(c => ({
    id: c.id,
    category: c.categoryEn || c.category || 'ROADS',
    title_ta: c.titleTa || c.original_description || 'சாக்கடை அடைப்பு',
    title_en: c.titleEn || c.processed_description || 'Civic Infrastructure Defect',
    location_ward: c.ward || c.location_ward || 'Ward 104, Anna Nagar',
    status: c.status || 'OPEN',
    supporters_count: c.reporterCount || c.supporters_count || 1,
    reports_count: c.reporterCount || c.reports_count || 1,
    created_at: c.createdAt || c.created_at || new Date().toISOString(),
    priority: c.priority || 'MEDIUM',
    photo_url: c.photoUrl || c.media_url,
    lat: c.lat ?? c.latitude ?? null,
    lon: c.lon ?? c.longitude ?? null
  }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      
      {/* Offline Connectivity Banner */}
      <SyncStatusBanner onOpenQueue={() => setIsQueueModalOpen(true)} />

      {/* Main Top Government Header */}
      <header className="cp-header">
        <div className="cp-header-brand">
          <div className="cp-header-logo">
            <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
              <path d="M22 42 L22 30 L25 30 L25 26 L28 26 L28 23 L32 19 L36 23 L36 26 L39 26 L39 30 L42 30 L42 42 Z" fill="#fbd77a"/>
              <rect x="20" y="42" width="24" height="4" fill="#fbd77a"/>
              <rect x="18" y="46" width="28" height="2" fill="#fbd77a" opacity="0.7"/>
            </svg>
          </div>
          <div className="cp-header-title">
            <h1 style={{ fontFamily: 'var(--font-display)' }}>CivicPulse</h1>
            <p>Government of Tamil Nadu · AI Civic Platform</p>
          </div>
        </div>

        <div className="cp-header-actions">
          {isAuthenticated && userProfile ? (
            <>
              <span className={`badge ${activeRole === 'CITIZEN' ? 'badge-green' : activeRole === 'OFFICER' ? 'badge-amber' : 'badge-dark'}`}>
                {activeRole}
              </span>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
                title={`Logout ${userProfile.email ? userProfile.email.split('@')[0] : userProfile.officer_id || 'User'}`}
              >
                Logout {userProfile.email ? userProfile.email.split('@')[0] : userProfile.officer_id || 'User'}
              </button>
            </>
          ) : (
            <button
              onClick={() => setAuthStep('login')}
              className="btn btn-primary btn-sm"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="app-main" style={{ paddingBottom: isAuthenticated && activeRole === 'CITIZEN' ? 'calc(72px + 24px)' : 'var(--space-xl)' }}>
        {!isAuthenticated || authStep !== 'app' ? (
          <>
            {authStep === 'splash' && (
              <SplashScreen onStart={() => setAuthStep('login')} />
            )}

            {authStep === 'language' && (
              <LanguageSelectScreen
                selectedLang={lang}
                onSelectLang={setLang}
                onContinue={() => setAuthStep('signup')}
              />
            )}

            {authStep === 'signup' && (
              <SignUpScreen
                selectedLang={lang}
                onOtpRequested={(data) => {
                  setRegistrationData(data);
                  setAuthStep('otp');
                }}
                onNavigateLogin={() => setAuthStep('login')}
              />
            )}

            {authStep === 'otp' && (
              <EmailOtpScreen
                email={registrationData.email}
                password={registrationData.password}
                demoOtp={registrationData.demoOtp}
                onOtpVerified={() => setAuthStep('identity')}
                onBack={() => setAuthStep('signup')}
              />
            )}

            {authStep === 'identity' && (
              <DemoIdentityScreen
                email={registrationData.email}
                password={registrationData.password}
                preferredLang={lang}
                onRegistrationSuccess={handleAuthSuccess}
              />
            )}

            {authStep === 'login' && (
              <LoginScreen
                onLogin={async (data) => {
                  try {
                    let result;
                    if (data.role === 'citizen') {
                      if (data.method === 'otp') {
                        result = await apiService.citizenOtpLogin(data.email, data.otp);
                      } else {
                        result = await apiService.citizenLogin(data.email, data.password);
                      }
                    } else {
                      result = await apiService.officerLogin(data.officer_id, data.password);
                    }
                    handleAuthSuccess({
                      role: (result.role || (data.role === 'officer' ? 'OFFICER' : 'CITIZEN')).toUpperCase(),
                      user_id: result.user_id || result.officer_id || result.id,
                      email: data.email || result.email,
                      officer_id: data.officer_id || result.officer_id,
                      preferred_language: 'English'
                    });                  } catch {
                    // Offline demo mode — still let user in
                    handleAuthSuccess({
                      role: data.role === 'officer' ? 'OFFICER' : 'CITIZEN',
                      user_id: data.role === 'officer' ? data.officer_id : data.email,
                      email: data.email || `${data.officer_id}@gov.in`,
                      officer_id: data.officer_id,
                      preferred_language: 'English',
                      name: data.role === 'officer' ? 'Ramesh Kumar' : undefined,
                      department: data.role === 'officer' ? 'Roads & Infrastructure' : undefined,
                      district: data.role === 'officer' ? 'Coimbatore' : undefined,
                      zone: data.role === 'officer' ? 'Zone 5' : undefined,
                      tier: data.role === 'officer' ? 'ward' : undefined,
                    });
                  }
                }}
                onBack={() => setAuthStep('splash')}
                onCreateAccount={() => setAuthStep('language')}
                onForgotPassword={() => setAuthStep('recovery')}
              />
            )}

            {authStep === 'recovery' && (
              <RecoveryScreen onBackToLogin={() => setAuthStep('login')} />
            )}
          </>
        ) : (
          /* AUTHENTICATED DASHBOARDS BASED ON BACKEND USER ROLE */
          <>
            {activeRole === 'CITIZEN' && (
              <>
                {activeTab === 'home' && (
                  <HomeScreen
                    userProfile={userProfile}
                    onReportClick={() => setActiveTab('report')}
                    onViewAllMyComplaints={() => setActiveTab('hub')}
                    onViewDetails={handleOpenIssueDetail}
                    onOpenNotifications={() => setIsNotificationOpen(true)}
                    onOpenProfile={() => setActiveTab('profile')}
                    lang={lang}
                  />
                )}

                {activeTab === 'report' && (
                  <ReportIssueContainer
                    userAuth={userProfile}
                    onComplaintCreated={handleNewComplaintCreated}
                  />
                )}

                {activeTab === 'hub' && (
                  <CitizenPortal
                    lang={lang}
                    complaints={complaints}
                    setComplaints={setComplaints}
                    userAuth={userProfile}
                  />
                )}

                {activeTab === 'map' && (
                  <>
                    <div className="flex justify-between items-center" style={{ maxWidth: 1280, margin: '0 auto 12px', padding: '0 4px' }}>
                      <div className="section-label">Live civic map</div>
                      <div className="tabs" style={{ width: 'auto' }}>
                        <button type="button" onClick={() => setMap3D(false)} className={`tab ${!map3D ? 'active' : ''}`}>2D Heatmap</button>
                        <button type="button" onClick={() => setMap3D(true)} className={`tab ${map3D ? 'active' : ''}`}>3D View</button>
                      </div>
                    </div>
                    {map3D ? (
                      <Civic3DHeatmapView clusters={formattedPublicIssues} />
                    ) : (
                      <CivicHeatmapView
                        publicIssues={formattedPublicIssues}
                        onViewDetails={handleOpenIssueDetail}
                      />
                    )}
                  </>
                )}

                {activeTab === 'profile' && (
                  <CitizenProfileScreen
                    userProfile={userProfile}
                    onLogout={handleLogout}
                    onLanguageChange={(newLang) => setLang(newLang)}
                  />
                )}
              </>
            )}

            {(activeRole === 'OFFICER' || activeRole === 'SUPERVISOR' || activeRole === 'ADMIN') && (
              <OfficerPortal
                lang={lang}
                complaints={complaints}
                setComplaints={setComplaints}
                officer={{
                  name: userProfile?.name || (userProfile?.officer_id ? `Officer ${userProfile.officer_id}` : (userProfile?.email?.split('@')[0] || 'Officer')),
                  officer_id: userProfile?.officer_id,
                  district: userProfile?.district || 'Coimbatore',
                  department: userProfile?.department || 'General',
                  zone: userProfile?.zone || 'Zone 5',
                  tier: userProfile?.tier || 'ward',
                }}
                onLogout={handleLogout}
                onOpenProfile={() => {}}
                onOpenGovernance={() => setGovOpen(true)}
              />
            )}

            {activeRole === 'ADMIN' && govOpen && (
              <AdminDashboard complaints={complaints} lang={lang} onBack={() => setGovOpen(false)} />
            )}
            {(activeRole === 'SUPERVISOR' || userProfile?.tier === 'collector') && govOpen && (
              <AdminDashboard complaints={complaints} lang={lang} onBack={() => setGovOpen(false)} scope="collector" />
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Navigation Bar for Citizen */}
      {isAuthenticated && activeRole === 'CITIZEN' && (
        <NavigationBar
          activeTab={activeTab}
          onTabChange={(tabId) => setActiveTab(tabId)}
          onReportClick={() => setActiveTab('report')}
        />
      )}

      {/* Modals & Drawers */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      <OfflineQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
      />

      <ComplaintTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        issueDetail={selectedIssueDetail}
      />

    </div>
  );
}
