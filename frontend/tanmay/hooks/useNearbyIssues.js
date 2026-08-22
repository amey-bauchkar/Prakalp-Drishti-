import { useState, useEffect, useCallback } from 'react';
import { fetchNearbyIssues, upvoteIssue } from '../services/nearbyService';
import { hasUpvotedIssue } from '../utils/device';

// Default center coordinates: Mumbai, Maharashtra (BMC)
const DEFAULT_MUMBAI_COORDS = [19.0760, 72.8777];

export const useNearbyIssues = (initialRadius = 5000) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState('Acquiring location...');
  const [locationStatus, setLocationStatus] = useState('prompt'); // 'prompt' | 'granted' | 'denied' | 'fallback'
  const [radius, setRadius] = useState(initialRadius);
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('distance'); // 'distance' | 'upvotes'

  // Request browser geolocation
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser.');
      setUserLocation(DEFAULT_MUMBAI_COORDS);
      setLocationName('Mumbai, Maharashtra (Default)');
      setLocationStatus('fallback');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = [position.coords.latitude, position.coords.longitude];
        setUserLocation(coords);
        setLocationStatus('granted');
        setLocationName('Live GPS Location');
      },
      (err) => {
        console.warn('Geolocation access error, falling back to Mumbai default:', err.message);
        setUserLocation(DEFAULT_MUMBAI_COORDS);
        setLocationName('Mumbai, Maharashtra (Simulated GPS)');
        setLocationStatus('fallback');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  // Fetch issues whenever location, radius, or category changes
  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const lat = userLocation ? userLocation[0] : DEFAULT_RANCHI_COORDS[0];
      const lng = userLocation ? userLocation[1] : DEFAULT_RANCHI_COORDS[1];

      const data = await fetchNearbyIssues({
        lat,
        lng,
        radius,
        category: category === 'All' ? null : category,
      });

      // Apply sorting
      let sorted = [...data];
      if (sortBy === 'upvotes') {
        sorted.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
      } else {
        sorted.sort((a, b) => (a.distanceMeters || 0) - (b.distanceMeters || 0));
      }

      setIssues(sorted);
    } catch (err) {
      console.error('Error loading nearby issues:', err);
      setError('Could not load nearby issues. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userLocation, radius, category, sortBy]);

  // Initial trigger for location
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // Load issues when dependencies update
  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // Optimistic Upvote handler
  const handleUpvote = async (issueId) => {
    if (!issueId || hasUpvotedIssue(issueId)) return;

    // Optimistically bump upvote count in local state immediately
    setIssues((prevIssues) =>
      prevIssues.map((item) => {
        if (item._id === issueId) {
          const currentVotes = item.upvotes || 0;
          return {
            ...item,
            upvotes: currentVotes + 1,
            hasUpvoted: true,
          };
        }
        return item;
      })
    );

    // Call service to sync with backend & store in localStorage
    try {
      const result = await upvoteIssue(issueId);
      if (result.upvotes !== undefined) {
        setIssues((prevIssues) =>
          prevIssues.map((item) =>
            item._id === issueId ? { ...item, upvotes: result.upvotes } : item
          )
        );
      }
    } catch (err) {
      console.error('Error upvoting issue:', err);
    }
  };

  return {
    issues,
    loading,
    error,
    userLocation,
    locationName,
    locationStatus,
    radius,
    setRadius,
    category,
    setCategory,
    sortBy,
    setSortBy,
    refetch: loadIssues,
    requestLocation,
    handleUpvote,
  };
};

export default useNearbyIssues;
