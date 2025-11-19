import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';

interface WebMapProps {
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  listings: any[];
  onMarkerPress?: (listing: any) => void;
  style?: any;
  children?: React.ReactNode;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export default function WebMap({ region, listings, onMarkerPress, style }: WebMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setLoadError('Google Maps API key not configured');
      console.warn('⚠️ VITE_GOOGLE_MAPS_API_KEY not found in environment variables');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      return;
    }

    // Load Google Maps script with async loading
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Wait a moment for Google Maps to fully initialize
      setTimeout(() => {
        if (window.google && window.google.maps && window.google.maps.Map) {
          setIsLoaded(true);
          console.log('✅ Google Maps API loaded successfully');
        } else {
          console.warn('⚠️ Google Maps script loaded but API not ready');
          // Try again after a short delay
          setTimeout(() => {
            if (window.google && window.google.maps && window.google.maps.Map) {
              setIsLoaded(true);
            } else {
              setLoadError('Google Maps API failed to initialize');
            }
          }, 500);
        }
      }, 100);
    };
    script.onerror = () => {
      setLoadError('Failed to load Google Maps');
      console.error('❌ Failed to load Google Maps script');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove script if component unmounts
      const scriptToRemove = document.querySelector('script[src*="maps.googleapis.com"]');
      if (scriptToRemove && scriptToRemove.parentNode) {
        scriptToRemove.parentNode.removeChild(scriptToRemove);
      }
    };
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;
    
    // Wait for Google Maps to be fully available
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.warn('Google Maps API not fully loaded yet');
      return;
    }

    const center = {
      lat: region.latitude,
      lng: region.longitude,
    };

    // Calculate zoom level from delta (approximate)
    const zoom = Math.round(Math.log(360 / region.longitudeDelta) / Math.LN2);

    // Initialize map
    if (!mapInstanceRef.current) {
      try {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center,
          zoom: Math.max(zoom, 6), // Minimum zoom level
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });
        console.log('✅ Google Map initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing Google Map:', error);
        setLoadError('Failed to initialize map');
      }
    } else {
      // Update map center and zoom if region changes
      try {
        mapInstanceRef.current.setCenter(center);
        mapInstanceRef.current.setZoom(Math.max(zoom, 6));
      } catch (error) {
        console.error('Error updating map:', error);
      }
    }
  }, [isLoaded, region]);

  // Update markers when listings change
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Create markers for each listing
    listings.forEach((listing) => {
      if (!listing.latitude || !listing.longitude) {
        console.warn(`Listing ${listing.id} missing coordinates`);
        return;
      }

      // Create a custom marker icon using a simple SVG without emoji
      const markerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#2E7D32',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      };

      const marker = new window.google.maps.Marker({
        position: {
          lat: parseFloat(listing.latitude),
          lng: parseFloat(listing.longitude),
        },
        map: mapInstanceRef.current,
        title: listing.title,
        icon: markerIcon,
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #333;">
              ${listing.title}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">
              £${listing.price || listing.price_per_night || 0}/night
            </p>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #999;">
              ${listing.location}
            </p>
            <p style="margin: 0; font-size: 12px; color: #2E7D32; font-weight: 600;">
              Wildness: ${listing.wildnessRating || listing.wildness_rating || 'N/A'}/5
            </p>
          </div>
        `,
      });

      // Add click handler
      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach((m) => {
          if (m.infoWindow) {
            m.infoWindow.close();
          }
        });

        infoWindow.open(mapInstanceRef.current, marker);
        
        // Call the onMarkerPress callback if provided
        if (onMarkerPress) {
          onMarkerPress(listing);
        }
      });

      // Store marker and info window
      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers if there are listings
    if (listings.length > 0 && markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach((marker) => {
        bounds.extend(marker.getPosition());
      });
      
      // Only fit bounds if we have multiple markers, otherwise just center on the marker
      if (markersRef.current.length > 1) {
        mapInstanceRef.current.fitBounds(bounds);
      } else {
        mapInstanceRef.current.setCenter(markersRef.current[0].getPosition());
        mapInstanceRef.current.setZoom(12);
      }
    }
  }, [isLoaded, listings, onMarkerPress]);

  // Get user location and center map
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Add user location marker
        if (!markersRef.current.find((m) => m.isUserLocation)) {
          const userMarker = new window.google.maps.Marker({
            position: userLocation,
            map: mapInstanceRef.current,
            title: 'Your Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#2196F3',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            },
            zIndex: 1000,
          });
          userMarker.isUserLocation = true;
          markersRef.current.push(userMarker);
        }

        // Center map on user location if no listings
        if (listings.length === 0) {
          mapInstanceRef.current.setCenter(userLocation);
          mapInstanceRef.current.setZoom(10);
        }
      },
      (error) => {
        console.warn('Could not get user location:', error);
      }
    );
  }, [isLoaded, listings.length]);

  if (loadError) {
    return (
      <View style={[styles.container, style]}>
        <div style={styles.errorContainer as any}>
          <p style={styles.errorText as any}>⚠️ {loadError}</p>
          <p style={styles.errorSubtext as any}>
            Please configure VITE_GOOGLE_MAPS_API_KEY in your environment variables
          </p>
        </div>
      </View>
    );
  }

  if (!isLoaded) {
    return (
      <View style={[styles.container, style]}>
        <div style={styles.loadingContainer as any}>
          <p style={styles.loadingText as any}>🗺️ Loading map...</p>
        </div>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <div ref={mapRef} style={styles.map as any} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f5e8',
  },
  loadingText: {
    fontSize: 18,
    color: '#2E7D32',
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
