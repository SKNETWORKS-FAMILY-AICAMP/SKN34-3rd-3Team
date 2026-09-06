import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './components/layout/RootLayout.jsx';

import HomePage from './pages/HomePage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// 온보딩
import SignupPage from './pages/onboarding/SignupPage.jsx';
import LoginPage from './pages/onboarding/LoginPage.jsx';
import FindAccountPage from './pages/onboarding/FindAccountPage.jsx';
import PrivacyConsentPage from './pages/onboarding/PrivacyConsentPage.jsx';
import ProfilePage from './pages/onboarding/ProfilePage.jsx';

// 창업 전
import SubsidyExplorePage from './pages/before/SubsidyExplorePage.jsx';
import IndustryComparePage from './pages/before/IndustryComparePage.jsx';

// 창업 준비
import BizTypeDiagnosisPage from './pages/prepare/BizTypeDiagnosisPage.jsx';
import TaxReliefCheckPage from './pages/prepare/TaxReliefCheckPage.jsx';
import SupportProgramPage from './pages/prepare/SupportProgramPage.jsx';

// 창업 후
import TaxSchedulePage from './pages/after/TaxSchedulePage.jsx';
import PolicyExplorePage from './pages/after/PolicyExplorePage.jsx';
import ExpenseAgentPage from './pages/after/ExpenseAgentPage.jsx';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },

      // ----- 온보딩 -----
      { path: 'signup', element: <SignupPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'find-account', element: <FindAccountPage /> },
      { path: 'privacy-consent', element: <PrivacyConsentPage /> },
      { path: 'profile', element: <ProfilePage /> },

      // ----- 창업 전 -----
      { path: 'before/subsidies', element: <SubsidyExplorePage /> },
      { path: 'before/industry-compare', element: <IndustryComparePage /> },

      // ----- 창업 준비 -----
      { path: 'prepare/biz-type', element: <BizTypeDiagnosisPage /> },
      { path: 'prepare/tax-relief', element: <TaxReliefCheckPage /> },
      { path: 'prepare/support-programs', element: <SupportProgramPage /> },

      // ----- 창업 후 -----
      { path: 'after/tax-schedule', element: <TaxSchedulePage /> },
      { path: 'after/policies', element: <PolicyExplorePage /> },
      { path: 'after/expense-agent', element: <ExpenseAgentPage /> },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
