import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { APIService } from '../services/APIService';
import { useSupabase } from '../lib/supabase';

interface FarmerReviewsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
}

export default function FarmerReviewsScreen({ onNavigate }: FarmerReviewsScreenProps = {}) {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, [currentUser]);

  const load = async () => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      // 1) Get farmer's listings
      const listings = await APIService.get<any>('listings', { select: '*', orderBy: { column: 'created_at', ascending: false } });
      const owned = (listings || []).filter((l: any) => (l.farmer_id || l.farmerId) === currentUser.id);
      const ownedIds = new Set(owned.map((l: any) => l.id));

      // 2) Get reviews (all), then filter to this farmer's listings
      const reviews = await APIService.get<any>('reviews', { select: '*', orderBy: { column: 'created_at', ascending: false } });
      const relevant = (reviews || []).filter((r: any) => ownedIds.has(r.listing_id || r.listingId));

      // 3) Enrich with listing title and reviewer name
      const enriched: any[] = [];
      for (const r of relevant) {
        const listing = owned.find((l: any) => l.id === (r.listing_id || r.listingId));
        let reviewerName = 'Anonymous';
        try {
          const reviewer = await APIService.getById<any>('profiles', r.reviewer_id || r.reviewerId);
          const fn = reviewer?.first_name || reviewer?.firstName || '';
          const ln = reviewer?.last_name || reviewer?.lastName || '';
          reviewerName = `${fn} ${ln}`.trim() || reviewerName;
        } catch {}
        enriched.push({
          id: r.id,
          listingTitle: listing?.title || 'Listing',
          reviewerName,
          rating: r.rating,
          title: r.title || '',
          comment: r.comment || '',
          createdAt: r.created_at || r.createdAt || '',
        });
      }
      setItems(enriched);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <Text style={styles.listing}>{item.listingTitle}</Text>
      <Text style={styles.reviewer}>by {item.reviewerName}</Text>
      <Text style={styles.rating}>⭐ {item.rating}/5</Text>
      {item.title ? <Text style={styles.reviewTitle}>{item.title}</Text> : null}
      {item.comment ? <Text style={styles.comment}>{item.comment}</Text> : null}
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate?.('home')} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Ratings</Text>
      </View>

      {loading ? (
        <View style={styles.loading}><Text style={styles.loadingText}>Loading...</Text></View>
      ) : items.length === 0 ? (
        <View style={styles.loading}><Text style={styles.loadingText}>No reviews yet</Text></View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { marginRight: 12 },
  backText: { color: '#2E7D32', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#666' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 12, marginBottom: 12 },
  listing: { fontSize: 16, fontWeight: '600', color: '#333' },
  reviewer: { fontSize: 14, color: '#666', marginTop: 2 },
  rating: { fontSize: 14, color: '#2E7D32', marginTop: 6 },
  reviewTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 6 },
  comment: { fontSize: 14, color: '#555', marginTop: 4, lineHeight: 20 },
  date: { fontSize: 12, color: '#999', marginTop: 6 },
});




