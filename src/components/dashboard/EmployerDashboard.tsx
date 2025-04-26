'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, setDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { styles, colors, createScrollStyles } from './dashboardStyles';
import { Organization, Employee, Toast as ToastType, TripData, PendingEmployee, CreditTransaction } from './dashboardTypes';
import { useAuth } from '@/contexts/AuthContext';
import Toast from './Toast';
import Header from './Header';
import scrollbarStyles from './scrollbar.module.css';

const EmployerDashboard: React.FC = () => {
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [employees, setEmployees] = useState<(Employee & { calculatedCredits?: number })[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [totalOrgCredits, setTotalOrgCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessingApproval, setIsProcessingApproval] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastType>({ visible: false, message: '', type: 'info' });
  const [showTransactionModal, setShowTransactionModal] = useState<boolean>(false);
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [creditPrice, setCreditPrice] = useState<string>('');
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCreditHistoryModal, setShowCreditHistoryModal] = useState<boolean>(false);
  const [availableSales, setAvailableSales] = useState<CreditTransaction[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(false);
  const [transactionError, setTransactionError] = useState<string>('');
  const [isProcessingTransaction, setIsProcessingTransaction] = useState<boolean>(false);
  
  const { user, userData } = useAuth();

  useEffect(() => {
    if (userData?.domain) {
      fetchOrganizationByDomain(userData.domain);
      fetchPendingEmployees(userData.domain);
    }
  }, [userData]);

  const fetchCurrentOrganization = async (orgId: string) => {
    try {
      setLoading(true);
      const orgDoc = await getDoc(doc(db, 'organizations', orgId));
      
      if (orgDoc.exists()) {
        const data = orgDoc.data();
        const organization: Organization = {
          id: orgDoc.id,
          name: data.name || 'Unknown Organization',
          domain: data.domain || '',
          address: data.address,
          totalCredits: data.totalCredits || 0,
          carbonCredits: data.carbonCredits || 0,
          availableMoney: data.availableMoney || 0,
          createdAt: data.createdAt || ''
        };
        
        setCurrentOrganization(organization);
        fetchOrganizationEmployees(organization.domain);
      }
    } catch (error) {
      console.error("Error fetching current organization:", error);
      showToast('Failed to load organization data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationByDomain = async (domain: string) => {
    try {
      setLoading(true);
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('domain', '==', domain),
        where('approved', '==', true)
      );
      
      const orgsSnapshot = await getDocs(orgsQuery);
      
      if (!orgsSnapshot.empty) {
        const orgDoc = orgsSnapshot.docs[0];
        const data = orgDoc.data();
        
        // Set the organization with initial data from Firestore
        const organization: Organization = {
          id: orgDoc.id,
          name: data.name || 'Unknown Organization',
          domain: data.domain || '',
          address: data.address,
          totalCredits: data.totalCredits || 0,
          carbonCredits: data.carbonCredits || 0,
          availableMoney: data.availableMoney || 0,
          createdAt: data.createdAt || ''
        };
        
        setCurrentOrganization(organization);
        
        // Fetch employees and calculate credits from trips
        const employeesQuery = query(
          collection(db, 'users'),
          where('domain', '==', domain),
          orderBy('name')
        );
        
        const employeesSnapshot = await getDocs(employeesQuery);
        const employeesList: (Employee & { calculatedCredits?: number })[] = [];
        const employeeIds: string[] = [];
        
        employeesSnapshot.forEach(doc => {
          const data = doc.data();
          employeesList.push({
            id: doc.id,
            name: data.name || 'Unknown Employee',
            email: data.email || '',
            domain: data.domain || domain,
            carbonCredits: data.carbonCredits || 0,
            calculatedCredits: 0,
            role: data.role,
            approved: data.approved
          });
          
          if (data.role === 'employee' && data.approved === true) {
            employeeIds.push(doc.id);
          }
        });
        
        setAllEmployees(employeesList);
        
        // Filter and set employees separately (only approved employees with employee role)
        const filteredList = employeesList.filter(
          emp => emp.role === 'employee' && emp.approved === true
        );
        setEmployees(filteredList);
        
        // Calculate total credits from all employee trips
        if (employeeIds.length > 0) {
          const tripsQuery = query(
            collection(db, 'trips'),
            where('userId', 'in', employeeIds)
          );
          
          const tripsSnapshot = await getDocs(tripsQuery);
          const tripsList: TripData[] = [];
          let tripsTotalCredits = 0;
          
          // Create a map to store credits per employee
          const employeeCreditMap: Record<string, number> = {};
          
          // Initialize credits for each employee to 0
          employeeIds.forEach(id => {
            employeeCreditMap[id] = 0;
          });
          
          tripsSnapshot.forEach(doc => {
            const data = doc.data();
            const trip: TripData = {
              id: doc.id,
              userId: data.userId || '',
              startLocation: data.startLocation || { latitude: 0, longitude: 0 },
              endLocation: data.endLocation || { latitude: 0, longitude: 0 },
              startAddress: data.startAddress,
              endAddress: data.endAddress,
              startTime: data.startTime?.toDate() || new Date(),
              endTime: data.endTime?.toDate() || new Date(),
              tripDate: data.tripDate?.toDate() || new Date(),
              distanceKm: data.distanceKm || 0,
              avgSpeedKmh: data.avgSpeedKmh || 0,
              transportMode: data.transportMode || 'unknown',
              carbonCredits: data.carbonCredits || 0,
              isWorkFromHome: data.isWorkFromHome || false
            };
            
            tripsList.push(trip);
            tripsTotalCredits += trip.carbonCredits;
            
            // Add this trip's credits to the employee's total
            if (trip.userId) {
              employeeCreditMap[trip.userId] = (employeeCreditMap[trip.userId] || 0) + trip.carbonCredits;
            }
          });
          
          // Update the employee list with calculated credits
          const updatedEmployees = filteredList.map(employee => {
            return {
              ...employee,
              calculatedCredits: employeeCreditMap[employee.id] || 0
            };
          });
          
          setEmployees(updatedEmployees);
          setTrips(tripsList);
          
          // Set trips total credits for display in the UI
          setTotalOrgCredits(tripsTotalCredits);
          
          // Update only carbonCredits in the organization to reflect employee-earned credits
          // but DO NOT overwrite totalCredits which is used for trading
          const orgRef = doc(db, 'organizations', orgDoc.id);
          await updateDoc(orgRef, {
            carbonCredits: tripsTotalCredits
          });
          
          // Update the state with the new carbon credits total, but keep totalCredits as is
          setCurrentOrganization({
            ...organization,
            carbonCredits: tripsTotalCredits
          });
        }
      }
    } catch (error) {
      console.error("Error fetching organization by domain:", error);
      showToast('Failed to load organization data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationEmployees = async (domain: string) => {
    try {
      const employeesQuery = query(
        collection(db, 'users'),
        where('domain', '==', domain),
        orderBy('name')
      );
      
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesList: Employee[] = [];
      
      employeesSnapshot.forEach(doc => {
        const data = doc.data();
        employeesList.push({
          id: doc.id,
          name: data.name || 'Unknown Employee',
          email: data.email || '',
          domain: data.domain || domain,
          carbonCredits: data.carbonCredits || 0,
          calculatedCredits: 0,
          role: data.role,
          approved: data.approved
        });
      });
      
      setAllEmployees(employeesList);
      
      // Filter and set employees separately (only approved employees with employee role)
      const filteredList = employeesList.filter(
        emp => emp.role === 'employee' && emp.approved === true
      );
      setEmployees(filteredList);
      
      // Since credit calculation is now handled in fetchOrganizationByDomain,
      // we don't need to recalculate credits here
    } catch (error) {
      console.error("Error fetching organization employees:", error);
      showToast('Failed to load employees data', 'error');
    }
  };

  const fetchPendingEmployees = async (domain: string) => {
    try {
      // Query the pending_employees collection
      const pendingEmployeesQuery = query(
        collection(db, 'pending_employees'),
        where('domain', '==', domain)
      );
      
      const pendingEmployeesSnapshot = await getDocs(pendingEmployeesQuery);
      const pendingEmployeesList: PendingEmployee[] = [];
      
      // For each pending employee, check if they have an approved user record
      for (const docSnapshot of pendingEmployeesSnapshot.docs) {
        const data = docSnapshot.data();
        
        // Check if this user is already approved in the users collection
        const userRef = doc(db, 'users', docSnapshot.id);
        const userDoc = await getDoc(userRef);
        
        // Only add to the pending list if the user doesn't exist or isn't approved
        if (!userDoc.exists() || userDoc.data()?.approved !== true) {
          pendingEmployeesList.push({
            id: docSnapshot.id,
            fullName: data.fullName || 'Unknown Employee',
            email: data.email || '',
            domain: data.domain || domain,
            createdAt: data.createdAt || ''
          });
        }
      }
      
      setPendingEmployees(pendingEmployeesList);
    } catch (error) {
      console.error("Error fetching pending employees:", error);
      showToast('Failed to load pending employees data', 'error');
    }
  };

  const handleEmployeeApproval = async (employeeId: string, approved: boolean) => {
    setIsProcessingApproval(true);
    try {
      // Get the pending employee details
      const pendingEmployeeRef = doc(db, 'pending_employees', employeeId);
      const pendingEmployeeDoc = await getDoc(pendingEmployeeRef);
      
      if (!pendingEmployeeDoc.exists()) {
        throw new Error('Pending employee not found');
      }
      
      const pendingEmployeeData = pendingEmployeeDoc.data();
      
      // Check if user document already exists
      const userRef = doc(db, 'users', employeeId);
      const userDoc = await getDoc(userRef);
      
      if (approved) {
        // Create or update the user document with approved status
        const userData = {
          name: pendingEmployeeData.fullName,
          email: pendingEmployeeData.email,
          domain: pendingEmployeeData.domain,
          orgId: pendingEmployeeData.orgId || null,
          role: 'employee',
          approved: true,
          carbonCredits: 0,
          createdAt: pendingEmployeeData.createdAt,
          lastLogin: new Date().toISOString()
        };
        
        if (userDoc.exists()) {
          // Update existing user document
          await updateDoc(userRef, {
            approved: true,
            // Update any other fields if needed
            lastLogin: new Date().toISOString()
          });
        } else {
          // Create new user document
          await setDoc(userRef, userData);
        }
        
        showToast('Employee approved successfully', 'success');
      } else {
        // Handle rejection
        if (userDoc.exists()) {
          // Update user document to indicate rejection
          await updateDoc(userRef, {
            approved: false,
            // Update any other fields if needed
            lastLogin: new Date().toISOString()
          });
        }
        
        showToast('Employee registration rejected', 'info');
      }
      
      // Refresh the pending employees list
      if (userData?.domain) {
        fetchPendingEmployees(userData.domain);
        fetchOrganizationEmployees(userData.domain);
      }
    } catch (error) {
      console.error('Error processing employee approval:', error);
      showToast('Failed to process employee approval', 'error');
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const showToast = (message: string, type: ToastType['type']) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Filter employees based on search query only, since we've already filtered by role and approval
  const filteredEmployees = searchQuery.trim()
    ? employees.filter(employee => 
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : employees;

  // Update the tableContainerStyle to ensure better scrolling functionality
  const tableContainerStyle = {
    maxHeight: '500px', // Increased from 400px to show more content
    borderRadius: '0.5rem',
    border: `1px solid ${colors.gray[200]}`,
    overflow: 'auto', // Ensure overflow is set to auto
    position: 'relative' as const, // Add position relative for proper scrollbar positioning
  };

  // Helper function to group trips by employee
  const getTripsByEmployee = (userId: string) => {
    return trips.filter(trip => trip.userId === userId);
  };

  // Helper function to calculate total credits by transport mode
  const getCreditsByTransportMode = () => {
    const creditsByMode: Record<string, number> = {
      walking: 0,
      cycling: 0,
      publicTransport: 0,
      rideShare: 0,
      ownVehicle: 0,
      workFromHome: 0,
      unknown: 0
    };
    
    trips.forEach(trip => {
      if (trip.isWorkFromHome) {
        creditsByMode.workFromHome += trip.carbonCredits;
      } else {
        creditsByMode[trip.transportMode] += trip.carbonCredits;
      }
    });
    
    return creditsByMode;
  };

  // Header and Container Styles
  const sectionHeaderStyle = {
    fontSize: '1.25rem',
    fontWeight: 600 as const,
    color: colors.gray[900],
    marginBottom: '0.5rem'
  };

  // Credit breakdown card component
  const CreditBreakdownCard = () => {
    const creditsByMode = getCreditsByTransportMode();
    
    return (
      <div style={{ backgroundColor: colors.white, borderRadius: '0.75rem', padding: '1.25rem', border: `1px solid ${colors.gray[200]}` }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: colors.gray[800], marginBottom: '1rem' }}>
          Credits by Transport Mode
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(creditsByMode).map(([mode, credits]) => (
            credits > 0 && (
              <div key={mode} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ 
                    width: '0.75rem', 
                    height: '0.75rem', 
                    borderRadius: '50%', 
                    backgroundColor: 
                      mode === 'walking' ? colors.green[400] :
                      mode === 'cycling' ? colors.green[600] :
                      mode === 'publicTransport' ? colors.green[700] :
                      mode === 'rideShare' ? colors.green[300] :
                      mode === 'workFromHome' ? colors.green[500] :
                      colors.gray[400]
                  }} />
                  <span style={{ fontSize: '0.875rem', color: colors.gray[700] }}>
                    {mode === 'walking' ? 'Walking' :
                     mode === 'cycling' ? 'Cycling' :
                     mode === 'publicTransport' ? 'Public Transport' :
                     mode === 'rideShare' ? 'Ride Sharing' :
                     mode === 'ownVehicle' ? 'Own Vehicle' :
                     mode === 'workFromHome' ? 'Work From Home' : 'Unknown'}
                  </span>
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.green[700] }}>
                  {credits.toFixed(2)}
                </span>
              </div>
            )
          ))}
        </div>
      </div>
    );
  };

  // Add a function to get trips for a specific employee
  const getEmployeeTripDetails = (userId: string) => {
    const employeeTrips = trips.filter(trip => trip.userId === userId);
    
    // Group trips by date (month/year)
    const tripsByMonth: Record<string, TripData[]> = {};
    
    employeeTrips.forEach(trip => {
      const date = trip.tripDate;
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!tripsByMonth[monthYear]) {
        tripsByMonth[monthYear] = [];
      }
      
      tripsByMonth[monthYear].push(trip);
    });
    
    return {
      trips: employeeTrips,
      tripsByMonth,
      totalCredits: employeeTrips.reduce((sum, trip) => sum + trip.carbonCredits, 0)
    };
  };

  // Add a function to handle clicking on an employee's info icon
  const handleViewEmployeeCredits = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowCreditHistoryModal(true);
  };

  // Create an Employee Credits History Modal component
  const EmployeeCreditHistoryModal = () => {
    if (!selectedEmployee) return null;
    
    const { trips: employeeTrips, tripsByMonth, totalCredits } = getEmployeeTripDetails(selectedEmployee.id);
    
    // Use the calculated total from trips, not the value in the user record
    const displayedCredits = selectedEmployee.calculatedCredits !== undefined ? 
      selectedEmployee.calculatedCredits : totalCredits;
    
    // Improved scrollbar styling
    const scrollStyles = {
      height: '100%',
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      paddingRight: '4px',
    };

    return (
      <div style={styles.modal}>
        <div style={{...styles.modalContent, maxWidth: '48rem', maxHeight: '80vh', overflow: 'auto'}}>
          <div style={styles.modalHeader}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: colors.gray[900], margin: 0 }}>
              Credit History - {selectedEmployee.name}
            </h3>
            <p style={{ fontSize: '0.875rem', color: colors.gray[600], margin: '0.25rem 0 0 0' }}>
              Total Credits: {displayedCredits.toFixed(2)}
            </p>
          </div>
          
          <div style={{...styles.modalBody, padding: '1rem 1.5rem', maxHeight: '60vh', overflow: 'auto'}} className={`${scrollbarStyles.scrollable} ${scrollbarStyles.scrollbarCustom}`}>
            {employeeTrips.length === 0 ? (
              <div style={styles.emptyState}>
                <p style={styles.emptyStateTitle}>No Trip Data</p>
                <p style={styles.emptyStateText}>
                  This employee hasn't recorded any trips yet.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Credit breakdown by transport mode */}
                <div style={{ backgroundColor: colors.green[50], padding: '1rem', borderRadius: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: colors.gray[800], marginBottom: '0.75rem' }}>
                    Credits by Transport Mode
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {Object.entries(employeeTrips.reduce((acc, trip) => {
                      const mode = trip.isWorkFromHome ? 'workFromHome' : trip.transportMode;
                      acc[mode] = (acc[mode] || 0) + trip.carbonCredits;
                      return acc;
                    }, {} as Record<string, number>)).map(([mode, credits]) => (
                      <div key={mode} style={{ 
                        backgroundColor: colors.white, 
                        padding: '0.75rem', 
                        borderRadius: '0.375rem',
                        border: `1px solid ${colors.green[100]}`
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <div style={{ 
                            width: '0.75rem', 
                            height: '0.75rem', 
                            borderRadius: '50%', 
                            backgroundColor: 
                              mode === 'walking' ? colors.green[400] :
                              mode === 'cycling' ? colors.green[600] :
                              mode === 'publicTransport' ? colors.green[700] :
                              mode === 'rideShare' ? colors.green[300] :
                              mode === 'workFromHome' ? colors.green[500] :
                              colors.gray[400]
                          }} />
                          <span style={{ fontSize: '0.75rem', color: colors.gray[700] }}>
                            {mode === 'walking' ? 'Walking' :
                             mode === 'cycling' ? 'Cycling' :
                             mode === 'publicTransport' ? 'Public Transport' :
                             mode === 'rideShare' ? 'Ride Sharing' :
                             mode === 'ownVehicle' ? 'Own Vehicle' :
                             mode === 'workFromHome' ? 'Work From Home' : 'Unknown'}
                          </span>
                        </div>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: colors.green[700], margin: 0 }}>
                          {credits.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Trip history by month */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: colors.gray[800], marginBottom: '0.75rem' }}>
                    Recent Trips
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {employeeTrips
                      .sort((a, b) => b.tripDate.getTime() - a.tripDate.getTime())
                      .slice(0, 10)
                      .map(trip => (
                      <div key={trip.id} style={{ 
                        backgroundColor: colors.white, 
                        padding: '1rem', 
                        borderRadius: '0.5rem',
                        border: `1px solid ${colors.gray[200]}`,
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ 
                              width: '1.5rem', 
                              height: '1.5rem', 
                              borderRadius: '50%', 
                              backgroundColor: 
                                trip.transportMode === 'walking' ? colors.green[400] :
                                trip.transportMode === 'cycling' ? colors.green[600] :
                                trip.transportMode === 'publicTransport' ? colors.green[700] :
                                trip.transportMode === 'rideShare' ? colors.green[300] :
                                trip.isWorkFromHome ? colors.green[500] :
                                colors.gray[400],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: colors.white,
                              fontSize: '0.75rem'
                            }}>
                              {trip.transportMode === 'walking' ? 'W' :
                               trip.transportMode === 'cycling' ? 'C' :
                               trip.transportMode === 'publicTransport' ? 'PT' :
                               trip.transportMode === 'rideShare' ? 'RS' :
                               trip.isWorkFromHome ? 'WFH' : '?'}
                            </div>
                            <span style={{ fontWeight: 500, color: colors.gray[900] }}>
                              {trip.isWorkFromHome ? 'Work From Home' : `${trip.transportMode.charAt(0).toUpperCase() + trip.transportMode.slice(1)} Trip`}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.875rem', color: colors.gray[500] }}>
                            {trip.tripDate.toLocaleDateString()}
                          </span>
                        </div>
                        
                        {!trip.isWorkFromHome && (
                          <div style={{ fontSize: '0.875rem', color: colors.gray[600], marginBottom: '0.5rem' }}>
                            {trip.startAddress && trip.endAddress ? (
                              <>From: {trip.startAddress} <br />To: {trip.endAddress}</>
                            ) : (
                              <>Distance: {trip.distanceKm.toFixed(2)} km</>
                            )}
                          </div>
                        )}
                        
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          marginTop: '0.5rem',
                          paddingTop: '0.5rem',
                          borderTop: `1px solid ${colors.gray[100]}`
                        }}>
                          <span style={{ fontSize: '0.875rem', color: colors.gray[600] }}>
                            Credits Earned
                          </span>
                          <span style={{ 
                            fontWeight: 600, 
                            color: colors.green[700],
                            fontSize: '1rem'
                          }}>
                            +{trip.carbonCredits.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div style={styles.modalFooter}>
            <button
              onClick={() => setShowCreditHistoryModal(false)}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
                padding: '0.5rem 1rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = styles.secondaryButtonHover.backgroundColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = styles.secondaryButton.backgroundColor;
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add useEffect to fetch available sales
  useEffect(() => {
    if (currentOrganization) {
      fetchAvailableSales();
    }
  }, [currentOrganization]);

  // Function to fetch available credit sales
  const fetchAvailableSales = async () => {
    try {
      setIsLoadingSales(true);
      const salesQuery = query(
        collection(db, 'credit_transactions'),
        where('status', '==', 'approved')
      );
      
      const salesSnapshot = await getDocs(salesQuery);
      const salesList: CreditTransaction[] = [];
      
      salesSnapshot.forEach(doc => {
        const data = doc.data();
        salesList.push({
          id: doc.id,
          sellerOrgId: data.sellerOrgId,
          sellerOrgName: data.sellerOrgName,
          buyerOrgId: data.buyerOrgId || '',
          buyerOrgName: data.buyerOrgName || '',
          creditAmount: data.creditAmount,
          price: data.price,
          status: data.status,
          createdAt: data.createdAt
        });
      });
      
      setAvailableSales(salesList);
    } catch (error) {
      console.error("Error fetching available sales:", error);
      showToast('Failed to load available credit sales', 'error');
    } finally {
      setIsLoadingSales(false);
    }
  };

  // Function to post a new sale
  const handlePostSale = async () => {
    if (!currentOrganization) return;
    
    // Validate inputs
    const creditsToSell = parseFloat(creditAmount);
    const pricePerCredit = parseFloat(creditPrice);
    
    if (isNaN(creditsToSell) || creditsToSell <= 0) {
      setTransactionError('Please enter a valid credit amount greater than 0');
      return;
    }
    
    if (isNaN(pricePerCredit) || pricePerCredit <= 0) {
      setTransactionError('Please enter a valid price greater than 0');
      return;
    }
    
    // Use the organization's total credits for validation
    if (creditsToSell > currentOrganization.totalCredits) {
      setTransactionError(`You only have ${currentOrganization.totalCredits.toFixed(2)} credits available to sell`);
      return;
    }
    
    try {
      setIsProcessingTransaction(true);
      setTransactionError('');
      
      console.log('Posting new credit sale transaction...');
      console.log('Organization details:', {
        id: currentOrganization.id,
        name: currentOrganization.name
      });
      
      // Create a new transaction document
      const transactionRef = collection(db, 'credit_transactions');
      const newTransaction: Omit<CreditTransaction, 'id'> = {
        sellerOrgId: currentOrganization.id,
        sellerOrgName: currentOrganization.name,
        buyerOrgId: '',
        buyerOrgName: '',
        creditAmount: creditsToSell,
        price: pricePerCredit,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      console.log('New transaction data:', newTransaction);
      
      const docRef = await addDoc(transactionRef, newTransaction);
      console.log('Transaction saved successfully with ID:', docRef.id);
      
      // When posting a sale, decrease the available trading credits (totalCredits)
      // This "reserves" the credits while the sale is pending
      const newTotalCredits = currentOrganization.totalCredits - creditsToSell;
      const orgRef = doc(db, 'organizations', currentOrganization.id);
      await updateDoc(orgRef, {
        totalCredits: newTotalCredits
      });
      
      // Update local state
      setCurrentOrganization({
        ...currentOrganization,
        totalCredits: newTotalCredits
      });
      
      // Close the modal and show success message
      setShowTransactionModal(false);
      showToast('Sale posted successfully. Waiting for bank approval.', 'success');
      
      // Reset form fields
      setCreditAmount('');
      setCreditPrice('');
    } catch (error) {
      console.error("Error posting sale:", error);
      setTransactionError('Failed to post sale. Please try again.');
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  // Function to purchase credits
  const handlePurchaseCredits = async (transaction: CreditTransaction) => {
    if (!currentOrganization) return;
    
    try {
      setIsProcessingTransaction(true);
      
      // Calculate total price
      const totalPrice = transaction.creditAmount * transaction.price;
      
      // Check if organization has enough money to complete the transaction
      if (currentOrganization.availableMoney < totalPrice) {
        setTransactionError(`Insufficient funds. You need $${totalPrice.toFixed(2)} but only have $${currentOrganization.availableMoney.toFixed(2)} available.`);
        setIsProcessingTransaction(false);
        return;
      }
      
      // Update transaction status
      const transactionRef = doc(db, 'credit_transactions', transaction.id);
      await updateDoc(transactionRef, {
        status: 'completed',
        buyerOrgId: currentOrganization.id,
        buyerOrgName: currentOrganization.name,
        completedAt: new Date().toISOString()
      });
      
      // Update buyer's credits (add trading credits only) and deduct money
      const buyerOrgRef = doc(db, 'organizations', currentOrganization.id);
      const newBuyerCredits = currentOrganization.totalCredits + transaction.creditAmount;
      const newBuyerMoney = currentOrganization.availableMoney - totalPrice;
      
      await updateDoc(buyerOrgRef, {
        totalCredits: newBuyerCredits,
        availableMoney: newBuyerMoney
      });
      
      // Update local state to reflect the new credit balance and available money
      setCurrentOrganization({
        ...currentOrganization,
        totalCredits: newBuyerCredits,
        availableMoney: newBuyerMoney
      });
      
      // Update seller's credits (subtract trading credits only) and add money
      const sellerOrgRef = doc(db, 'organizations', transaction.sellerOrgId);
      
      // Get current seller data
      const sellerOrgDoc = await getDoc(sellerOrgRef);
      if (sellerOrgDoc.exists()) {
        const sellerData = sellerOrgDoc.data();
        await updateDoc(sellerOrgRef, {
          // Only modify totalCredits, not carbonCredits (earned credits)
          totalCredits: Math.max(0, (sellerData.totalCredits || 0) - transaction.creditAmount),
          availableMoney: (sellerData.availableMoney || 0) + totalPrice
        });
      }
      
      // Close modal and show success message
      setShowTransactionModal(false);
      showToast(`Successfully purchased ${transaction.creditAmount} credits for $${totalPrice.toFixed(2)}`, 'success');
      
      // Refresh data
      fetchAvailableSales();
    } catch (error) {
      console.error("Error purchasing credits:", error);
      setTransactionError('Failed to complete transaction. Please try again.');
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  // Transaction Modal Component
  const TransactionModal = () => {
    if (!currentOrganization) return null;
    
    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              {transactionType === 'sell' ? 'Sell Carbon Credits' : 'Buy Carbon Credits'}
            </h3>
          </div>
          
          <div style={styles.modalBody}>
            {transactionType === 'sell' ? (
              // Sell Credits Form
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.gray[600] }}>
                  You currently have <span style={{ fontWeight: 600, color: colors.green[700] }}>{currentOrganization.totalCredits.toFixed(2)}</span> credits available to sell.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="creditAmount" style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.gray[700] }}>
                    Number of Credits to Sell
                  </label>
                  <input
                    id="creditAmount"
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="Enter amount"
                    style={{
                      padding: '0.625rem',
                      borderRadius: '0.375rem',
                      border: `1px solid ${colors.gray[300]}`,
                      fontSize: '0.875rem'
                    }}
                    min="0.01"
                    max={currentOrganization.totalCredits.toString()}
                    step="0.01"
                  />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="creditPrice" style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.gray[700] }}>
                    Price per Credit (USD)
                  </label>
                  <input
                    id="creditPrice"
                    type="number"
                    value={creditPrice}
                    onChange={(e) => setCreditPrice(e.target.value)}
                    placeholder="Enter price"
                    style={{
                      padding: '0.625rem',
                      borderRadius: '0.375rem',
                      border: `1px solid ${colors.gray[300]}`,
                      fontSize: '0.875rem'
                    }}
                    min="0.01"
                    step="0.01"
                  />
                </div>
                
                {parseFloat(creditAmount) > 0 && parseFloat(creditPrice) > 0 && (
                  <div style={{ backgroundColor: colors.green[50], padding: '0.75rem', borderRadius: '0.375rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: colors.green[700] }}>
                      Total sale value: 
                      <span style={{ fontWeight: 600, marginLeft: '0.25rem' }}>
                        ${(parseFloat(creditAmount) * parseFloat(creditPrice)).toFixed(2)}
                      </span>
                    </p>
                  </div>
                )}
                
                {transactionError && (
                  <div style={{ backgroundColor: colors.red[50], padding: '0.75rem', borderRadius: '0.375rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: colors.red[700] }}>
                      {transactionError}
                    </p>
                  </div>
                )}
                
                <p style={{ fontSize: '0.75rem', color: colors.gray[500], margin: 0 }}>
                  Note: Your sale will be reviewed by the bank before being made available to buyers.
                </p>
              </div>
            ) : (
              // Buy Credits View
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.875rem', color: colors.gray[600] }}>
                  Select a credit package to purchase:
                </p>
                
                {isLoadingSales ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
                      <circle cx="12" cy="12" r="10" stroke={colors.gray[300]} strokeWidth="4" />
                      <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke={colors.green[500]} strokeWidth="4" />
                    </svg>
                  </div>
                ) : availableSales.length === 0 ? (
                  <div style={{ backgroundColor: colors.gray[50], padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: colors.gray[600] }}>
                      No credit packages are currently available for purchase.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '300px', overflowY: 'auto' }} className={`${scrollbarStyles.scrollable} ${scrollbarStyles.scrollbarCustom}`}>
                    {availableSales
                      .filter(sale => sale.sellerOrgId !== currentOrganization.id) // Don't show your own sales
                      .map(sale => (
                      <div 
                        key={sale.id} 
                        style={{ 
                          border: `1px solid ${colors.gray[200]}`,
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          backgroundColor: colors.white
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: colors.gray[900] }}>
                            {sale.sellerOrgName}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: colors.gray[500] }}>
                            Posted: {new Date(sale.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: colors.gray[600] }}>
                              Credits
                            </p>
                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.green[700] }}>
                              {sale.creditAmount.toFixed(2)}
                            </p>
                          </div>
                          
                          <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: colors.gray[600] }}>
                              Price per Credit
                            </p>
                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.gray[900] }}>
                              ${sale.price.toFixed(2)}
                            </p>
                          </div>
                          
                          <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: colors.gray[600] }}>
                              Total Cost
                            </p>
                            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: colors.gray[900] }}>
                              ${(sale.creditAmount * sale.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handlePurchaseCredits(sale)}
                          disabled={isProcessingTransaction}
                          style={{
                            ...styles.button,
                            ...styles.primaryButton,
                            width: '100%',
                            opacity: isProcessingTransaction ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => !isProcessingTransaction && (e.currentTarget.style.boxShadow = styles.primaryButtonHover.boxShadow)}
                          onMouseLeave={(e) => !isProcessingTransaction && (e.currentTarget.style.boxShadow = styles.primaryButton.boxShadow)}
                        >
                          {isProcessingTransaction ? 'Processing...' : 'Purchase Credits'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {transactionError && (
                  <div style={{ backgroundColor: colors.red[50], padding: '0.75rem', borderRadius: '0.375rem' }}>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500, color: colors.red[700] }}>
                      {transactionError}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div style={styles.modalFooter}>
            {transactionType === 'sell' && (
              <button
                onClick={handlePostSale}
                disabled={isProcessingTransaction}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  opacity: isProcessingTransaction ? 0.7 : 1
                }}
                onMouseEnter={(e) => !isProcessingTransaction && (e.currentTarget.style.boxShadow = styles.primaryButtonHover.boxShadow)}
                onMouseLeave={(e) => !isProcessingTransaction && (e.currentTarget.style.boxShadow = styles.primaryButton.boxShadow)}
              >
                {isProcessingTransaction ? 'Processing...' : 'Post Sale'}
              </button>
            )}
            
            <button
              onClick={() => {
                setShowTransactionModal(false);
                setTransactionError('');
              }}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
                marginLeft: transactionType === 'sell' ? '0.5rem' : 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = styles.secondaryButtonHover.backgroundColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = styles.secondaryButton.backgroundColor;
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Add a function to refresh credits
  const refreshCredits = async () => {
    if (!currentOrganization || !userData?.domain) return;
    
    try {
      setLoading(true);
      
      // Get all approved employees
      const employeesQuery = query(
        collection(db, 'users'),
        where('domain', '==', userData.domain),
        where('role', '==', 'employee'),
        where('approved', '==', true)
      );
      
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeeIds: string[] = [];
      
      employeesSnapshot.forEach(doc => {
        employeeIds.push(doc.id);
      });
      
      if (employeeIds.length === 0) {
        setLoading(false);
        return;
      }
      
      // Calculate credits from all trips
      const tripsQuery = query(
        collection(db, 'trips'),
        where('userId', 'in', employeeIds)
      );
      
      const tripsSnapshot = await getDocs(tripsQuery);
      const tripsList: TripData[] = [];
      let totalCredits = 0;
      
      // Create a map to store credits per employee
      const employeeCreditMap: Record<string, number> = {};
      
      // Initialize credits for each employee to 0
      employeeIds.forEach(id => {
        employeeCreditMap[id] = 0;
      });
      
      tripsSnapshot.forEach(doc => {
        const data = doc.data();
        const trip: TripData = {
          id: doc.id,
          userId: data.userId || '',
          startLocation: data.startLocation || { latitude: 0, longitude: 0 },
          endLocation: data.endLocation || { latitude: 0, longitude: 0 },
          startAddress: data.startAddress,
          endAddress: data.endAddress,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
          tripDate: data.tripDate?.toDate() || new Date(),
          distanceKm: data.distanceKm || 0,
          avgSpeedKmh: data.avgSpeedKmh || 0,
          transportMode: data.transportMode || 'unknown',
          carbonCredits: data.carbonCredits || 0,
          isWorkFromHome: data.isWorkFromHome || false
        };
        
        tripsList.push(trip);
        totalCredits += trip.carbonCredits;
        
        // Add this trip's credits to the employee's total
        if (trip.userId) {
          employeeCreditMap[trip.userId] = (employeeCreditMap[trip.userId] || 0) + trip.carbonCredits;
        }
      });
      
      // Update employee credits in state
      const updatedEmployees = employees.map(employee => ({
        ...employee,
        calculatedCredits: employeeCreditMap[employee.id] || 0
      }));
      
      setEmployees(updatedEmployees);
      setTrips(tripsList);
      setTotalOrgCredits(totalCredits);
      
      // Update only carbonCredits (earned credits) in Firestore, not totalCredits (trading credits)
      const orgRef = doc(db, 'organizations', currentOrganization.id);
      await updateDoc(orgRef, {
        carbonCredits: totalCredits
      });
      
      // Update carbonCredits in state without changing totalCredits
      setCurrentOrganization({
        ...currentOrganization,
        carbonCredits: totalCredits
      });
      
      showToast('Credits refreshed successfully', 'success');
    } catch (error) {
      console.error("Error refreshing credits:", error);
      showToast('Failed to refresh credits', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header 
        userData={userData}
        showSearch={false}
      />
      <main style={styles.contentArea}>
        <div style={styles.maxWidthWrapper}>
          {loading ? (
            <div style={styles.loader}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke={colors.gray[300]} strokeWidth="4" />
                <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke={colors.green[500]} strokeWidth="4" />
              </svg>
              <p style={styles.loaderText}>Loading organization data...</p>
            </div>
          ) : !currentOrganization ? (
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>Organization Dashboard</h3>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.emptyState}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    style={{ width: '48px', height: '48px', color: colors.green[300], margin: '0 auto 1rem' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p style={styles.emptyStateTitle}>Organization Not Found</p>
                  <p style={styles.emptyStateText}>
                    We couldn't locate your organization information. Please contact support for assistance.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Organization Summary Card */}
              <div style={styles.card}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.gray[100]}` }}>
                  <h3 style={sectionHeaderStyle}>
                    Organization Summary
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: colors.gray[600], margin: 0 }}>
                    {currentOrganization.name || 'Your Organization'}
                  </p>
                </div>
                
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ backgroundColor: colors.green[50], padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.green[700], margin: 0 }}>
                            Carbon Credits Summary
                          </p>
                          <button
                            onClick={refreshCredits}
                            title="Refresh Credits"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              borderRadius: '0.25rem',
                              color: colors.green[600]
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.green[100];
                              e.currentTarget.style.color = colors.green[800];
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = colors.green[600];
                            }}
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="16" 
                              height="16" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M23 4v6h-6" />
                              <path d="M1 20v-6h6" />
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
                            </svg>
                          </button>
                        </div>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: '1fr 1fr', 
                          gap: '1.5rem',
                          marginTop: '1rem' 
                        }}>
                          {/* Total Available Credits */}
                          <div style={{ 
                            padding: '1rem', 
                            backgroundColor: 'white', 
                            borderRadius: '0.5rem', 
                            border: `1px solid ${colors.green[100]}`
                          }}>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 500, 
                              color: colors.gray[700], 
                              margin: 0 
                            }}>
                              Available Trading Credits
                            </p>
                            <p style={{ 
                              fontSize: '1.75rem', 
                              fontWeight: 700, 
                              color: colors.green[700], 
                              margin: '0.25rem 0 0 0' 
                            }}>
                              {currentOrganization.totalCredits.toFixed(2)}
                            </p>
                            <p style={{ 
                              fontSize: '0.75rem', 
                              color: colors.gray[600], 
                              margin: '0.25rem 0 0 0' 
                            }}>
                              Credits for buying and selling
                            </p>
                          </div>
                          
                          {/* Credits Earned by Employees */}
                          <div style={{ 
                            padding: '1rem', 
                            backgroundColor: 'white', 
                            borderRadius: '0.5rem', 
                            border: `1px solid ${colors.green[100]}`
                          }}>
                            <p style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: 500, 
                              color: colors.gray[700], 
                              margin: 0 
                            }}>
                              Credits Earned by Employees
                            </p>
                            <p style={{ 
                              fontSize: '1.75rem', 
                              fontWeight: 700, 
                              color: colors.green[700], 
                              margin: '0.25rem 0 0 0' 
                            }}>
                              {currentOrganization.carbonCredits.toFixed(2)}
                            </p>
                            <p style={{ 
                              fontSize: '0.75rem', 
                              color: colors.gray[600], 
                              margin: '0.25rem 0 0 0' 
                            }}>
                              Total earned from sustainable trips
                            </p>
                          </div>
                        </div>
                        
                        {/* Available money display */}
                        <div style={{ 
                          marginTop: '1rem', 
                          padding: '0.75rem 1rem', 
                          backgroundColor: colors.green[100], 
                          borderRadius: '0.375rem',
                          display: 'inline-block'
                        }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.green[700], margin: 0 }}>
                            Available Money: <span style={{ fontWeight: 700 }}>${currentOrganization.availableMoney?.toFixed(2) || '0.00'}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => {
                            setTransactionType('buy');
                            setSelectedOrgId('');
                            setCreditAmount('');
                            setCreditPrice('');
                            setShowTransactionModal(true);
                          }}
                          style={{
                            ...styles.button,
                            ...styles.primaryButton,
                            padding: '0.625rem 1.25rem',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = styles.primaryButtonHover.boxShadow;
                            e.currentTarget.style.transform = styles.primaryButtonHover.transform as string;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = styles.primaryButton.boxShadow;
                            e.currentTarget.style.transform = '';
                          }}
                        >
                          Buy Credits
                        </button>
                        
                        <button
                          onClick={() => {
                            setTransactionType('sell');
                            setSelectedOrgId('');
                            setCreditAmount('');
                            setCreditPrice('');
                            setShowTransactionModal(true);
                          }}
                          style={{
                            ...styles.button,
                            ...styles.secondaryButton,
                            padding: '0.625rem 1.25rem',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = styles.secondaryButtonHover.backgroundColor;
                            e.currentTarget.style.transform = styles.secondaryButtonHover.transform as string;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = styles.secondaryButton.backgroundColor;
                            e.currentTarget.style.transform = '';
                          }}
                        >
                          Sell Credits
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ backgroundColor: colors.white, borderRadius: '0.5rem', padding: '1rem', border: `1px solid ${colors.gray[200]}` }}>
                      <p style={{ fontSize: '0.875rem', color: colors.gray[600], margin: 0 }}>
                        Domain
                      </p>
                      <p style={{ fontSize: '1rem', fontWeight: 500, color: colors.gray[900], margin: '0.25rem 0 0 0' }}>
                        {currentOrganization.domain}
                      </p>
                    </div>
                    
                    <div style={{ backgroundColor: colors.white, borderRadius: '0.5rem', padding: '1rem', border: `1px solid ${colors.gray[200]}` }}>
                      <p style={{ fontSize: '0.875rem', color: colors.gray[600], margin: 0 }}>
                        Total Employees
                      </p>
                      <p style={{ fontSize: '1rem', fontWeight: 500, color: colors.gray[900], margin: '0.25rem 0 0 0' }}>
                        {employees.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Credit Breakdown Section */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                {/* Employee List Component */}
                <div style={styles.card}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.gray[100]}` }}>
                    <h3 style={sectionHeaderStyle}>
                      Employees
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: colors.gray[600], margin: 0 }}>
                      {employees.length} employees contributing to carbon credits
                    </p>
                  </div>
                  
                  <div style={tableContainerStyle} className={`${scrollbarStyles.scrollable} ${scrollbarStyles.scrollbarCustom}`}>
                    <table style={{...styles.table, width: '100%', tableLayout: 'fixed' as const}}>
                      <thead>
                        <tr>
                          <th style={{...styles.tableHeader, width: '35%'}}>Employee</th>
                          <th style={{...styles.tableHeader, width: '35%'}}>Email</th>
                          <th style={{...styles.tableHeader, width: '20%', textAlign: 'right' as const}}>Credits</th>
                          <th style={{...styles.tableHeader, width: '10%', textAlign: 'center' as const}}>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.length === 0 ? (
                          <tr>
                            <td colSpan={4} style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                              No employees found for your organization
                            </td>
                          </tr>
                        ) : (
                          employees.map(employee => (
                            <tr 
                              key={employee.id}
                              style={styles.tableRow}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                            >
                              <td style={styles.tableCell}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <div style={{
                                    width: '2rem',
                                    height: '2rem',
                                    borderRadius: '9999px',
                                    backgroundColor: colors.green[100],
                                    color: colors.green[700],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    marginRight: '0.75rem'
                                  }}>
                                    {employee.name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <span style={{ fontWeight: 500 }}>{employee.name}</span>
                                </div>
                              </td>
                              <td style={styles.tableCell}>{employee.email}</td>
                              <td style={{...styles.tableCell, fontWeight: 600, color: colors.green[700], textAlign: 'right' as const}}>
                                {employee.calculatedCredits !== undefined ? employee.calculatedCredits.toFixed(2) : '0.00'}
                              </td>
                              <td style={{...styles.tableCell, textAlign: 'center' as const}}>
                                <button
                                  onClick={() => handleViewEmployeeCredits(employee)}
                                  style={{
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0.25rem',
                                    borderRadius: '0.25rem',
                                    color: colors.green[600]
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = colors.green[50];
                                    e.currentTarget.style.color = colors.green[700];
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = colors.green[600];
                                  }}
                                  title="View Credit History"
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="20" 
                                    height="20" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="16" x2="12" y2="12"></line>
                                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Credits Breakdown Card */}
                <CreditBreakdownCard />
              </div>
              
              {/* Pending Employees Approval Section */}
              {pendingEmployees.length > 0 && (
                <div style={styles.card}>
                  <div style={{ padding: '1.25rem 1.5rem', borderBottom: `1px solid ${colors.gray[100]}` }}>
                    <h3 style={sectionHeaderStyle}>
                      Pending Employee Registrations
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: colors.gray[600], margin: 0 }}>
                      {pendingEmployees.length} pending employee{pendingEmployees.length !== 1 ? 's' : ''} waiting for approval
                    </p>
                  </div>
                  
                  <div style={tableContainerStyle} className={`${scrollbarStyles.scrollable} ${scrollbarStyles.scrollbarCustom}`}>
                    <table style={{...styles.table, width: '100%', tableLayout: 'fixed' as const}}>
                      <thead>
                        <tr>
                          <th style={{...styles.tableHeader, width: '30%'}}>Name</th>
                          <th style={{...styles.tableHeader, width: '40%'}}>Email</th>
                          <th style={{...styles.tableHeader, width: '15%'}}>Date</th>
                          <th style={{...styles.tableHeader, width: '15%', textAlign: 'center' as const}}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingEmployees.map(employee => (
                          <tr 
                            key={employee.id}
                            style={styles.tableRow}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                          >
                            <td style={styles.tableCell}>{employee.fullName}</td>
                            <td style={styles.tableCell}>{employee.email}</td>
                            <td style={styles.tableCell}>
                              {new Date(employee.createdAt).toLocaleDateString()}
                            </td>
                            <td style={{...styles.tableCell, textAlign: 'center' as const}}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <button
                                  onClick={() => handleEmployeeApproval(employee.id, true)}
                                  disabled={isProcessingApproval}
                                  style={{
                                    ...styles.button,
                                    ...styles.approveButton,
                                    opacity: isProcessingApproval ? 0.7 : 1
                                  }}
                                  onMouseEnter={(e) => !isProcessingApproval && Object.assign(e.currentTarget.style, styles.approveButtonHover)}
                                  onMouseLeave={(e) => !isProcessingApproval && Object.assign(e.currentTarget.style, styles.approveButton)}
                                >
                                  Approve
                                </button>
                                
                                <button
                                  onClick={() => handleEmployeeApproval(employee.id, false)}
                                  disabled={isProcessingApproval}
                                  style={{
                                    ...styles.button,
                                    ...styles.rejectButton,
                                    opacity: isProcessingApproval ? 0.7 : 1
                                  }}
                                  onMouseEnter={(e) => !isProcessingApproval && Object.assign(e.currentTarget.style, styles.rejectButtonHover)}
                                  onMouseLeave={(e) => !isProcessingApproval && Object.assign(e.currentTarget.style, styles.rejectButton)}
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Transaction Modal */}
      {showTransactionModal && <TransactionModal />}
      
      {/* Employee Credit History Modal */}
      {showCreditHistoryModal && <EmployeeCreditHistoryModal />}
      
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
};

export default EmployerDashboard; 