import React, { useState, useEffect } from 'react';
import { Globe, Shield, UserCheck, LayoutDashboard, Sparkles, Lock, User, PlayCircle, LogOut } from 'lucide-react';
import SplashScreen from './components/auth/SplashScreen';
import LanguageSelectScreen from './components/auth/LanguageSelectScreen';
import SignUpScreen from './components/auth/SignUpScreen';
import EmailOtpScreen from './components/auth/EmailOtpScreen';
import DemoIdentityScreen from './components/auth/DemoIdentityScreen';
import LoginScreen from './components/auth/LoginScreen';
import RecoveryScreen from './components/auth/RecoveryScreen';
import CitizenProfileScreen from './components/auth/CitizenProfileScreen';

import HomeScreen from './components/citizen/HomeScreen';
import MyCivicHubScreen from './components/citizen/MyCivicHubScreen';
import MapPlaceholderView from './components/citizen/MapPlaceholderView';
import NavigationBar from './components/navigation/NavigationBar';
import NotificationDrawer from './components/citizen/NotificationDrawer';
import SyncStatusBanner from './components/citizen/SyncStatusBanner';
import OfflineQueueModal from './components/citizen/OfflineQueueModal';
import TranscriptReviewModal from './components/citizen/TranscriptReviewModal';
import ComplaintTimelineModal from './components/citizen/ComplaintTimelineModal';
import ResolutionVerificationModal from './components/citizen/ResolutionVerificationModal';
import DemoRunnerModal from './components/citizen/DemoRunnerModal';
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
  const [authStep, setAuthStep] = useState('login'); // 'splash' | 'language' | 'signup' | 'otp' | 'identity' | 'login' | 'app'
  const [activeTab, setActiveTab] = useState('home');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isDemoRunnerOpen, setIsDemoRunnerOpen] = useState(false);
  const [selectedIssueDetail, setSelectedIssueDetail] = useState(null);

  const [registrationData, setRegistrationData] = useState({ email: '', password: '', demoOtp: '' });
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      } catch (err) {
        apiService.clearTokens();
        setIsAuthenticated(false);
        setAuthStep('login');
      }
    };
    checkExistingAuth();
  }, []);

  const handleLogout = () => {
    apiService.clearTokens();
    setIsAuthenticated(false);
    setUserProfile(null);
    setActiveRole('CITIZEN');
    setAuthStep('login');
  };

  const handleAuthSuccess = async (tokenRes) => {
    try {
      const profile = await apiService.getUserProfile();
      setUserProfile(profile);
      setIsAuthenticated(true);
      setLang(profile.preferred_language || 'English');
      const userRole = profile.role || tokenRes.role || 'CITIZEN';
      setActiveRole(userRole);
      setAuthStep('app');
    } catch (err) {
      const fallbackRole = tokenRes.role || 'CITIZEN';
      setUserProfile({
        civic_user_id: tokenRes.user_id || 'CIV-DEMO1234',
        email: registrationData.email || 'citizen@example.com',
        preferred_language: tokenRes.preferred_language || lang,
        identity_verified: true,
        role: fallbackRole,
        account_status: 'ACTIVE',
        created_at: new Date().toISOString()
      });
      setIsAuthenticated(true);
      setActiveRole(fallbackRole);
      setAuthStep('app');
    }
  };

  const handleNewComplaintCreated = (newIssue) => {
    const newMockComp = {
      id: newIssue.id,
      titleTa: newIssue.description || 'புதிய சாக்கடை அடைப்பு புகார்',
      titleEn: newIssue.description || 'New Civic Complaint Intake',
      original_description: newIssue.description || 'புதிய சாக்கடை அடைப்பு புகார்',
      processed_description: newIssue.description || 'New Civic Complaint Intake',
      original_language: newIssue.language || 'English',
      categoryTa: newIssue.category || 'பொது',
      categoryEn: newIssue.category || 'Civic Infrastructure',
      department: newIssue.department || 'HIGHWAYS',
      lat: newIssue.latitude || 13.0827,
      lon: newIssue.longitude || 80.2707,
      ward: newIssue.location_ward || 'Ward 104, Anna Nagar',
      photoUrl: newIssue.media_url || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
      voiceTranscriptTa: newIssue.voice_url ? 'குரல் பதிவு பெறப்பட்டது' : '',
      reporterName: userProfile ? userProfile.email : 'Citizen App Intake',
      reporterPhone: '98401*****',
      reporterCount: 1,
      status: newIssue.status || 'OPEN',
      priority: newIssue.severity || 'MEDIUM',
      priorityScore: 70,
      escalationLevel: 1,
      slaExpiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      createdAt: newIssue.created_at || new Date().toISOString(),
      slaDaysRemaining: 3,
      history: [
        { step: "Submitted", note: "Reported via CivicPulse Mobile App", timestamp: new Date().toISOString() }
      ]
    };

    setComplaints(prev => [newMockComp, ...prev]);
    setActiveTab('hub');
  };

  const handleOpenIssueDetail = (issue) => {
    setSelectedIssueDetail(issue);
    setIsTimelineModalOpen(true);
  };

  // Convert complaints list for PublicIssueCard
  const formattedPublicIssues = complaints.map(c => ({
    id: c.id,
    original_description: c.titleTa || c.original_description,
    processed_description: c.titleEn || c.processed_description,
    category: c.categoryEn || c.categoryTa || 'HIGHWAYS',
    status: c.status,
    location_ward: c.ward,
    supporters_count: c.priorityScore || 50,
    reports_count: c.reporterCount || 1,
    created_at: c.createdAt
  }));

  const handleDemoStepChange = (stepNum) => {
    if (stepNum === 1) { setAuthStep('splash'); }
    else if (stepNum === 2) { setAuthStep('language'); }
    else if (stepNum === 3) { setAuthStep('signup'); }
    else if (stepNum === 4) { setAuthStep('otp'); }
    else if (stepNum === 5) { setAuthStep('identity'); }
    else if (stepNum === 6) { setAuthStep('app'); setActiveTab('home'); }
    else if (stepNum === 7) { setAuthStep('app'); setActiveTab('report'); }
    else if (stepNum === 8) { setAuthStep('app'); setActiveTab('report'); }
    else if (stepNum === 9) { setAuthStep('app'); setActiveTab('report'); }
    else if (stepNum === 10) { setIsQueueModalOpen(true); }
    else if (stepNum === 11) { setIsQueueModalOpen(false); setAuthStep('app'); setActiveTab('hub'); }
    else if (stepNum === 12) { handleOpenIssueDetail(formattedPublicIssues[0]); }
    else if (stepNum === 13) { setIsTimelineModalOpen(false); setIsTranscriptModalOpen(true); }
    else if (stepNum === 14) { setIsTranscriptModalOpen(false); setActiveRole('OFFICER'); setAuthStep('app'); }
    else if (stepNum === 15) { setActiveRole('OFFICER'); setAuthStep('app'); }
    else if (stepNum === 16) { setActiveRole('ADMIN'); setAuthStep('app'); }
    else if (stepNum >= 17) { setAuthStep('app'); handleOpenIssueDetail(formattedPublicIssues[0]); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Top Sync Banner */}
      <SyncStatusBanner onOpenQueue={() => setIsQueueModalOpen(true)} />

      {/* Header */}
      <header className="glass-panel" style={{
        margin: '10px 14px',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            <Sparkles size={20} color="#ffffff" />
          </div>

          <div>
            <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.3px', color: '#f8fafc' }}>
              CivicPulse
            </h1>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Government AI Civic Reporting & Satellite Heatmap Portal
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Interactive Demo Walkthrough Trigger Button */}
          <button
            onClick={() => setIsDemoRunnerOpen(true)}
            className="glass-btn glass-btn-primary"
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <PlayCircle size={14} />
            <span>20-Step Demo Journey</span>
          </button>

          {isAuthenticated && userProfile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${activeRole === 'CITIZEN' ? 'badge-low' : activeRole === 'OFFICER' ? 'badge-medium' : 'badge-escalated'}`}>
                {activeRole}
              </span>

              <button
                onClick={handleLogout}
                className="glass-btn glass-btn-danger"
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                title="Logout"
              >
                <LogOut size={14} />
                <span>Logout ({userProfile.email ? userProfile.email.split('@')[0] : userProfile.officer_id || 'User'})</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthStep('login')}
              className="glass-btn"
              style={{ fontSize: '0.8rem' }}
            >
              <Lock size={14} />
              <span>Sign Up / Log In</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: '14px', marginBottom: isAuthenticated && activeRole === 'CITIZEN' ? '70px' : '0' }}>
        {!isAuthenticated || authStep !== 'app' ? (
          <>
            {authStep === 'splash' && (
              <SplashScreen onStart={() => setAuthStep('language')} />
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
                onLoginSuccess={handleAuthSuccess}
                onNavigateSignUp={() => setAuthStep('signup')}
                onNavigateForgot={() => setAuthStep('recovery')}
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
                  <MyCivicHubScreen
                    myComplaints={formattedPublicIssues}
                    publicIssues={formattedPublicIssues}
                    onReportClick={() => setActiveTab('report')}
                    onViewDetails={handleOpenIssueDetail}
                    lang={lang}
                  />
                )}

                {activeTab === 'map' && (
                  <MapPlaceholderView
                    publicIssues={formattedPublicIssues}
                    onViewDetails={handleOpenIssueDetail}
                  />
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

            {(activeRole === 'OFFICER' || activeRole === 'SUPERVISOR') && (
              <OfficerPortal
                lang={lang}
                complaints={complaints}
                setComplaints={setComplaints}
              />
            )}

            {activeRole === 'ADMIN' && (
              <AdminDashboard
                lang={lang}
                complaints={complaints}
              />
            )}
          </>
        )}
      </main>

      {/* Citizen Bottom Navigation Bar */}
      {isAuthenticated && activeRole === 'CITIZEN' && authStep === 'app' && (
        <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Notification Drawer Modal */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={[
          { id: 1, title: 'Sarvam AI Speech-to-Text Completed', description: 'Tamil voice intake converted to English: "Road Pothole & Drainage Damage"', time: '10 mins ago', type: 'SARVAM_STT' },
          { id: 2, title: 'Gemini Multimodal Categorization', description: 'Defect classified as ROADS (High Severity, 0.94 Confidence)', time: '9 mins ago', type: 'AI_CAT' },
          { id: 3, title: 'Spatial Deduplication Check', description: 'Complaint verified as Unique (New Master Ticket #TN-2026-8801)', time: '8 mins ago', type: 'DEDUP' },
          { id: 4, title: 'SLA Auto-Routing Active', description: 'Ticket dispatched to Greater Chennai Highways Department Unit', time: '5 mins ago', type: 'ROUTING' }
        ]}
      />

      {/* Offline Queue Modal */}
      <OfflineQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => setIsQueueModalOpen(false)}
      />

      {/* Sarvam AI Transcript Review Modal */}
      <TranscriptReviewModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        issueDetail={selectedIssueDetail}
      />

      {/* 9-Step Vertical Timeline Modal */}
      <ComplaintTimelineModal
        isOpen={isTimelineModalOpen}
        onClose={() => setIsTimelineModalOpen(false)}
        issueDetail={selectedIssueDetail}
      />

      {/* Resolution Verification & Reopen Modal */}
      <ResolutionVerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        issueDetail={selectedIssueDetail}
        onConfirmResolution={() => {
          setIsVerificationModalOpen(false);
          alert('Resolution Confirmed! Thank you for validating the civic fix.');
        }}
        onReopenIssue={(data) => {
          setIsVerificationModalOpen(false);
          alert(`Issue Reopened! Reason: "${data.reason}". Re-dispatched to Zonal Executive Engineer.`);
        }}
      />

      {/* 20-Step Demo Journey Runner Modal */}
      <DemoRunnerModal
        isOpen={isDemoRunnerOpen}
        onClose={() => setIsDemoRunnerOpen(false)}
        onStepChange={handleDemoStepChange}
      />
    </div>
  );
}
