import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layout/Layout";
import Login from "./pages/0.Auth/Login";
import Dashboard from "./pages/1.Dashboard/Dashboard";
import MyProfile from "./pages/2.MyProfile/MyProfile";

import DirectMessages from "./pages/4.DirectMessages/DirectMessages";
import Notifications from "./pages/5.Notifications/Notifications";
import Settings from "./pages/6.Settings/Settings";
import ProtectedRoutes from "./routes/ProtectedRoutes";
import OrdinaryRoutes from "./routes/OrdinaryRoutes";
import ResearchRequests from "./pages/3.ResearchRequests/ResearchRequests";
import SubmitResearchRequest from "./pages/3.ResearchRequests/SubmitResearchRequest";
import Evaluations from "./pages/7.Evaluations/Evaluations";
import Documents from "./pages/8.Documents/Documents";
import ResearchClinic from "./pages/9.ResearchClinic/ResearchClinic";
import Appointments from "./pages/10.Appointments/Appointments";

// PWA Component
import PWAInstaller from "./components/PWAInstaller";
import PWAUpdateToast from "./components/PWAUpdateToast";
import SupportChatWidget from "./components/SupportChatWidget";
import SupportTickets from "./pages/11.SupportTickets/SupportTickets";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <Layout />
            </ProtectedRoutes>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/requests" element={<ResearchRequests />} />
          <Route path="/requests/submit" element={<SubmitResearchRequest />} />
          <Route path="/research-clinic" element={<ResearchClinic />} />
          <Route path="/evaluations" element={<Evaluations />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/direct-messages" element={<DirectMessages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/support-tickets" element={<SupportTickets />} />
        </Route>
        
        <Route element={<OrdinaryRoutes />}>
          <Route path="/login" element={<Login />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* PWA Installer - shows on all pages including login */}
      <PWAInstaller />

      {/* PWA Update - prompts to reload when a new version is available */}
      <PWAUpdateToast />
      
      {/* Floating Support Chat Widget */}
      <SupportChatWidget />
    </Router>
  );
}

export default App;
