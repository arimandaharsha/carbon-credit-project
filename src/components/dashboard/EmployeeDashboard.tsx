'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Timestamp, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { styles, colors } from './dashboardStyles';
import { TripData, Toast as ToastType } from './dashboardTypes';
import { useAuth } from '@/contexts/AuthContext';
import { convertTimestamp, formatDate, formatTime, getTransportModeDisplayName, calculateTransportModeBreakdown, getAvatarInitials } from './dashboardUtils';
import Toast from './Toast';
import Header from './Header';
// Import Recharts components
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts';

// Additional interfaces for metrics
interface DailyCredits {
  date: string;
  credits: number;
  trips: number;
}

interface WeeklyMetric {
  name: string;
  value: number;
}

const EmployeeDashboard: React.FC = () => {
  const [userTrips, setUserTrips] = useState<TripData[]>([]);
  const [totalCarbonCredits, setTotalCarbonCredits] = useState<number>(0);
  const [transportModeBreakdown, setTransportModeBreakdown] = useState<Record<string, number>>({});
  const [dailyCreditsData, setDailyCreditsData] = useState<DailyCredits[]>([]);
  const [weekdayDistribution, setWeekdayDistribution] = useState<WeeklyMetric[]>([]);
  const [goalProgress, setGoalProgress] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastType>({ visible: false, message: '', type: 'info' });
  
  const { user, userData } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      fetchUserTrips(user.uid);
    }
  }, [user]);

  // Function to fetch trips for current user
  const fetchUserTrips = async (userId: string) => {
    try {
      setLoading(true);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const tripsQuery = query(
        collection(db, 'trips'),
        where('userId', '==', userId),
        where('tripDate', '>=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('tripDate', 'desc'),
        limit(20)
      );
      
      const tripsSnapshot = await getDocs(tripsQuery);
      const trips: TripData[] = [];
      let userTotalCredits = 0;
      
      // For daily credits chart
      const dailyData: Record<string, { credits: number, trips: number }> = {};
      // For weekday distribution chart
      const weekdayData: Record<string, number> = {
        'Sunday': 0,
        'Monday': 0,
        'Tuesday': 0,
        'Wednesday': 0,
        'Thursday': 0,
        'Friday': 0,
        'Saturday': 0
      };
      
      tripsSnapshot.forEach(doc => {
        const data = doc.data();
        const trip: TripData = {
          id: doc.id,
          userId: data.userId || '',
          startLocation: data.startLocation || { latitude: 0, longitude: 0 },
          endLocation: data.endLocation || { latitude: 0, longitude: 0 },
          startAddress: data.startAddress,
          endAddress: data.endAddress,
          startTime: convertTimestamp(data.startTime),
          endTime: convertTimestamp(data.endTime),
          tripDate: convertTimestamp(data.tripDate),
          distanceKm: data.distanceKm || 0,
          avgSpeedKmh: data.avgSpeedKmh || 0,
          transportMode: data.transportMode || 'unknown',
          carbonCredits: data.carbonCredits || 0,
          isWorkFromHome: data.isWorkFromHome || false
        };
        
        trips.push(trip);
        userTotalCredits += trip.carbonCredits;
        
        // Prepare daily credits data
        const dateKey = formatDate(trip.tripDate);
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { credits: 0, trips: 0 };
        }
        dailyData[dateKey].credits += trip.carbonCredits;
        dailyData[dateKey].trips += 1;
        
        // Prepare weekday distribution data
        const weekday = trip.tripDate.toLocaleDateString('en-US', { weekday: 'long' });
        weekdayData[weekday] += trip.carbonCredits;
      });
      
      // Convert daily data to array format for chart
      const dailyCredits = Object.entries(dailyData).map(([date, data]) => ({
        date,
        credits: parseFloat(data.credits.toFixed(2)),
        trips: data.trips
      })).sort((a, b) => {
        // Sort by date (oldest first for the timeline)
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Convert weekday data to array format for chart
      const weekdayDistribution = Object.entries(weekdayData)
        .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
        .filter(item => item.value > 0); // Only include days with credits
      
      // Calculate goal progress (simulate 70% to 100% of goal)
      const goalProgress = Math.min(100, Math.max(0, (userTotalCredits / 50) * 100));
      
      setUserTrips(trips);
      setTotalCarbonCredits(userTotalCredits);
      setTransportModeBreakdown(calculateTransportModeBreakdown(trips));
      setDailyCreditsData(dailyCredits);
      setWeekdayDistribution(weekdayDistribution);
      setGoalProgress(goalProgress);
    } catch (error) {
      console.error("Error fetching user trips:", error);
      showToast('Failed to load trip data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: ToastType['type']) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Modified TransportModeBreakdown without pie chart
  const TransportModeBreakdown = () => {
    const modeEntries = Object.entries(transportModeBreakdown).sort((a, b) => b[1] - a[1]);
    const totalCredits = Object.values(transportModeBreakdown).reduce((sum, val) => sum + val, 0);
    
    // Different colors for different modes
    const modeColors: Record<string, string> = {
      'walking': colors.green[500],
      'cycling': colors.green[600],
      'publicTransport': colors.green[700],
      'rideShare': colors.green[800],
      'ownVehicle': colors.gray[500],
      'unknown': colors.gray[400],
    };
    
    return (
      <div style={styles.card}>
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: `1px solid ${colors.gray[100]}` 
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            color: colors.gray[900], 
            marginBottom: '0.5rem' 
          }}>
            Transport Mode Breakdown
          </h3>
          <p style={{ 
            fontSize: '0.875rem', 
            color: colors.gray[600],
            margin: 0
          }}>
            Your carbon credits by transportation method
          </p>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {modeEntries.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateTitle}>No transport data available</p>
              <p style={styles.emptyStateText}>
                Your transport mode breakdown will appear here once you start logging trips
              </p>
            </div>
          ) : (
            <div>
              {/* Enhanced bar representation with improved styling */}
              <div>
                {modeEntries.map(([mode, credits], index) => {
                  const percentage = totalCredits > 0 ? (credits / totalCredits) * 100 : 0;
                  const barColor = modeColors[mode] || colors.green[500];
                  
                  return (
                    <div key={mode} style={{ marginBottom: index < modeEntries.length - 1 ? '1.25rem' : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                        <span style={{ 
                          fontSize: '0.875rem', 
                          color: colors.gray[700],
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <div 
                            style={{ 
                              width: '12px', 
                              height: '12px', 
                              backgroundColor: barColor,
                              borderRadius: '50%'
                            }} 
                          />
                          {getTransportModeDisplayName(mode)}
                        </span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.gray[900] }}>
                          {credits.toFixed(2)} credits ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div style={{ 
                        height: '0.75rem', 
                        backgroundColor: colors.gray[200],
                        borderRadius: '9999px',
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                      }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${percentage}%`, 
                            backgroundColor: barColor,
                            borderRadius: '9999px',
                            transition: 'width 1s ease-in-out'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Summary stats for transport modes */}
              <div style={{ 
                marginTop: '1.5rem',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{
                  backgroundColor: colors.green[50],
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: colors.gray[600],
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Most Used Mode
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: colors.gray[900],
                    margin: 0
                  }}>
                    {modeEntries.length > 0 ? getTransportModeDisplayName(modeEntries[0][0]) : '-'}
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: colors.green[50],
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: colors.gray[600],
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Most Efficient
                  </p>
                  <p style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: colors.gray[900],
                    margin: 0
                  }}>
                    {modeEntries.length > 0 ? 
                      (modeEntries.find(([mode]) => mode === 'cycling') ? 'Cycling' : 
                       modeEntries.find(([mode]) => mode === 'walking') ? 'Walking' : 'Public Transport')
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // New Travel Patterns Analysis component
  const TravelPatternsAnalysis = () => {
    // Calculate travel pattern metrics from trip data
    const totalTrips = userTrips.length;
    const totalDistance = userTrips.reduce((sum, trip) => sum + trip.distanceKm, 0);
    const avgTripDistance = totalTrips > 0 ? totalDistance / totalTrips : 0;
    
    // Calculate time-based metrics
    const morningTrips = userTrips.filter(trip => {
      const hour = trip.startTime.getHours();
      return hour >= 5 && hour < 12;
    }).length;
    
    const afternoonTrips = userTrips.filter(trip => {
      const hour = trip.startTime.getHours();
      return hour >= 12 && hour < 17;
    }).length;
    
    const eveningTrips = userTrips.filter(trip => {
      const hour = trip.startTime.getHours();
      return hour >= 17 && hour < 22;
    }).length;
    
    // Calculate day of week distribution
    const dayDistribution: Record<string, number> = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0
    };
    
    userTrips.forEach(trip => {
      const day = trip.tripDate.toLocaleDateString('en-US', { weekday: 'short' });
      dayDistribution[day] = (dayDistribution[day] || 0) + 1;
    });
    
    // Format data for time distribution chart
    const timeDistributionData = [
      { name: 'Morning (5-12)', trips: morningTrips },
      { name: 'Afternoon (12-17)', trips: afternoonTrips },
      { name: 'Evening (17-22)', trips: eveningTrips }
    ];
    
    // Format data for day of week distribution chart
    const dayOfWeekData = Object.entries(dayDistribution).map(([day, count]) => ({
      name: day,
      trips: count
    }));
    
    // Sort days of week in correct order
    const daysOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    dayOfWeekData.sort((a, b) => daysOrder.indexOf(a.name) - daysOrder.indexOf(b.name));
    
    return (
      <div style={styles.card}>
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: `1px solid ${colors.gray[100]}` 
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            color: colors.gray[900], 
            marginBottom: '0.5rem' 
          }}>
            Travel Patterns Analysis
          </h3>
          <p style={{ 
            fontSize: '0.875rem', 
            color: colors.gray[600],
            margin: 0
          }}>
            Insights into your commuting habits and patterns
          </p>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {totalTrips === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateTitle}>No trip data available</p>
              <p style={styles.emptyStateText}>
                Your travel patterns will appear here once you start logging trips
              </p>
            </div>
          ) : (
            <div>
              {/* Key metrics summary */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                gap: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  backgroundColor: colors.green[50],
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: colors.gray[600],
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Total Trips
                  </p>
                  <p style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: colors.gray[900],
                    margin: 0
                  }}>
                    {totalTrips}
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: colors.green[50],
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: colors.gray[600],
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Total Distance
                  </p>
                  <p style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: colors.gray[900],
                    margin: 0
                  }}>
                    {totalDistance.toFixed(1)} km
                  </p>
                </div>
                
                <div style={{
                  backgroundColor: colors.green[50],
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  textAlign: 'center'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    color: colors.gray[600],
                    margin: 0,
                    marginBottom: '0.25rem'
                  }}>
                    Avg Trip Length
                  </p>
                  <p style={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: colors.gray[900],
                    margin: 0
                  }}>
                    {avgTripDistance.toFixed(1)} km
                  </p>
                </div>
              </div>
              
              {/* Time distribution chart */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: colors.gray[800],
                  marginTop: 0,
                  marginBottom: '0.75rem'
                }}>
                  Trip Time Distribution
                </h4>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={timeDistributionData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.gray[200]} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: colors.gray[700] }}
                      />
                      <YAxis 
                        label={{ value: 'Number of Trips', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: colors.gray[600], fontSize: 12 } }}
                        tick={{ fontSize: 12, fill: colors.gray[700] }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} trips`, 'Trips']}
                        contentStyle={{
                          backgroundColor: colors.white,
                          borderRadius: '0.5rem',
                          border: `1px solid ${colors.gray[200]}`,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="trips" 
                        fill={colors.green[500]}
                        radius={[4, 4, 0, 0]}
                      >
                        {timeDistributionData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={index === 0 ? colors.green[400] : 
                                  index === 1 ? colors.green[500] : 
                                  colors.green[600]} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Day of Week distribution */}
              <div>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: colors.gray[800],
                  marginTop: 0,
                  marginBottom: '0.75rem'
                }}>
                  Day of Week Distribution
                </h4>
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dayOfWeekData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.gray[200]} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: colors.gray[700] }}
                      />
                      <YAxis 
                        label={{ value: 'Number of Trips', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: colors.gray[600], fontSize: 12 } }}
                        tick={{ fontSize: 12, fill: colors.gray[700] }}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} trips`, 'Trips']}
                        contentStyle={{
                          backgroundColor: colors.white,
                          borderRadius: '0.5rem',
                          border: `1px solid ${colors.gray[200]}`,
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                        }}
                      />
                      <Bar 
                        dataKey="trips" 
                        fill={colors.green[500]}
                        radius={[4, 4, 0, 0]}
                      >
                        {dayOfWeekData.map((entry, index) => {
                          // Weekend days get a different color
                          const isWeekend = entry.name === 'Sat' || entry.name === 'Sun';
                          return (
                            <Cell 
                              key={`cell-${index}`}
                              fill={isWeekend ? colors.eco.sunset : colors.green[500]} 
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // New component for displaying daily carbon credit trends
  const CreditTrendsChart = () => {
    return (
      <div style={styles.card}>
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: `1px solid ${colors.gray[100]}` 
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            color: colors.gray[900], 
            marginBottom: '0.5rem' 
          }}>
            Carbon Credit Trends
          </h3>
          <p style={{ 
            fontSize: '0.875rem', 
            color: colors.gray[600],
            margin: 0
          }}>
            Your eco-friendly commuting impact over time
          </p>
        </div>
        
        <div style={{ padding: '1.5rem' }}>
          {dailyCreditsData.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateTitle}>No trend data available</p>
              <p style={styles.emptyStateText}>
                Your carbon credit trends will appear here once you start logging trips
              </p>
            </div>
          ) : (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={dailyCreditsData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 30 }}
                >
                  <defs>
                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors.green[500]} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={colors.green[500]} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.gray[200]} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: colors.gray[700] }}
                    tickMargin={10}
                    axisLine={{ stroke: colors.gray[300] }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: colors.gray[700] }}
                    axisLine={{ stroke: colors.gray[300] }}
                    tickMargin={10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: colors.white, 
                      borderRadius: '0.5rem',
                      border: `1px solid ${colors.gray[200]}`,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}
                    formatter={(value: number) => [`${value} credits`, 'Credits']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="credits" 
                    stroke={colors.green[600]} 
                    fillOpacity={1} 
                    fill="url(#colorCredits)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Header userData={userData} />
      <main style={styles.contentArea}>
        <div style={styles.maxWidthWrapper}>
          {/* Top Section - User Summary */}
          <div style={styles.card}>
            <div style={{ 
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: colors.green[100],
                    color: colors.green[700],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '1.5rem',
                    marginRight: '1rem'
                  }}>
                    {getAvatarInitials(userData?.name || '')}
                  </div>
                  <div>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: 600, 
                      color: colors.gray[900], 
                      margin: 0 
                    }}>
                      {userData?.name || 'User'}
                    </h3>
                    <p style={{ 
                      fontSize: '0.875rem', 
                      color: colors.gray[600],
                      margin: '0.25rem 0 0 0'
                    }}>
                      {userData?.email}
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  backgroundColor: colors.green[50],
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  minWidth: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <p style={{ 
                    fontSize: '0.875rem', 
                    color: colors.green[700],
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    Total Carbon Credits
                  </p>
                  <p style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 700, 
                    color: colors.green[700],
                    margin: '0.25rem 0',
                    lineHeight: 1
                  }}>
                    {totalCarbonCredits.toFixed(2)}
                  </p>
                  <p style={{ 
                    fontSize: '0.75rem', 
                    color: colors.gray[600],
                    margin: 0,
                    textAlign: 'center'
                  }}>
                    Equivalent to {(totalCarbonCredits * 2.5).toFixed(1)} kg CO₂ saved
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle Section - Dashboard Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.5rem',
            marginTop: '1.5rem'
          }}>
            {/* Travel Patterns Analysis - New component replacing Environmental Impact Report */}
            <TravelPatternsAnalysis />
          </div>
          
          {/* Weekly Activity - Full width */}
          <div style={{ marginTop: '1.5rem' }}>
            <div style={styles.card}>
              <div style={{ 
                padding: '1.25rem 1.5rem', 
                borderBottom: `1px solid ${colors.gray[100]}` 
              }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 600, 
                  color: colors.gray[900], 
                  marginBottom: '0.5rem' 
                }}>
                  Weekly Activity
                </h3>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: colors.gray[600],
                  margin: 0
                }}>
                  Credits earned by day of the week
                </p>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {weekdayDistribution.length === 0 ? (
                  <div style={styles.emptyState}>
                    <p style={styles.emptyStateTitle}>No weekly data available</p>
                    <p style={styles.emptyStateText}>
                      Your weekly activity will appear here once you start logging trips
                    </p>
                  </div>
                ) : (
                  <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weekdayDistribution}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.gray[200]} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 11, fill: colors.gray[700] }}
                          axisLine={{ stroke: colors.gray[300] }}
                          tickFormatter={(value) => value.substring(0, 3)}
                        />
                        <YAxis 
                          tick={{ fontSize: 12, fill: colors.gray[700] }}
                          axisLine={{ stroke: colors.gray[300] }}
                          tickMargin={10}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: colors.white, 
                            borderRadius: '0.5rem',
                            border: `1px solid ${colors.gray[200]}`,
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                          }}
                          formatter={(value: number) => [`${value.toFixed(2)} credits`, 'Credits']}
                        />
                        <Bar 
                          dataKey="value" 
                          fill={colors.green[400]}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Credit Trends Chart - Full width */}
          <div style={{ marginTop: '1.5rem' }}>
            <CreditTrendsChart />
          </div>
          
          {/* Bottom Section - Transport Breakdown and Activity History */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginTop: '1.5rem'
          }}>
            {/* Transport Mode Breakdown */}
            <TransportModeBreakdown />
            
            {/* Travel Activity History Card */}
            <div style={styles.card}>
              <div style={{ 
                padding: '1.25rem 1.5rem', 
                borderBottom: `1px solid ${colors.gray[100]}` 
              }}>
                <h3 style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 600, 
                  color: colors.gray[900], 
                  marginBottom: '0.5rem' 
                }}>
                  Travel Activity History
                </h3>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: colors.gray[600] 
                }}>
                  Your recent eco-friendly travel activities
                </p>
              </div>
              
              <div>
                {loading ? (
                  <div style={styles.loader}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
                      <circle cx="12" cy="12" r="10" stroke={colors.gray[300]} strokeWidth="4" />
                      <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke={colors.green[500]} strokeWidth="4" />
                    </svg>
                    <p style={styles.loaderText}>Loading trip data...</p>
                  </div>
                ) : (
                  <ul style={{ 
                    listStyle: 'none', 
                    margin: 0, 
                    padding: 0,
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }} className="scrollable">
                    {userTrips.length === 0 ? (
                      <li style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                        <p style={{ color: colors.gray[500] }}>No travel activities recorded yet.</p>
                      </li>
                    ) : (
                      userTrips.map(trip => (
                        <li 
                          key={trip.id} 
                          style={{ 
                            padding: '1rem 1.5rem', 
                            borderBottom: `1px solid ${colors.gray[100]}`,
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                        >
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between' 
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div>
                                <p style={{ 
                                  fontSize: '0.9375rem', 
                                  fontWeight: 500, 
                                  color: colors.gray[900],
                                  margin: 0
                                }}>
                                  {getTransportModeDisplayName(trip.transportMode)}
                                  {trip.isWorkFromHome && " (Work From Home)"}
                                  <span style={{ 
                                    fontSize: '0.875rem', 
                                    fontWeight: 400, 
                                    color: colors.gray[600],
                                    marginLeft: '0.5rem'
                                  }}>
                                    ({trip.distanceKm.toFixed(1)} km)
                                  </span>
                                </p>
                                <p style={{ 
                                  fontSize: '0.8125rem', 
                                  color: colors.gray[500],
                                  margin: '0.25rem 0 0 0'
                                }}>
                                  {formatDate(trip.tripDate)} • {formatTime(trip.startTime, trip.endTime)}
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <p style={{ 
                                fontSize: '1.125rem', 
                                fontWeight: 600, 
                                color: colors.green[600],
                                margin: 0
                              }}>
                                +{trip.carbonCredits.toFixed(2)}
                                <span style={{ 
                                  fontSize: '0.875rem', 
                                  fontWeight: 500, 
                                  marginLeft: '0.125rem'
                                }}>
                                  credits
                                </span>
                              </p>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
};

export default EmployeeDashboard; 