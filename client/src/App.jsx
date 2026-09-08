import React, { useState } from "react";
import { Heart } from "lucide-react";

import Sidebar from "./components/Sidebar";
import AuthScreen from "./components/AuthScreen";
import AdminLoginScreen from "./components/AdminLoginScreen";
import TriageScreen from "./components/TriageScreen";
import HospitalDirectory from "./components/HospitalDirectory";
import BloodDonorScreen from "./components/BloodDonorScreen";
import ProfileScreen from "./components/ProfileScreen";
import EmergencyModeScreen from "./components/EmergencyModeScreen";
import AdminDashboard from "./components/AdminDashboard";

import { STRINGS, SEED_USERS, SEED_REQUESTS } from "./data/constants";
import { BG_PATTERN_URL } from "./utils/helpers";

export default function App() {
  const [language, setLanguage] = useState("en");
  const [tab, setTab] = useState("triage");
  const [emergencyMode, setEmergencyMode] = useState(false);
  const t = STRINGS[language];

  // Auth state
  const [users, setUsers] = useState(SEED_USERS);
  const [authedUserId, setAuthedUserId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authScreen, setAuthScreen] = useState("login"); // login/signup handled inside AuthScreen, this only toggles admin login

  // Blood requests (lifted so the admin dashboard can see them too)
  const [requests, setRequests] = useState(SEED_REQUESTS);

  const currentUser = users.find((u) => u.id === authedUserId) || null;
  const registeredDonors = users
    .filter((u) => u.isDonor)
    .map((u) => ({
      id: u.id,
      name: u.username,
      bloodGroup: u.bloodGroup,
      location: u.address,
      distance: "—",
      phone: u.phone,
      lastDonated: "Registered via LIFE LINK",
    }));

  const handleLogin = (userId) => {
    setAuthedUserId(userId);
    setTab("triage");
  };

  const handleSignup = (newUser) => {
    setUsers((us) => [...us, newUser]);
    setAuthedUserId(newUser.id);
    setTab("triage");
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
  };

  const handleLogout = () => {
    setAuthedUserId(null);
    setIsAdmin(false);
    setAuthScreen("login");
    setEmergencyMode(false);
    setTab("triage");
  };

  const handleUpdateUser = (fields) => {
    setUsers((us) => us.map((u) => (u.id === authedUserId ? { ...u, ...fields } : u)));
  };

  const handleBecomeDonor = (donorFields) => {
    setUsers((us) => us.map((u) => (u.id === authedUserId ? { ...u, ...donorFields, isDonor: true } : u)));
  };

  const handleAddRequest = (req) => {
    setRequests((rs) => [req, ...rs]);
  };

  const handleRemoveRequest = (id) => {
    setRequests((rs) => rs.filter((r) => r.id !== id));
  };

  // ---- Not signed in: user auth or admin auth ----
  if (!currentUser && !isAdmin) {
    if (authScreen === "adminLogin") {
      return <AdminLoginScreen onLogin={handleAdminLogin} onBack={() => setAuthScreen("login")} />;
    }
    return (
      <AuthScreen
        users={users}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onGoToAdmin={() => setAuthScreen("adminLogin")}
      />
    );
  }

  // ---- Admin dashboard ----
  if (isAdmin) {
    return (
      <AdminDashboard users={users} requests={requests} onRemoveRequest={handleRemoveRequest} onLogout={handleLogout} />
    );
  }

  // ---- Signed-in user app ----
  if (emergencyMode) {
    return <EmergencyModeScreen onExit={() => setEmergencyMode(false)} t={t} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="flex">
        <Sidebar
          tab={tab}
          setTab={setTab}
          language={language}
          setLanguage={setLanguage}
          t={t}
          onEmergency={() => setEmergencyMode(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          <main
            className="relative flex-1 bg-stone-50"
            style={{ backgroundImage: BG_PATTERN_URL, backgroundRepeat: "repeat" }}
          >
            {tab === "triage" && <TriageScreen onTrigger={() => setEmergencyMode(true)} />}
            {tab === "hospitals" && <HospitalDirectory />}
            {tab === "blood" && (
              <BloodDonorScreen
                currentUser={currentUser}
                requests={requests}
                onAddRequest={handleAddRequest}
                onBecomeDonor={handleBecomeDonor}
                registeredDonors={registeredDonors}
              />
            )}
            {tab === "profile" && <ProfileScreen currentUser={currentUser} onUpdateUser={handleUpdateUser} />}
          </main>

          <footer className="border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-400">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-red-500" fill="currentColor" />
              LIFE LINK is a prototype for demonstration purposes. In a real emergency, always call your local
              emergency number.
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}
