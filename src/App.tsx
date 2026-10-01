import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { ShortenerSection } from './components/ShortenerSection';
import { FeaturesSection } from './components/FeaturesSection';
import { CtaBanner } from './components/CtaBanner';
import { UserDashboard } from './components/UserDashboard';
import { SettingsPage } from './components/SettingsPage';
import { FeaturesPage } from './components/FeaturesPage';
import { PricingPage } from './components/PricingPage';
import { UtmBuilder } from './components/UtmBuilder';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';
import { ContactPage } from './components/ContactPage';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { QrCodeModal } from './components/QrCodeModal';
import { RedirectHandler } from './components/RedirectHandler';
import { ExpiryAlertToast } from './components/ExpiryAlertToast';
import { AuthMode, ShortUrl, AppTab } from './types';

const TAB_TITLES: Record<AppTab, string> = {
  shorten: 'my.short - Fast URL Shortener & Real-Time UTM Telemetry',
  links: 'My Links & Telemetry Dashboard - my.short',
  utm: 'UTM Campaign Builder & Attribution - my.short',
  settings: 'Custom Domains, API Tokens & Webhooks - my.short',
  features: 'Platform Features & Click Telemetry - my.short',
  pricing: 'Simple & Transparent Pricing - my.short',
  privacy: 'Privacy Policy - my.short',
  terms: 'Terms of Service - my.short',
  contact: 'Contact Support & Report Abuse - my.short',
};

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('shorten');
  const [authModalMode, setAuthModalMode] = useState<AuthMode | null>(null);
  const [qrModal, setQrModal] = useState<{ url: string; title?: string } | null>(null);
  const [redirectShortCode, setRedirectShortCode] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync document title and canonical tag whenever activeTab changes
  useEffect(() => {
    document.title = TAB_TITLES[activeTab] || TAB_TITLES.shorten;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const currentOrigin = window.location.origin;
    canonical.href = activeTab === 'shorten' ? `${currentOrigin}/` : `${currentOrigin}/${activeTab}`;
  }, [activeTab]);

  // Navigate tab and update browser history URL cleanly
  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    setRedirectShortCode(null);
    const newPath = tab === 'shorten' ? '/' : `/${tab}`;
    if (window.location.pathname !== newPath) {
      window.history.pushState({ tab }, '', newPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check initial URL pathname for shortcode redirection or tabs (e.g. /privacy, /terms, /xyz)
  useEffect(() => {
    const parseCurrentPath = () => {
      // 1. Check search parameters (?c=... or ?code=...)
      const searchParams = new URLSearchParams(window.location.search);
      const queryCode = searchParams.get('code') || searchParams.get('c') || searchParams.get('link');
      if (queryCode && queryCode.trim()) {
        setRedirectShortCode(queryCode.trim());
        return;
      }

      // 2. Check hash route (e.g. #/privacy or #contact)
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      const validTabs: AppTab[] = [
        'shorten',
        'links',
        'utm',
        'settings',
        'features',
        'pricing',
        'privacy',
        'terms',
        'contact',
      ];
      if (validTabs.includes(hash as AppTab)) {
        setActiveTab(hash as AppTab);
        return;
      }

      // 3. Check pathname (e.g. /features, /privacy, /aB72x9)
      const rawPath = window.location.pathname.replace(/^\/+/, '').trim();
      const firstSegment = rawPath.split('/')[0];

      if (validTabs.includes(firstSegment as AppTab)) {
        setActiveTab(firstSegment as AppTab);
        return;
      }

      // Exclude static assets or internal paths
      if (
        !firstSegment ||
        firstSegment.includes('.') ||
        firstSegment === 'api' ||
        firstSegment === 'dist' ||
        firstSegment === 'images' ||
        firstSegment === 'robots.txt' ||
        firstSegment === 'sitemap.xml'
      ) {
        setRedirectShortCode(null);
        return;
      }

      // It is a short code redirection!
      setRedirectShortCode(firstSegment);
    };

    parseCurrentPath();

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
        setRedirectShortCode(null);
      } else {
        parseCurrentPath();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleGoHome = () => {
    handleSelectTab('shorten');
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
      {/* Ambient Glow Orbs */}
      <div className="fixed top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/25 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/3 -translate-y-1/2 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenAuth={(mode) => setAuthModalMode(mode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {activeTab === 'shorten' && (
          <>
            <ShortenerSection
              onUrlCreated={handleUrlCreated}
              onOpenQr={handleOpenQr}
              onTriggerAuth={(mode) => setAuthModalMode(mode)}
              onViewDashboard={() => handleSelectTab('links')}
            />
            <FeaturesSection />
            <CtaBanner
              onGetStarted={() => setAuthModalMode('signup')}
              isLoggedIn={Boolean(user)}
            />
          </>
        )}

        {activeTab === 'links' && (
          <UserDashboard
            key={refreshKey}
            onOpenQr={handleOpenQr}
            onNavigateHome={() => handleSelectTab('shorten')}
            onTriggerAuth={(mode = 'signup') => setAuthModalMode(mode)}
            onNavigateSettings={() => handleSelectTab('settings')}
          />
        )}

        {activeTab === 'utm' && (
          <UtmBuilder
            onOpenAuth={(mode = 'signup') => setAuthModalMode(mode)}
            onShortenUrl={() => setRefreshKey((prev) => prev + 1)}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            onTriggerAuth={(mode = 'signup') => setAuthModalMode(mode)}
            onNavigateTab={handleSelectTab}
          />
        )}

        {activeTab === 'features' && (
          <FeaturesPage
            onNavigateHome={() => handleSelectTab('shorten')}
            onTriggerAuth={(mode = 'signup') => setAuthModalMode(mode)}
          />
        )}

        {activeTab === 'pricing' && (
          <PricingPage
            onTriggerAuth={(mode = 'signup') => setAuthModalMode(mode)}
            onNavigateTab={handleSelectTab}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacyPage
            onNavigateHome={() => handleSelectTab('shorten')}
            onNavigateTab={handleSelectTab}
          />
        )}

        {activeTab === 'terms' && (
          <TermsPage
            onNavigateHome={() => handleSelectTab('shorten')}
            onNavigateTab={handleSelectTab}
          />
        )}

        {activeTab === 'contact' && (
          <ContactPage
            onNavigateHome={() => handleSelectTab('shorten')}
            onNavigateTab={handleSelectTab}
          />
        )}
      </main>

      {/* Link Expiry Alert Toast */}
      <ExpiryAlertToast
        onViewDashboard={() => handleSelectTab('links')}
        onLinkUpdated={() => setRefreshKey((prev) => prev + 1)}
      />

      {/* Footer */}
      <Footer onNavigateTab={handleSelectTab} />

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
