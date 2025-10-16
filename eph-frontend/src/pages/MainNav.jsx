import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import SidebarLayout from '../components/SidebarLayout';
import LandingPage from './LandingPage';           // Dashboard view
import CompetitionScreen from './CompetitionScreen';
import FeedScreen from './FeedScreen';
import PerksScreen from './PerksScreen';
import ProfileScreen from './ProfileScreen';
import AdminHubScreen from './AdminHubScreen';

// Put Dashboard first
const TABS_FOR_USER  = ['dashboard', 'competitions', 'feed', 'perks', 'profile', 'courses'];
const TABS_FOR_ADMIN = ['dashboard', 'competitions', 'feed', 'perks', 'profile', 'admin', 'courses'];

const MainNav = ({ initialPage = 'dashboard' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAdmin  = (user?.role || '').toLowerCase() === 'admin';
  const basePath = isAdmin ? '/admin' : '/main';

  const allowedTabs = useMemo(
    () => (isAdmin ? TABS_FOR_ADMIN : TABS_FOR_USER),
    [isAdmin]
  );

  const sanitizeTab = (tab) => {
    const t = (tab || '').toLowerCase();
    return allowedTabs.includes(t) ? t : 'dashboard';
  };

  // Initialize from URL (?tab=) or prop fallback
  const [currentPage, setCurrentPage] = useState(() =>
    sanitizeTab(new URLSearchParams(location.search).get('tab') || initialPage)
  );

  // Keep state in sync if ?tab= changes externally
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const tabInUrl = sanitizeTab(q.get('tab'));
    if (tabInUrl !== currentPage) setCurrentPage(tabInUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, allowedTabs.join('|')]);

  // If path doesn't match role basePath, correct it (preserve query)
  useEffect(() => {
    if (!location.pathname.startsWith(basePath)) {
      navigate({ pathname: basePath, search: location.search }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath]);

  // When sidebar changes, update both state and URL with correct basePath
  const handlePageChange = (page) => {
    const next = sanitizeTab(page);
    setCurrentPage(next);
    const q = new URLSearchParams(location.search);
    q.set('tab', next);
    navigate({ pathname: basePath, search: `?${q.toString()}` }, { replace: true });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <LandingPage embedded />;           // Dashboard shows LandingPage
      case 'competitions':
        return <CompetitionScreen />;
      case 'feed':
        return <FeedScreen />;
      case 'perks':
        return <PerksScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'courses':
        return null;                               // Courses content is handled by SidebarLayout
      case 'admin':
        return isAdmin ? <AdminHubScreen /> : <CompetitionScreen />;
      default:
        return <LandingPage embedded />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-primary-text">
      <SidebarLayout currentPage={currentPage} onPageChange={handlePageChange}>
        {renderCurrentPage()}
      </SidebarLayout>
    </div>
  );
};

export default MainNav;
