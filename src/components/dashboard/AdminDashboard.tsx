'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { styles, colors } from './dashboardStyles';
import { 
  PendingEmployer, 
  PendingEmployee, 
  Toast as ToastType, 
  Organization, 
  Employee, 
  CreditTransaction, 
  TripData,
  UserData
} from './dashboardTypes';
import { useAuth } from '@/contexts/AuthContext';
import Toast from './Toast';
import Header from './Header';
import scrollbarStyles from './scrollbar.module.css';

const AdminDashboard: React.FC = () => {
  // Define additional colors needed for badges
  const extendedColors = {
    blue: {
      100: '#dbeafe',
      700: '#1d4ed8'
    },
    yellow: {
      100: '#fef9c3',
      700: '#a16207'
    },
    orange: {
      100: '#ffedd5',
      700: '#c2410c'
    },
    red: {
      100: '#fee2e2',
      700: '#b91c1c'
    },
    green: {
      100: '#d1fae5',
      700: '#15803d'
    }
  };

  // Original state variables
  const [pendingEmployers, setPendingEmployers] = useState<PendingEmployer[]>([]);
  const [pendingEmployees, setPendingEmployees] = useState<PendingEmployee[]>([]);
  
  // New state variables for all data
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employers, setEmployers] = useState<UserData[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  
  // Active tab management
  const [activeTab, setActiveTab] = useState<string>('organizations');
  
  // Standard states
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastType>({ visible: false, message: '', type: 'info' });
  
  const { userData } = useAuth();

  useEffect(() => {
    // Use type assertion to satisfy TypeScript
    if ((userData?.role as string) === 'admin' || (userData?.role as string) === 'system_admin') {
      fetchAllData();
    }
  }, [userData]);
  
  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingEmployers(),
        fetchPendingEmployees(),
        fetchOrganizations(),
        fetchUsers(),
        fetchTransactions(),
        fetchTrips()
      ]);
      showToast('All data loaded successfully', 'success');
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast('Error loading some data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingEmployers = async () => {
    try {
      const employersQuery = query(collection(db, 'pending_employers'));
      const employersSnapshot = await getDocs(employersQuery);
      
      const employersList: PendingEmployer[] = [];
      employersSnapshot.forEach(doc => {
        const data = doc.data();
        employersList.push({
          id: doc.id,
          fullName: data.fullName || 'Unknown',
          email: data.email || '',
          organizationName: data.organizationName || '',
          organizationDomain: data.organizationDomain || '',
          createdAt: data.createdAt || ''
        });
      });
      
      setPendingEmployers(employersList);
    } catch (error) {
      console.error("Error fetching pending employers:", error);
      showToast('Failed to load pending employer data', 'error');
    }
  };

  const fetchPendingEmployees = async () => {
    try {
      const employeesQuery = query(
        collection(db, 'pending_employees')
      );
      
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesList: PendingEmployee[] = [];
      
      employeesSnapshot.forEach(doc => {
        const data = doc.data();
        employeesList.push({
          id: doc.id,
          fullName: data.fullName || 'Unknown Employee',
          email: data.email || '',
          domain: data.domain || '',
          createdAt: data.createdAt || ''
        });
      });
      
      setPendingEmployees(employeesList);
    } catch (error) {
      console.error("Error fetching pending employees:", error);
      showToast('Failed to load pending employee data', 'error');
    }
  };
  
  const fetchOrganizations = async () => {
    try {
      const orgsQuery = query(
        collection(db, 'organizations'),
        orderBy('name')
      );
      
      const orgsSnapshot = await getDocs(orgsQuery);
      const orgsList: Organization[] = [];
      
      orgsSnapshot.forEach(doc => {
        const data = doc.data();
        orgsList.push({
          id: doc.id,
          name: data.name || 'Unknown Organization',
          domain: data.domain || '',
          address: data.address,
          totalCredits: data.totalCredits || 0,
          carbonCredits: data.carbonCredits || 0,
          availableMoney: data.availableMoney || 0,
          createdAt: data.createdAt || '',
          approved: data.approved
        });
      });
      
      setOrganizations(orgsList);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      showToast('Failed to load organizations data', 'error');
    }
  };
  
  const fetchUsers = async () => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('name')
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersList: UserData[] = [];
      const employeesList: Employee[] = [];
      const employersList: UserData[] = [];
      
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const userData: UserData = {
          uid: doc.id,
          name: data.name || 'Unknown User',
          email: data.email || '',
          role: data.role || 'user',
          domain: data.domain || '',
          organizationId: data.organizationId,
          approved: data.approved || false,
          createdAt: data.createdAt || '',
          lastLogin: data.lastLogin || '',
          carbonCredits: data.carbonCredits || 0
        };
        
        usersList.push(userData);
        
        // Sort users by role
        if (data.role === 'employee') {
          employeesList.push({
            id: doc.id,
            name: data.name || 'Unknown Employee',
            email: data.email || '',
            domain: data.domain || '',
            carbonCredits: data.carbonCredits || 0,
            role: data.role,
            approved: data.approved
          });
        } else if (data.role === 'employer') {
          employersList.push(userData);
        }
      });
      
      setAllUsers(usersList);
      setEmployees(employeesList);
      setEmployers(employersList);
    } catch (error) {
      console.error("Error fetching users:", error);
      showToast('Failed to load users data', 'error');
    }
  };
  
  const fetchTransactions = async () => {
    try {
      const transactionsQuery = query(
        collection(db, 'credit_transactions'),
        orderBy('createdAt', 'desc')
      );
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsList: CreditTransaction[] = [];
      
      transactionsSnapshot.forEach(doc => {
        const data = doc.data();
        transactionsList.push({
          id: doc.id,
          sellerOrgId: data.sellerOrgId || '',
          sellerOrgName: data.sellerOrgName || 'Unknown Seller',
          buyerOrgId: data.buyerOrgId || '',
          buyerOrgName: data.buyerOrgName || 'Unknown Buyer',
          creditAmount: data.creditAmount || 0,
          price: data.price || 0,
          status: data.status || 'pending',
          createdAt: data.createdAt || ''
        });
      });
      
      setTransactions(transactionsList);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      showToast('Failed to load transactions data', 'error');
    }
  };
  
  const fetchTrips = async () => {
    try {
      const tripsQuery = query(
        collection(db, 'trips'),
        orderBy('tripDate', 'desc'),
        limit(1000) // Limit to prevent fetching too many records
      );
      
      const tripsSnapshot = await getDocs(tripsQuery);
      const tripsList: TripData[] = [];
      
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
      });
      
      setTrips(tripsList);
    } catch (error) {
      console.error("Error fetching trips:", error);
      showToast('Failed to load trips data', 'error');
    }
  };

  const handleEmployerApproval = async (employerId: string, approve: boolean) => {
    try {
      const employer = pendingEmployers.find(e => e.id === employerId);
      if (!employer) {
        showToast('Employer not found', 'error');
        return;
      }
      
      if (approve) {
        // Create organization record
        const orgRef = collection(db, 'organizations');
        const newOrgDoc = doc(orgRef);
        
        await updateDoc(doc(db, 'users', employerId), {
          approved: true
        });
        
        // Add to organizations collection with the availableMoney field
        await updateDoc(newOrgDoc, {
          name: employer.organizationName,
          domain: employer.organizationDomain,
          totalCredits: 0,
          availableMoney: 1000, // Initialize with some starting money (e.g., $1000)
          approved: true,
          createdAt: new Date().toISOString()
        });
        
        showToast('Employer approved successfully', 'success');
      } else {
        // Delete user account and pending record
        await deleteDoc(doc(db, 'users', employerId));
        showToast('Employer rejected', 'info');
      }
      
      // Remove from pending_employers collection
      await deleteDoc(doc(db, 'pending_employers', employerId));
      
      // Refresh the list
      fetchPendingEmployers();
      // Also refresh other related data
      fetchUsers();
      fetchOrganizations();
    } catch (error) {
      console.error("Error handling employer approval:", error);
      showToast('Failed to process employer approval', 'error');
    }
  };

  const handleEmployeeApproval = async (employeeId: string, approve: boolean) => {
    try {
      if (approve) {
        await updateDoc(doc(db, 'users', employeeId), {
          approved: true
        });
        
        showToast('Employee approved successfully', 'success');
      } else {
        // Delete user account
        await deleteDoc(doc(db, 'users', employeeId));
        showToast('Employee rejected', 'info');
      }
      
      // Remove from pending collection
      await deleteDoc(doc(db, 'pending_employees', employeeId));
      
      // Refresh the lists
      fetchPendingEmployees();
      fetchUsers();
    } catch (error) {
      console.error("Error handling employee approval:", error);
      showToast('Failed to process employee approval', 'error');
    }
  };

  const showToast = (message: string, type: ToastType['type']) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };
  
  // Get user name by ID (helper function)
  const getUserNameById = (userId: string): string => {
    const user = allUsers.find(u => u.uid === userId);
    return user ? user.name : 'Unknown User';
  };
  
  // Get organization name by ID (helper function)
  const getOrgNameById = (orgId: string): string => {
    const org = organizations.find(o => o.id === orgId);
    return org ? org.name : 'Unknown Organization';
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };
  
  // Tab navigation
  const renderTab = (id: string, label: string) => {
    return (
      <button
        onClick={() => setActiveTab(id)}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: activeTab === id ? colors.green[100] : 'transparent',
          color: activeTab === id ? colors.green[800] : colors.gray[700],
          fontWeight: activeTab === id ? 600 : 500,
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.875rem'
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      <Header userData={userData} />
      <main style={styles.contentArea}>
        <div style={styles.maxWidthWrapper}>
          {loading ? (
            <div style={styles.loader}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
                <circle cx="12" cy="12" r="10" stroke={colors.gray[300]} strokeWidth="4" />
                <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke={colors.green[500]} strokeWidth="4" />
              </svg>
              <p style={styles.loaderText}>Loading dashboard data...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.gray[900], margin: 0 }}>
                  System Admin Dashboard
                </h1>
                
                <button
                  onClick={fetchAllData}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: colors.green[50],
                    color: colors.green[700],
                    border: `1px solid ${colors.green[200]}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
                  </svg>
                  Refresh Data
                </button>
              </div>
              
              {/* Tab Navigation */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                borderBottom: `1px solid ${colors.gray[200]}`,
                paddingBottom: '0.5rem',
                marginBottom: '1rem',
                overflowX: 'auto'
              }}>
                {renderTab('organizations', 'Organizations')}
                {renderTab('users', 'Users')}
                {renderTab('employees', 'Employees')}
                {renderTab('employers', 'Employers')}
                {renderTab('transactions', 'Transactions')}
                {renderTab('trips', 'Trips')}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Organizations Tab */}
                {activeTab === 'organizations' && (
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
                        Organizations
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: colors.gray[600],
                        margin: 0
                      }}>
                        All registered organizations in the system
                      </p>
                    </div>
                    
                    <div className={scrollbarStyles.scrollable}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Name</th>
                            <th style={styles.tableHeader}>Domain</th>
                            <th style={styles.tableHeader}>Carbon Credits</th>
                            <th style={styles.tableHeader}>Trading Credits</th>
                            <th style={styles.tableHeader}>Available Money</th>
                            <th style={styles.tableHeader}>Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizations.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>
                                No organizations found
                              </td>
                            </tr>
                          ) : (
                            organizations.map(org => (
                              <tr 
                                key={org.id}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                              >
                                <td style={styles.tableCell}>{org.name}</td>
                                <td style={styles.tableCell}>{org.domain}</td>
                                <td style={styles.tableCell}>{org.carbonCredits.toFixed(2)}</td>
                                <td style={styles.tableCell}>{org.totalCredits.toFixed(2)}</td>
                                <td style={styles.tableCell}>${org.availableMoney.toFixed(2)}</td>
                                <td style={styles.tableCell}>{formatDate(org.createdAt)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
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
                        All Users
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: colors.gray[600],
                        margin: 0
                      }}>
                        All users registered in the system
                      </p>
                    </div>
                    
                    <div className={scrollbarStyles.scrollable}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Name</th>
                            <th style={styles.tableHeader}>Email</th>
                            <th style={styles.tableHeader}>Role</th>
                            <th style={styles.tableHeader}>Created</th>
                            <th style={styles.tableHeader}>Last Login</th>
                            <th style={styles.tableHeader}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allUsers.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>
                                No users found
                              </td>
                            </tr>
                          ) : (
                            allUsers.map(user => (
                              <tr 
                                key={user.uid}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                              >
                                <td style={styles.tableCell}>{user.name}</td>
                                <td style={styles.tableCell}>{user.email}</td>
                                <td style={styles.tableCell}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    backgroundColor: 
                                      user.role === 'admin' 
                                        ? extendedColors.blue[100] 
                                        : user.role === 'bank' 
                                          ? extendedColors.orange[100] 
                                          : user.role === 'employer' 
                                            ? extendedColors.green[100] 
                                            : colors.gray[100],
                                    color: 
                                      user.role === 'admin' 
                                        ? extendedColors.blue[700] 
                                        : user.role === 'bank' 
                                          ? extendedColors.orange[700] 
                                          : user.role === 'employer' 
                                            ? extendedColors.green[700] 
                                            : colors.gray[700],
                                  }}>
                                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                  </span>
                                </td>
                                <td style={styles.tableCell}>{formatDate(user.createdAt)}</td>
                                <td style={styles.tableCell}>{formatDate(user.lastLogin)}</td>
                                <td style={styles.tableCell}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    backgroundColor: user.approved ? extendedColors.green[100] : extendedColors.red[100],
                                    color: user.approved ? extendedColors.green[700] : extendedColors.red[700],
                                  }}>
                                    {user.approved ? 'Approved' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Employees Tab */}
                {activeTab === 'employees' && (
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
                        Employees
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: colors.gray[600],
                        margin: 0
                      }}>
                        All employees registered in the system
                      </p>
                    </div>
                    
                    <div className={scrollbarStyles.scrollable}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Name</th>
                            <th style={styles.tableHeader}>Email</th>
                            <th style={styles.tableHeader}>Domain</th>
                            <th style={styles.tableHeader}>Organization</th>
                            <th style={styles.tableHeader}>Carbon Credits</th>
                            <th style={styles.tableHeader}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>
                                No employees found
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
                                <td style={styles.tableCell}>{employee.name}</td>
                                <td style={styles.tableCell}>{employee.email}</td>
                                <td style={styles.tableCell}>{employee.domain}</td>
                                <td style={styles.tableCell}>
                                  {organizations.find(org => org.domain === employee.domain)?.name || 'Unknown'}
                                </td>
                                <td style={styles.tableCell}>{employee.carbonCredits.toFixed(2)}</td>
                                <td style={styles.tableCell}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    backgroundColor: employee.approved ? extendedColors.green[100] : extendedColors.red[100],
                                    color: employee.approved ? extendedColors.green[700] : extendedColors.red[700],
                                  }}>
                                    {employee.approved ? 'Approved' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Employers Tab */}
                {activeTab === 'employers' && (
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
                        Employers
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: colors.gray[600],
                        margin: 0
                      }}>
                        All organization employers in the system
                      </p>
                    </div>
                    
                    <div className={scrollbarStyles.scrollable}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Name</th>
                            <th style={styles.tableHeader}>Email</th>
                            <th style={styles.tableHeader}>Organization</th>
                            <th style={styles.tableHeader}>Created</th>
                            <th style={styles.tableHeader}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employers.length === 0 ? (
                            <tr>
                              <td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }}>
                                No employers found
                              </td>
                            </tr>
                          ) : (
                            employers.map(employer => (
                              <tr 
                                key={employer.uid}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                              >
                                <td style={styles.tableCell}>{employer.name}</td>
                                <td style={styles.tableCell}>{employer.email}</td>
                                <td style={styles.tableCell}>
                                  {organizations.find(org => org.domain === employer.domain)?.name || 'Unknown'}
                                </td>
                                <td style={styles.tableCell}>{formatDate(employer.createdAt)}</td>
                                <td style={styles.tableCell}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    backgroundColor: employer.approved ? extendedColors.green[100] : extendedColors.red[100],
                                    color: employer.approved ? extendedColors.green[700] : extendedColors.red[700],
                                  }}>
                                    {employer.approved ? 'Approved' : 'Pending'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
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
                        Credit Transactions
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: colors.gray[600],
                        margin: 0
                      }}>
                        All carbon credit transactions between organizations
                      </p>
                    </div>
                    
                    <div className={scrollbarStyles.scrollable}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Date</th>
                            <th style={styles.tableHeader}>Seller</th>
                            <th style={styles.tableHeader}>Buyer</th>
                            <th style={styles.tableHeader}>Credits</th>
                            <th style={styles.tableHeader}>Price</th>
                            <th style={styles.tableHeader}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>
                                No transactions found
                              </td>
                            </tr>
                          ) : (
                            transactions.map(transaction => (
                              <tr 
                                key={transaction.id}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                              >
                                <td style={styles.tableCell}>{formatDate(transaction.createdAt)}</td>
                                <td style={styles.tableCell}>{transaction.sellerOrgName}</td>
                                <td style={styles.tableCell}>{transaction.buyerOrgName}</td>
                                <td style={styles.tableCell}>{transaction.creditAmount.toFixed(2)}</td>
                                <td style={styles.tableCell}>${transaction.price.toFixed(2)}</td>
                                <td style={styles.tableCell}>
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontWeight: 500,
                                    fontSize: '0.75rem',
                                    backgroundColor: 
                                      transaction.status === 'approved' 
                                        ? extendedColors.green[100] 
                                        : transaction.status === 'pending' 
                                          ? extendedColors.yellow[100] 
                                          : extendedColors.red[100],
                                    color: 
                                      transaction.status === 'approved' 
                                        ? extendedColors.green[700] 
                                        : transaction.status === 'pending' 
                                          ? extendedColors.yellow[700] 
                                          : extendedColors.red[700],
                                  }}>
                                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Trips Tab */}
                {activeTab === 'trips' && (
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
                        Employee Trips
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: colors.gray[600],
                        margin: 0
                      }}>
                        All recorded sustainable transportation trips
                      </p>
                    </div>
                    
                    <div className={scrollbarStyles.scrollable}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.tableHeader}>Date</th>
                            <th style={styles.tableHeader}>User</th>
                            <th style={styles.tableHeader}>Transport Mode</th>
                            <th style={styles.tableHeader}>Distance (km)</th>
                            <th style={styles.tableHeader}>Credits Earned</th>
                            <th style={styles.tableHeader}>Work From Home</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trips.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>
                                No trips found
                              </td>
                            </tr>
                          ) : (
                            trips.map(trip => (
                              <tr 
                                key={trip.id}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                              >
                                <td style={styles.tableCell}>
                                  {trip.tripDate instanceof Date 
                                    ? trip.tripDate.toLocaleDateString() 
                                    : new Date(trip.tripDate).toLocaleDateString()}
                                </td>
                                <td style={styles.tableCell}>{getUserNameById(trip.userId)}</td>
                                <td style={styles.tableCell}>
                                  {trip.transportMode.charAt(0).toUpperCase() + trip.transportMode.slice(1)}
                                </td>
                                <td style={styles.tableCell}>{trip.distanceKm.toFixed(2)}</td>
                                <td style={styles.tableCell}>{trip.carbonCredits.toFixed(2)}</td>
                                <td style={styles.tableCell}>{trip.isWorkFromHome ? 'Yes' : 'No'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
};

export default AdminDashboard; 