import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';


// Public Pages
import { LandingPage } from './pages/LandingPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { BrowseItemsPage } from './pages/BrowseItemsPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { ReportLostPage } from './pages/student/ReportLostPage';
import { ReportFoundPage } from './pages/student/ReportFoundPage';
import { MyReportsPage } from './pages/student/MyReportsPage';
import { MyClaimsPage } from './pages/student/MyClaimsPage';
import { StudentMatchesPage } from './pages/student/StudentMatchesPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Officer Pages
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { HandoverProcessPage } from './pages/officer/HandoverProcessPage';
import { HandoverHistoryPage } from './pages/officer/HandoverHistoryPage';
import { OfficerFoundItemsPage } from './pages/officer/OfficerFoundItemsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLostReports } from './pages/admin/AdminLostReports';
import { AdminFoundReports } from './pages/admin/AdminFoundReports';
import { AdminClaimsReview } from './pages/admin/AdminClaimsReview';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminLocations } from './pages/admin/AdminLocations';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminReportExport } from './pages/admin/AdminReportExport';

// Route Guard for Authenticated Users — also handles role-based redirect
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated, isAdmin, isOfficer, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-campus-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <Sidebar />
      <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-y-auto max-w-7xl w-full min-w-0">
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
};


// Redirect /dashboard to role-specific home
const RoleHomeRedirect: React.FC = () => {
  const { isAdmin, isOfficer } = useAuth();
  if (isAdmin) return <Navigate to="/admin" replace />;
  if (isOfficer) return <Navigate to="/officer" replace />;
  return <StudentDashboard />;
};

// Route Guard for Officer & Admin
const OfficerGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOfficer, loading } = useAuth();
  if (loading) return null;
  if (!isOfficer) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

// Route Guard for Admin Only
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
            <Navbar />

            <div className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/how-it-works" element={<Navigate to="/" replace />} />
                <Route path="/items" element={<BrowseItemsPage />} />
                <Route path="/items/:type/:id" element={<ItemDetailPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected Student / General Portal Routes */}
                <Route element={<ProtectedLayout />}>
                  <Route path="/dashboard" element={<RoleHomeRedirect />} />
                  <Route path="/report-lost" element={<ReportLostPage />} />
                  <Route path="/report-found" element={<ReportFoundPage />} />
                  <Route path="/dashboard/reports" element={<MyReportsPage />} />
                  <Route path="/dashboard/claims" element={<MyClaimsPage />} />
                  <Route path="/dashboard/matches" element={<StudentMatchesPage />} />
                  <Route path="/profile" element={<StudentProfilePage />} />

                  {/* Officer Portal Routes */}
                  <Route
                    path="/officer"
                    element={
                      <OfficerGuard>
                        <OfficerDashboard />
                      </OfficerGuard>
                    }
                  />
                  <Route
                    path="/officer/handover"
                    element={
                      <OfficerGuard>
                        <HandoverProcessPage />
                      </OfficerGuard>
                    }
                  />
                  <Route
                    path="/officer/history"
                    element={
                      <OfficerGuard>
                        <HandoverHistoryPage />
                      </OfficerGuard>
                    }
                  />
                  <Route
                    path="/officer/inventory"
                    element={
                      <OfficerGuard>
                        <OfficerFoundItemsPage />
                      </OfficerGuard>
                    }
                  />

                  {/* Admin Portal Routes */}
                  <Route
                    path="/admin"
                    element={
                      <AdminGuard>
                        <AdminDashboard />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/lost-reports"
                    element={
                      <AdminGuard>
                        <AdminLostReports />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/found-reports"
                    element={
                      <AdminGuard>
                        <AdminFoundReports />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/claims"
                    element={
                      <AdminGuard>
                        <AdminClaimsReview />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <AdminGuard>
                        <AdminCategories />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/locations"
                    element={
                      <AdminGuard>
                        <AdminLocations />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminGuard>
                        <AdminUsers />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/audit-logs"
                    element={
                      <AdminGuard>
                        <AdminAuditLogs />
                      </AdminGuard>
                    }
                  />
                  <Route
                    path="/admin/export"
                    element={
                      <AdminGuard>
                        <AdminReportExport />
                      </AdminGuard>
                    }
                  />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>

            <Footer />
          </div>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};
