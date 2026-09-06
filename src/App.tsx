import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { ShortenerSection } from './components/ShortenerSection';
import { FeaturesSection } from './components/FeaturesSection';
import { CtaBanner } from './components/CtaBanner';
import { UserDashboard } from './components/UserDashboard';
import { SettingsPage } from './components/SettingsPage';
import { FeaturesPage } from './components/FeaturesPage';
import { PricingPage } from './components/PricingPage';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { QrCodeModal } from './components/QrCodeModal';
import { RedirectHandler } from './components/RedirectHandler';
import { ExpiryAlertToast } from './components/ExpiryAlertToast';
import { AuthMode, ShortUrl, AppTab } from './types';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('shorten');
  const [authModalMode, setAuthModalMode] = useState<AuthMode | null>(null);
  const [qrModal, setQrModal] = useState<{ url: string; title?: string } | null>(null);
  const [redirectShortCode, setRedirectShortCode] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Check initial URL pathname for shortcode redirection (e.g. /aB72x9)
  useEffect(() => {
    const parseCurrentPath = () => {
      // 1. Check search parameters (?c=... or ?code=...)
      const searchParams = new URLSearchParams(window.location.search);
      const queryCode = searchParams.get('code') || searchParams.get('c') || searchParams.get('link');
      if (queryCode && queryCode.trim()) {
        setRedirectShortCode(queryCode.trim());
        return;
      }

      // 2. Check hash route (e.g. #/xyz or #pricing)
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (hash === 'features' || hash === 'pricing' || hash === 'settings' || hash === 'links') {
        setActiveTab(hash as AppTab);
        return;
      }
      if (hash && !hash.includes('/') && !hash.includes('?') && hash.length <= 32) {
        setRedirectShortCode(hash);
        return;
      }

      // 3. Check pathname (e.g. /xyz)
      const rawPath = window.location.pathname.replace(/^\/+/, '').trim();
      const firstSegment = rawPath.split('/')[0];
      // Check if path matches application tabs
      if (firstSegment === 'features') {
        setActiveTab('features');
        return;
      }
      if (firstSegment === 'pricing') {
        setActiveTab('pricing');
        return;
      }
      if (firstSegment === 'settings') {
        setActiveTab('settings');
        return;
      }
      if (firstSegment === 'links') {
        setActiveTab('links');
        return;
      }

      // Exclude static assets or internal paths
      if (!firstSegment || firstSegment.includes('.') || firstSegment === 'api' || firstSegment === 'dist') {
        setRedirectShortCode(null);
        return;
      }
      setRedirectShortCode(firstSegment);
    };

    parseCurrentPath();

    const handlePopState = () => {
      parseCurrentPath();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleGoHome = () => {
    window.history.pushState({}, '', '/');
    setRedirectShortCode(null);
    setActiveTab('shorten');
  };

  const handleOpenQr = (url: string, title?: string) => {
    setQrModal({ url, title });
  };

  const handleUrlCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // If visiting /:shortCode, render dedicated redirection screen
  if (redirectShortCode) {
    return (
      <RedirectHandler
        shortCode={redirectShortCode}
        onGoHome={handleGoHome}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-slate-100 selection:bg-indigo-500 selection:text-white font-sans antialiased relative overflow-x-hidden">
      {/* Frosted Glass Ambient Blur Orbs */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/25 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/3 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {activeTab === 'shorten' && (
          <>
            {/* Hero & Shortener Input */}
            <ShortenerSection
              onUrlCreated={handleUrlCreated}
              onOpenQr={handleOpenQr}
              onTriggerAuth={(mode) => setAuthModalMode(mode)}
              onViewDashboard={() => setActiveTab('links')}
            />

            {/* Why Choose my.short Feature Cards */}
            <FeaturesSection />

            {/* Call to Action Banner */}
            <CtaBanner
              onGetStarted={() => setAuthModalMode('signup')}
              isLoggedIn={Boolean(user)}
            />
          </>
        )}

        {activeTab === 'links' && (
          /* User Member Dashboard (or Guest Upgrade View) */
          <UserDashboard
            key={refreshKey}
            onOpenQr={handleOpenQr}
            onNavigateHome={() => setActiveTab('shorten')}
            onTriggerAuth={(mode = 'signup') => setAuthModalMode(mode)}
            onNavigateSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'settings' && (
          /* Custom Domain Settings & Verification Interface */
          <SettingsPage
            onTriggerAuth={(mode = 'signup') => setAuthModalMode(mode)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'features' && (
          /* Comprehensive Features Page with Illustration */
          <FeaturesPage
            onNavigateHome={() => setActiveTab('shorten')}
            onTriggerAuth={(mode = 'signup') => setAuthModalMode(mode)}
          />
        )}

        {activeTab === 'pricing' && (
          /* Pricing Page with Cloud Infrastructure diagram and FAQs */
          <PricingPage
            onTriggerAuth={(mode = 'signup') => setAuthModalMode(mode)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Link Expiry Alert Toast: Small, unobtrusive alert 24h before custom-alias link expires */}
      <ExpiryAlertToast
        onViewDashboard={() => setActiveTab('links')}
        onLinkUpdated={() => setRefreshKey((prev) => prev + 1)}
      />

      {/* Footer */}
      <Footer onNavigateTab={(tab) => setActiveTab(tab)} />

      {/* Authentication Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
          }}
        />
      )}

      {/* QR Code Modal */}
      {qrModal && (
        <QrCodeModal
          shortUrl={qrModal.url}
          title={qrModal.title}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}