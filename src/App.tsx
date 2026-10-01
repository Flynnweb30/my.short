import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppTab, AuthMode, UtmParams } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ShortenerSection } from './components/ShortenerSection';
import { UserDashboard } from './components/UserDashboard';
import { UtmBuilder } from './components/UtmBuilder';
import { SettingsPage } from './components/SettingsPage';
import { FeaturesPage } from './components/FeaturesPage';
import { PricingPage } from './components/PricingPage';
import { FeaturesSection } from './components/FeaturesSection';
import { CtaBanner } from './components/CtaBanner';
import { AuthModal } from './components/AuthModal';
import { QrCodeModal } from './components/QrCodeModal';
import { ExpiryAlertToast } from './components/ExpiryAlertToast';
import { RedirectHandler } from './components/RedirectHandler';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('shorten');
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: AuthMode }>({
    open: false,
    mode: 'signin',
  });
  const [qrModal, setQrModal] = useState<{ open: boolean; url: string; title?: string }>({
    open: false,
    url: '',
  });

  const handleOpenAuth = (mode: AuthMode = 'signin') => {
    setAuthModal({ open: true, mode });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if ((tab === 'links' || tab === 'settings') && !user) {
            handleOpenAuth('signin');
            return;
          }
          setActiveTab(tab);
        }}
        onOpenAuth={handleOpenAuth}
      />

      <main className="flex-1">
        {activeTab === 'shorten' && (
          <>
            <ShortenerSection
              onUrlCreated={() => {}}
              onOpenQr={(url, title) => setQrModal({ open: true, url, title })}
              onTriggerAuth={handleOpenAuth}
              onViewDashboard={() => (user ? setActiveTab('links') : handleOpenAuth('signin'))}
            />
            <FeaturesSection />
            <CtaBanner onGetStarted={() => handleOpenAuth('signup')} isLoggedIn={Boolean(user)} />
          </>
        )}

        {activeTab === 'links' && <UserDashboard />}

        {activeTab === 'utm' && (
          <div className="py-10 px-4">
            <UtmBuilder onShortenUtmUrl={(_url: string, _utm: UtmParams) => setActiveTab('shorten')} />
          </div>
        )}

        {activeTab === 'settings' && (
          <SettingsPage onTriggerAuth={handleOpenAuth} onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'features' && (
          <FeaturesPage
            onNavigateHome={() => setActiveTab('shorten')}
            onTriggerAuth={handleOpenAuth}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingPage onTriggerAuth={handleOpenAuth} onNavigateTab={setActiveTab} />
        )}
      </main>

      <Footer onNavigateTab={setActiveTab} />

      <ExpiryAlertToast onViewDashboard={() => setActiveTab('links')} />

      {authModal.open && (
        <AuthModal
          initialMode={authModal.mode}
          onClose={() => setAuthModal({ open: false, mode: 'signin' })}
        />
      )}

      {qrModal.open && (
        <QrCodeModal
          shortUrl={qrModal.url}
          title={qrModal.title}
          onClose={() => setQrModal({ open: false, url: '' })}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/r/:shortCode" element={<RedirectHandler />} />
          <Route path="/:shortCode" element={<RedirectHandler />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
