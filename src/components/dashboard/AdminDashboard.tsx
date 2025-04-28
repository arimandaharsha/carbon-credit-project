'use client';

import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, orderBy, limit, getDoc } from 'firebase/firestore';
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
    ...colors,
    amber: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    yellow: {
      100: '#fef9c3',
      200: '#fef08a',
      300: '#fde047',
      400: '#facc15',
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207',
      800: '#854d0e',
      900: '#713f12',
    },
    orange: {
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
    },
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
  
  // New state variables for enhanced functionality
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: string; name: string } | null>(null);
  const [stats, setStats] = useState<{
    totalOrgs: number;
    totalUsers: number;
    totalEmployees: number;
    totalTrips: number;
    totalCredits: number;
    pendingApprovals: number;
  }>({
    totalOrgs: 0,
    totalUsers: 0,
    totalEmployees: 0,
    totalTrips: 0,
    totalCredits: 0,
    pendingApprovals: 0
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  
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
      
      // Each fetch function now calls calculateStats individually
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
      calculateStats(); // Update stats after data is fetched
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
      calculateStats(); // Update stats after data is fetched
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
      calculateStats(); // Update stats after data is fetched
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
      calculateStats(); // Update stats after data is fetched
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
      calculateStats(); // Update stats after data is fetched
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
      calculateStats(); // Update stats after data is fetched
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
          backgroundColor: activeTab === id ? extendedColors.green[100] : 'transparent',
          color: activeTab === id ? extendedColors.green[800] : extendedColors.gray[700],
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

  // Add this after fetchAllData
  const calculateStats = () => {
    const totalOrgs = organizations.length;
    const totalUsers = allUsers.length;
    const totalEmployees = employees.length;
    const totalTrips = trips.length;
    const totalCredits = organizations.reduce((sum, org) => sum + org.totalCredits, 0);
    const pendingApprovals = pendingEmployers.length + pendingEmployees.length;

    setStats({
      totalOrgs,
      totalUsers,
      totalEmployees,
      totalTrips,
      totalCredits,
      pendingApprovals
    });
  };

  // Add this new function for deleting data
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      const { id, type } = itemToDelete;
      
      switch (type) {
        case 'organization':
          await deleteDoc(doc(db, 'organizations', id));
          setOrganizations(organizations.filter(org => org.id !== id));
          break;
        case 'user':
          await deleteDoc(doc(db, 'users', id));
          setAllUsers(allUsers.filter(user => user.uid !== id));
          setEmployees(employees.filter(emp => emp.id !== id));
          setPendingEmployers(pendingEmployers.filter(emp => emp.id !== id));
          break;
        case 'transaction':
          await deleteDoc(doc(db, 'credit_transactions', id));
          setTransactions(transactions.filter(t => t.id !== id));
          break;
        case 'trip':
          await deleteDoc(doc(db, 'trips', id));
          setTrips(trips.filter(trip => trip.id !== id));
          break;
        case 'pendingEmployer':
          await deleteDoc(doc(db, 'pending_employers', id));
          setPendingEmployers(pendingEmployers.filter(emp => emp.id !== id));
          break;
        case 'pendingEmployee':
          await deleteDoc(doc(db, 'pending_employees', id));
          setPendingEmployees(pendingEmployees.filter(emp => emp.id !== id));
          break;
        default:
          break;
      }
      
      // Recalculate stats after deletion
      calculateStats();
      
      showToast(`${itemToDelete.type} deleted successfully`, 'success');
    } catch (error) {
      console.error("Error deleting item:", error);
      showToast(`Failed to delete ${itemToDelete.type}`, 'error');
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  // Add this new function for exporting data
  const exportData = (dataType: string) => {
    setIsExporting(true);
    
    try {
      let dataToExport: any[] = [];
      let fileName = '';
      
      switch (dataType) {
        case 'organizations':
          dataToExport = organizations;
          fileName = 'organizations.json';
          break;
        case 'users':
          dataToExport = allUsers;
          fileName = 'users.json';
          break;
        case 'employees':
          dataToExport = employees;
          fileName = 'employees.json';
          break;
        case 'employers':
          dataToExport = employers;
          fileName = 'employers.json';
          break;
        case 'transactions':
          dataToExport = transactions;
          fileName = 'transactions.json';
          break;
        case 'trips':
          dataToExport = trips;
          fileName = 'trips.json';
          break;
        default:
          break;
      }
      
      // Create download link
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      
      URL.revokeObjectURL(url);
      showToast(`${dataType} data exported successfully`, 'success');
    } catch (error) {
      console.error("Error exporting data:", error);
      showToast(`Failed to export ${dataType} data`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Add code for the DeleteConfirmationModal component
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal || !itemToDelete) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          width: '90%',
          maxWidth: '450px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            color: extendedColors.gray[900],
            marginTop: 0,
            marginBottom: '1rem'
          }}>
            Confirm Deletion
          </h3>
          
          <p style={{ color: extendedColors.gray[700], marginBottom: '1.5rem' }}>
            Are you sure you want to delete this {itemToDelete.type}?
            <br/>
            <strong>{itemToDelete.name}</strong>
            <br/><br/>
            This action cannot be undone.
          </p>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '0.75rem' 
          }}>
            <button 
              onClick={() => setShowDeleteModal(false)}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: extendedColors.gray[100],
                color: extendedColors.gray[700],
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            
            <button 
              onClick={handleDeleteItem}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: extendedColors.red[600],
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Update the getFilteredData function to handle all data types properly
  const getFilteredData = (data: any[], keys: string[]) => {
    if (!searchTerm.trim()) return data;
    
    const term = searchTerm.toLowerCase();
    return data.filter(item => 
      keys.some(key => {
        // Handle nested properties and different data types
        const value = item[key];
        
        // Handle undefined values
        if (value === undefined || value === null) return false;
        
        // Handle numbers
        if (typeof value === 'number') {
          return value.toString().includes(term);
        }
        
        // Handle booleans
        if (typeof value === 'boolean') {
          return value.toString().toLowerCase().includes(term);
        }
        
        // Handle dates
        if (value instanceof Date) {
          return value.toLocaleDateString().toLowerCase().includes(term) ||
                 value.toLocaleString().toLowerCase().includes(term);
        }
        
        // Handle strings
        if (typeof value === 'string') {
          return value.toLowerCase().includes(term);
        }
        
        // Handle objects (like nested properties)
        if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(term);
        }
        
        return false;
      })
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
                <circle cx="12" cy="12" r="10" stroke={extendedColors.gray[300]} strokeWidth="4" />
                <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke={extendedColors.green[500]} strokeWidth="4" />
              </svg>
              <p style={styles.loaderText}>Loading dashboard data...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: extendedColors.gray[900], margin: 0 }}>
                  System Admin Dashboard
                </h1>
                
                <button
                  onClick={fetchAllData}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: extendedColors.green[50],
                    color: extendedColors.green[700],
                    border: `1px solid ${extendedColors.green[200]}`,
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
              
              {/* Stats Dashboard */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div style={{
                  backgroundColor: extendedColors.white,
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  padding: '1rem',
                  border: `1px solid ${extendedColors.gray[100]}`
                }}>
                  <h3 style={{ fontSize: '0.875rem', color: extendedColors.gray[500], margin: 0, marginBottom: '0.5rem' }}>Organizations</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: extendedColors.gray[900], margin: 0 }}>{stats.totalOrgs}</p>
                </div>
                
                <div style={{
                  backgroundColor: extendedColors.white,
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  padding: '1rem',
                  border: `1px solid ${extendedColors.gray[100]}`
                }}>
                  <h3 style={{ fontSize: '0.875rem', color: extendedColors.gray[500], margin: 0, marginBottom: '0.5rem' }}>Users</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: extendedColors.gray[900], margin: 0 }}>{stats.totalUsers}</p>
                </div>
                
                <div style={{
                  backgroundColor: extendedColors.white,
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  padding: '1rem',
                  border: `1px solid ${extendedColors.gray[100]}`
                }}>
                  <h3 style={{ fontSize: '0.875rem', color: extendedColors.gray[500], margin: 0, marginBottom: '0.5rem' }}>Total Trips</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: extendedColors.gray[900], margin: 0 }}>{stats.totalTrips}</p>
                </div>
                
                <div style={{
                  backgroundColor: extendedColors.white,
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  padding: '1rem',
                  border: `1px solid ${extendedColors.gray[100]}`
                }}>
                  <h3 style={{ fontSize: '0.875rem', color: extendedColors.gray[500], margin: 0, marginBottom: '0.5rem' }}>Total Credits</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: extendedColors.green[600], margin: 0 }}>{stats.totalCredits.toFixed(2)}</p>
                </div>
                
                <div style={{
                  backgroundColor: extendedColors.white,
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  padding: '1rem',
                  border: `1px solid ${extendedColors.gray[100]}`,
                  borderLeft: `4px solid ${extendedColors.amber[500]}`
                }}>
                  <h3 style={{ fontSize: '0.875rem', color: extendedColors.gray[500], margin: 0, marginBottom: '0.5rem' }}>Pending Approvals</h3>
                  <p style={{ fontSize: '1.5rem', fontWeight: 600, color: extendedColors.amber[600], margin: 0 }}>{stats.pendingApprovals}</p>
                </div>
              </div>
              
              {/* Tab Navigation */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                borderBottom: `1px solid ${extendedColors.gray[200]}`,
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
              
              {/* Add search bar for all tabs */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div style={{
                  position: 'relative',
                  flexGrow: 1,
                  maxWidth: '500px'
                }}>
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      paddingLeft: '2.5rem',
                      borderRadius: '0.375rem',
                      border: `1px solid ${extendedColors.gray[300]}`,
                      fontSize: '0.875rem',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={extendedColors.gray[400]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
                
                <button
                  onClick={() => exportData(activeTab)}
                  disabled={isExporting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: extendedColors.blue[50],
                    color: extendedColors.blue[700],
                    border: `1px solid ${extendedColors.blue[200]}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    opacity: isExporting ? 0.7 : 1
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Organizations Tab */}
                {activeTab === 'organizations' && (
                  <div style={styles.card}>
                    <div style={{ 
                      padding: '1.25rem 1.5rem', 
                      borderBottom: `1px solid ${extendedColors.gray[100]}` 
                    }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 600, 
                        color: extendedColors.gray[900], 
                        marginBottom: '0.5rem' 
                      }}>
                        Organizations
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: extendedColors.gray[600],
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
                            <th style={styles.tableHeader}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData(organizations, ['name', 'domain']).length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>
                                No organizations found
                              </td>
                            </tr>
                          ) : (
                            getFilteredData(organizations, ['name', 'domain']).map(org => (
                              <tr 
                                key={org.id}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = extendedColors.gray[50]}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                              >
                                <td style={styles.tableCell}>{org.name}</td>
                                <td style={styles.tableCell}>{org.domain}</td>
                                <td style={styles.tableCell}>{org.carbonCredits.toFixed(2)}</td>
                                <td style={styles.tableCell}>{org.totalCredits.toFixed(2)}</td>
                                <td style={styles.tableCell}>${org.availableMoney.toFixed(2)}</td>
                                <td style={styles.tableCell}>{formatDate(org.createdAt)}</td>
                                <td style={styles.tableCell}>
                                  <button
                                    onClick={() => {
                                      setItemToDelete({
                                        id: org.id,
                                        type: 'organization',
                                        name: org.name
                                      });
                                      setShowDeleteModal(true);
                                    }}
                                    style={{
                                      backgroundColor: extendedColors.red[50],
                                      color: extendedColors.red[700],
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete
                                  </button>
                                </td>
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
                      borderBottom: `1px solid ${extendedColors.gray[100]}` 
                    }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 600, 
                        color: extendedColors.gray[900], 
                        marginBottom: '0.5rem' 
                      }}>
                        All Users
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: extendedColors.gray[600],
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
                            <th style={styles.tableHeader}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData(allUsers, ['name', 'email', 'role']).length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>
                                No users found
                              </td>
                            </tr>
                          ) : (
                            getFilteredData(allUsers, ['name', 'email', 'role']).map(user => (
                              <tr 
                                key={user.uid}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = extendedColors.gray[50]}
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
                                            : extendedColors.gray[100],
                                    color: 
                                      user.role === 'admin' 
                                        ? extendedColors.blue[700] 
                                        : user.role === 'bank' 
                                          ? extendedColors.orange[700] 
                                          : user.role === 'employer' 
                                            ? extendedColors.green[700] 
                                            : extendedColors.gray[700],
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
                                <td style={styles.tableCell}>
                                  <button
                                    onClick={() => {
                                      setItemToDelete({
                                        id: user.uid,
                                        type: 'user',
                                        name: user.name
                                      });
                                      setShowDeleteModal(true);
                                    }}
                                    style={{
                                      backgroundColor: extendedColors.red[50],
                                      color: extendedColors.red[700],
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete
                                  </button>
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
                      borderBottom: `1px solid ${extendedColors.gray[100]}` 
                    }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 600, 
                        color: extendedColors.gray[900], 
                        marginBottom: '0.5rem' 
                      }}>
                        Employees
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: extendedColors.gray[600],
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
                            <th style={styles.tableHeader}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData(employees, ['name', 'email', 'domain']).length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>
                                No employees found
                              </td>
                            </tr>
                          ) : (
                            getFilteredData(employees, ['name', 'email', 'domain']).map(employee => (
                              <tr 
                                key={employee.id}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = extendedColors.gray[50]}
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
                                <td style={styles.tableCell}>
                                  <button
                                    onClick={() => {
                                      setItemToDelete({
                                        id: employee.id,
                                        type: 'employee',
                                        name: employee.name
                                      });
                                      setShowDeleteModal(true);
                                    }}
                                    style={{
                                      backgroundColor: extendedColors.red[50],
                                      color: extendedColors.red[700],
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete
                                  </button>
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
                      borderBottom: `1px solid ${extendedColors.gray[100]}` 
                    }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 600, 
                        color: extendedColors.gray[900], 
                        marginBottom: '0.5rem' 
                      }}>
                        Employers
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: extendedColors.gray[600],
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
                            <th style={styles.tableHeader}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData(employers, ['name', 'email', 'domain']).length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ padding: '2rem', textAlign: 'center' }}>
                                No employers found
                              </td>
                            </tr>
                          ) : (
                            getFilteredData(employers, ['name', 'email', 'domain']).map(employer => (
                              <tr 
                                key={employer.uid}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = extendedColors.gray[50]}
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
                                <td style={styles.tableCell}>
                                  <button
                                    onClick={() => {
                                      setItemToDelete({
                                        id: employer.uid,
                                        type: 'employer',
                                        name: employer.name
                                      });
                                      setShowDeleteModal(true);
                                    }}
                                    style={{
                                      backgroundColor: extendedColors.red[50],
                                      color: extendedColors.red[700],
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete
                                  </button>
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
                      borderBottom: `1px solid ${extendedColors.gray[100]}` 
                    }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 600, 
                        color: extendedColors.gray[900], 
                        marginBottom: '0.5rem' 
                      }}>
                        Credit Transactions
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: extendedColors.gray[600],
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
                            <th style={styles.tableHeader}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData(transactions, ['sellerOrgName', 'buyerOrgName', 'status']).length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>
                                No transactions found
                              </td>
                            </tr>
                          ) : (
                            getFilteredData(transactions, ['sellerOrgName', 'buyerOrgName', 'status']).map(transaction => (
                              <tr 
                                key={transaction.id}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = extendedColors.gray[50]}
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
                                <td style={styles.tableCell}>
                                  <button
                                    onClick={() => {
                                      setItemToDelete({
                                        id: transaction.id,
                                        type: 'transaction',
                                        name: `${transaction.sellerOrgName} to ${transaction.buyerOrgName}`
                                      });
                                      setShowDeleteModal(true);
                                    }}
                                    style={{
                                      backgroundColor: extendedColors.red[50],
                                      color: extendedColors.red[700],
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete
                                  </button>
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
                      borderBottom: `1px solid ${extendedColors.gray[100]}` 
                    }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: 600, 
                        color: extendedColors.gray[900], 
                        marginBottom: '0.5rem' 
                      }}>
                        Employee Trips
                      </h3>
                      <p style={{ 
                        fontSize: '0.875rem', 
                        color: extendedColors.gray[600],
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
                            <th style={styles.tableHeader}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getFilteredData(trips, ['userId', 'transportMode']).length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ padding: '2rem', textAlign: 'center' }}>
                                No trips found
                              </td>
                            </tr>
                          ) : (
                            getFilteredData(trips, ['userId', 'transportMode']).map(trip => (
                              <tr 
                                key={trip.id}
                                style={styles.tableRow}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = extendedColors.gray[50]}
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
                                <td style={styles.tableCell}>
                                  <button
                                    onClick={() => {
                                      setItemToDelete({
                                        id: trip.id,
                                        type: 'trip',
                                        name: `${getUserNameById(trip.userId)}'s trip`
                                      });
                                      setShowDeleteModal(true);
                                    }}
                                    style={{
                                      backgroundColor: extendedColors.red[50],
                                      color: extendedColors.red[700],
                                      border: 'none',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '0.25rem',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.25rem'
                                    }}
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18"></path>
                                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    Delete
                                  </button>
                                </td>
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
          
          {/* Render the delete confirmation modal */}
          <DeleteConfirmationModal />
          
          {/* Toast notification */}
          {toast.visible && (
            <Toast 
              toast={toast}
              onClose={hideToast} 
            />
          )}
        </div>
      </main>
    </>
  );
};

export default AdminDashboard; 