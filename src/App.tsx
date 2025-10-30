import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LandingPage from './screens/LandingPage';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
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
import FarmerReviewsScreen from './screens/FarmerReviewsScreen';
import BookingDetailsScreen from './screens/BookingDetailsScreen';
import FAQsScreen from './screens/FAQsScreen';
import AboutUsScreen from './screens/AboutUsScreen';
import TermsScreen from './screens/TermsScreen';
import PrivacyScreen from './screens/PrivacyScreen';
import JoinCamperScreen from './screens/JoinCamperScreen';
import JoinHostScreen from './screens/JoinHostScreen';
import ContactUsScreen from './screens/ContactUsScreen';
import WaiverViewScreen from './screens/WaiverViewScreen';
import AdminDashboard from './screens/AdminDashboard';
import UserManagement from './screens/UserManagement';
import UserDetails from './screens/UserDetails';
import ListingManagement from './screens/ListingManagement';
import BookingManagement from './screens/BookingManagement';
import AdminBookingDetails from './screens/AdminBookingDetails';
import SupportTickets from './screens/SupportTickets';
import TicketDetails from './screens/TicketDetails';
import ReviewsManagement from './screens/ReviewsManagement';
import BottomNavigation from './components/BottomNavigation';
import './App.css';

function AppContent() {
  const { currentUser, isAdmin } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [screenData, setScreenData] = useState<any>(null);

  const handleNavigate = (screen: string, data?: any) => {
    setCurrentScreen(screen);
    setScreenData(data);
    // Scroll to top when navigating - use requestAnimationFrame for better timing
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.body?.scrollTo(0, 0);
        document.documentElement?.scrollTo(0, 0);
      });
    }
  };

  // Scroll to top when screen changes (additional safeguard)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const scrollToTop = () => {
        window.scrollTo(0, 0);
        document.body?.scrollTo(0, 0);
        document.documentElement?.scrollTo(0, 0);
      };
      
      // Try immediately
      scrollToTop();
      
      // Try after paint
      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToTop);
      });
      
      // Try after a short delay
      setTimeout(scrollToTop, 100);
    }
  }, [currentScreen]);

  const renderScreen = () => {
    switch (currentScreen) {
      // Public screens
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginScreen onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterScreen onNavigate={handleNavigate} userRole={screenData as 'camper' | 'farmer'} />;
      case 'about':
        return <AboutUsScreen onNavigate={handleNavigate} />;
      case 'faqs':
        return <FAQsScreen onNavigate={handleNavigate} />;
      case 'terms':
        return <TermsScreen onNavigate={handleNavigate} />;
      case 'privacy':
        return <PrivacyScreen onNavigate={handleNavigate} />;
      case 'join-camper':
        return <JoinCamperScreen onNavigate={handleNavigate} />;
      case 'join-host':
        return <JoinHostScreen onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactUsScreen onNavigate={handleNavigate} />;
      case 'waiver':
        return (
          <WaiverViewScreen
            onNavigate={handleNavigate}
            listing={(screenData as any)?.listing}
            waiverType={(screenData as any)?.waiverType}
            form={(screenData as any)?.form}
          />
        );
      
      // Authenticated screens
      case 'home':
        return <HomeScreen onNavigate={handleNavigate} />;
      case 'search':
        return <SearchScreen />;
      case 'listings':
        return <ListingsScreen onNavigate={handleNavigate} />;
      case 'messages':
        return <MessagesScreen />;
      case 'profile':
        return <ProfileScreen onNavigate={handleNavigate} />;
      case 'booking':
        return (
          <BookingScreen
            listing={(screenData as any)?.listing || screenData}
            form={(screenData as any)?.form}
            onNavigate={handleNavigate}
          />
        );
      case 'review':
        return (
          <ReviewScreen
            listing={(screenData as any)?.listing}
            booking={(screenData as any)?.booking}
            onNavigate={handleNavigate}
          />
        );
      case 'reviews':
        return <ReviewsScreen />;
      case 'create-listing':
        return <CreateListingScreen onNavigate={handleNavigate} />;
      case 'edit-listing':
        return <EditListingScreen listing={screenData} onNavigate={handleNavigate} />;
      case 'farmer-rating':
        return <FarmerRatingScreen bookingId={(screenData as any)?.bookingId} onNavigate={handleNavigate} />;
      case 'farmer-reviews':
        return <FarmerReviewsScreen onNavigate={handleNavigate} />;
      case 'booking-details':
        return <BookingDetailsScreen booking={screenData} onNavigate={handleNavigate} />;
      
      // Admin screens
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'user-management':
        return <UserManagement onNavigate={handleNavigate} />;
      case 'user-details':
        return <UserDetails user={screenData} onNavigate={handleNavigate} />;
      case 'listing-management':
        return <ListingManagement onNavigate={handleNavigate} />;
      case 'booking-management':
        return <BookingManagement onNavigate={handleNavigate} />;
      case 'admin-booking-details':
        return <AdminBookingDetails booking={screenData} onNavigate={handleNavigate} />;
      case 'support-tickets':
        return <SupportTickets onNavigate={handleNavigate} />;
      case 'ticket-details':
        return <TicketDetails ticket={screenData} onNavigate={handleNavigate} />;
      case 'reviews-management':
        return <ReviewsManagement onNavigate={handleNavigate} />;
      
      default:
        return currentUser ? <HomeScreen onNavigate={handleNavigate} /> : <LandingPage onNavigate={handleNavigate} />;
    }
  };

  // Don't show bottom navigation for public pages
  const publicScreens = ['landing', 'login', 'register', 'about', 'faqs', 'terms', 'privacy', 'join-camper', 'join-host', 'contact'];
  const isPublicScreen = publicScreens.includes(currentScreen);
  
  // Admin screens require admin access
  const adminScreens = ['admin-dashboard', 'user-management', 'user-details', 'listing-management', 'booking-management', 'admin-booking-details', 'support-tickets', 'ticket-details', 'reviews-management'];
  const isAdminScreen = adminScreens.includes(currentScreen);

  // Redirect if trying to access admin screens without admin access
  if (isAdminScreen && !isAdmin()) {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (!currentUser && !isPublicScreen) {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, paddingBottom: isPublicScreen ? '0px' : '80px' }}>
        {renderScreen()}
      </div>
      {!isPublicScreen && currentUser && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
          <BottomNavigation currentScreen={currentScreen} onNavigate={handleNavigate} />
        </div>
      )}
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
