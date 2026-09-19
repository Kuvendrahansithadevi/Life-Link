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
import HospitalDashboardScreen from "./pages/HospitalDashboardScreen";
import MyBookingsScreen from "./pages/MyBookingsScreen";
import LandingPage from "./components/LandingPage";

import { STRINGS, SEED_USERS, SEED_REQUESTS } from "./data/constants";
import { BG_PATTERN_URL } from "./utils/helpers";

function readStoredUser() {
  try {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  } catch (err) {
    return null;
  }
}

export default function App() {
  const [language, setLanguage] = useState("en");
  const [tab, setTab] = useState("triage");
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState(null);
  const t = STRINGS[language];

  // Auth state
  const [currentUser, setCurrentUser] = useState(() => readStoredUser());
  const [users, setUsers] = useState(() => {
    const savedUser = readStoredUser();
    if (!savedUser || SEED_USERS.some((user) => user.id === savedUser.id)) return SEED_USERS;
    return [...SEED_USERS, savedUser];
  });
  const [authedUserId, setAuthedUserId] = useState(() => readStoredUser()?.id || null);
  const [isAdmin, setIsAdmin] = useState(() => {
    const savedUser = readStoredUser();
    return savedUser?.role === "admin";
  });
  const [authScreen, setAuthScreen] = useState("login"); // login/signup handled inside AuthScreen, this only toggles admin login
  const [showLanding, setShowLanding] = useState(() => !readStoredUser());

  // Blood requests (lifted so the admin dashboard can see them too)
  const [requests, setRequests] = useState(SEED_REQUESTS);

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

  const handleLogin = (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    setUsers((existingUsers) => {
      const existingUser = existingUsers.find((candidate) => candidate.id === user.id);
      return existingUser
        ? existingUsers.map((candidate) => (candidate.id === user.id ? { ...candidate, ...user } : candidate))
        : [...existingUsers, user];
    });
    setCurrentUser(user);
    setAuthedUserId(user.id);
    setIsAdmin(false);
    setTab("triage");
    setShowLanding(false);
  };

  const handleSignup = (newUser) => {
    localStorage.setItem("user", JSON.stringify(newUser));
    setUsers((us) => [...us, newUser]);
    setCurrentUser(newUser);
    setAuthedUserId(newUser.id);
    setIsAdmin(false);
    setTab("triage");
    setShowLanding(false);
  };

  const handleAdminLogin = (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
      setCurrentUser(user);
    }
    setIsAdmin(user?.role === "admin");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setAuthedUserId(null);
    setIsAdmin(false);
    setAuthScreen("login");
    setShowLanding(true);
    setEmergencyMode(false);
    setEmergencyResult(null);
    setTab("triage");
  };

  const openEmergencyMode = (result = null) => {
    setEmergencyResult(result);
    setEmergencyMode(true);
  };

  const handleUpdateUser = (fields) => {
    setUsers((us) => us.map((u) => (u.id === authedUserId ? { ...u, ...fields } : u)));
    setCurrentUser((user) => {
      const updatedUser = user ? { ...user, ...fields } : user;
      if (updatedUser) localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const handleBecomeDonor = (donorFields) => {
    const isDonor = donorFields.isDonor ?? true;
    setUsers((us) => us.map((u) => (u.id === authedUserId ? { ...u, ...donorFields, isDonor } : u)));
    setCurrentUser((user) => {
      const updatedUser = user ? { ...user, ...donorFields, isDonor } : user;
      if (updatedUser) localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const handleAddRequest = (req) => {
    setRequests((rs) => [req, ...rs]);
  };

  // ---- Not signed in: user auth or admin auth ----
  if (!currentUser && !isAdmin) {
    if (showLanding) {
      return (
        <LandingPage
          onLogin={() => {
            setAuthScreen("login");
            setShowLanding(false);
          }}
          onSignup={() => {
            setAuthScreen("signup");
            setShowLanding(false);
          }}
        />
      );
    }
    if (authScreen === "adminLogin") {
      return <AdminLoginScreen onLogin={handleAdminLogin} onBack={() => setAuthScreen("login")} />;
    }
    return (
      <AuthScreen
        users={users}
        initialMode={authScreen}
        onLogin={handleLogin}
        onSignup={handleSignup}
        onGoToAdmin={() => setAuthScreen("adminLogin")}
      />
    );
  }

  // ---- Admin dashboard ----
  if (isAdmin) {
    return (
      <AdminDashboard
        users={users}
        requests={requests}
        onLogout={handleLogout}
      />
    );
  }

  if (currentUser?.role === "hospital") {
    return <HospitalDashboardScreen currentUser={currentUser} onLogout={handleLogout} />;
  }

  // ---- Signed-in user app ----
  if (emergencyMode) {
    return (
      <EmergencyModeScreen
        onExit={() => setEmergencyMode(false)}
        t={t}
        currentUser={currentUser}
        triageResult={emergencyResult}
      />
    );
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
          onEmergency={() => openEmergencyMode()}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          <main
            className="relative flex-1 bg-stone-50"
            style={{ backgroundImage: BG_PATTERN_URL, backgroundRepeat: "repeat" }}
          >
            {tab === "triage" && (
              <TriageScreen
                onTriggerEmergency={openEmergencyMode}
                language={language}
                currentUser={currentUser}
              />
            )}
            {tab === "hospitals" && <HospitalDirectory currentUser={currentUser} />}
            {tab === "bookings" && <MyBookingsScreen currentUser={currentUser} />}
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
