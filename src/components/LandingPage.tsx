import React from 'react';
import AlgopayLandingPage from './AlgopayLandingPage';

interface LandingPageProps {
  isWalletConnected?: boolean;
  onNavigateToDashboard?: () => void;
}

export const LandingPage = ({ isWalletConnected = false, onNavigateToDashboard }: LandingPageProps) => {
  return (
    <AlgopayLandingPage 
      isWalletConnected={isWalletConnected}
      onNavigateToDashboard={onNavigateToDashboard}
    />
  );
};