import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import SearchScreen from './screens/SearchScreen';
import ListingsScreen from './screens/ListingsScreen';
import MessagesScreen from './screens/MessagesScreen';
import ProfileScreen from './screens/ProfileScreen';
import BookingScreen from './screens/BookingScreen';
import ReviewScreen from './screens/ReviewScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import CreateListingScreen from './screens/CreateListingScreen';
import EditListingScreen from './screens/EditListingScreen';
import FarmerRatingScreen from './screens/FarmerRatingScreen';
import BookingDetailsScreen from './screens/BookingDetailsScreen';
import BottomNavigation from './components/BottomNavigation';
import './App.css';

function AppContent() {
  const { currentUser } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenData, setScreenData] = useState<any>(null);

  const handleNavigate = (screen: string, data?: any) => {
    setCurrentScreen(screen);
    setScreenData(data);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'search':
        return <SearchScreen />;
      case 'listings':
        return <ListingsScreen onNavigate={handleNavigate} />;
      case 'messages':
        return <MessagesScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'booking':
        return <BookingScreen listing={screenData} />;
      case 'review':
        return <ReviewScreen />;
      case 'reviews':
        return <ReviewsScreen />;
      case 'create-listing':
        return <CreateListingScreen onNavigate={handleNavigate} />;
      case 'edit-listing':
        return <EditListingScreen listing={screenData} onNavigate={handleNavigate} />;
      case 'farmer-rating':
        return <FarmerRatingScreen onNavigate={handleNavigate} />;
      case 'booking-details':
        return <BookingDetailsScreen booking={screenData} onNavigate={handleNavigate} />;
      default:
        return <HomeScreen onNavigate={handleNavigate} />;
    }
  };

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, paddingBottom: '80px' }}>
        {renderScreen()}
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
        <BottomNavigation currentScreen={currentScreen} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App
