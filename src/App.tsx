
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import DashboardLayout from "./components/DashboardLayout";
import { LandingPage } from "./components/LandingPage";
import { Header } from "./components/Header";
import { scrollToHeroSection } from "./utils/navigation";
import { useAuth } from "./hooks/useAuth";


function App() {
  const { address, isConnected } = useAccount();
  // For now, use wallet connection as authentication
  const isAuthenticated = isConnected;
  const user = isConnected ? { email: `${address?.slice(0, 6)}...${address?.slice(-4)}` } : null;
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("revatix_active_tab") || "landing";
  });

  // persist active tab
  useEffect(() => {
    localStorage.setItem("revatix_active_tab", activeTab);
  }, [activeTab]);

  // handle redirects
  useEffect(() => {
    // Redirect to dashboard when wallet connects OR user logs in
    if ((isConnected || isAuthenticated) && activeTab === "landing") {
      setActiveTab("dashboard");
    } 
    // Redirect to landing page when wallet disconnects OR user logs out
    else if ((!isConnected && !isAuthenticated) && !["landing"].includes(activeTab)) {
      setActiveTab("landing");
      
      // Scroll to hero section when redirected to landing page (only on disconnect/logout)
      setTimeout(() => {
        scrollToHeroSection();
      }, 100);
    }
  }, [isConnected, isAuthenticated, activeTab]);

  const renderActiveComponent = () => {
    if ((isConnected || isAuthenticated) && ["dashboard", "employees", "bulk-transfer", "ai-assistant-chat", "ai-assistant-history", "settings"].includes(activeTab)) {
      return <DashboardLayout companyName={"My Company"} />;
    }
    return (
      <LandingPage 
        isWalletConnected={isConnected}
        onNavigateToDashboard={() => setActiveTab("dashboard")}
      />
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="relative z-10">
        {(!isConnected && !isAuthenticated) && activeTab !== "landing" && (
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isWalletConnected={isConnected}
            walletAddress={address || ""}
            onGetStarted={() => setActiveTab("dashboard")}
            user={user}
          />
        )}
        

        <main className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={(isConnected || isAuthenticated) ? "dashboard" : "landing"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderActiveComponent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
   
    </div>
  );
}

export default App;
