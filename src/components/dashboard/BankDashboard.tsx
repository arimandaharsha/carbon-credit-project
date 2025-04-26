'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, increment, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { styles, colors } from './dashboardStyles';
import { Organization, CreditTransaction, Toast as ToastType, UserData, PendingEmployer } from './dashboardTypes';
import { useAuth } from '@/contexts/AuthContext';
import Toast from './Toast';
import Header from './Header';
import { formatCurrency } from './dashboardUtils';
import scrollbarStyles from './scrollbar.module.css';

const BankDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<CreditTransaction[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingOrganizations, setPendingOrganizations] = useState<PendingEmployer[]>([]);
  const [organizationEmployeeCounts, setOrganizationEmployeeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastType>({ visible: false, message: '', type: 'info' });
  const [isAllocating, setIsAllocating] = useState<boolean>(false);
  const [isAddingMoney, setIsAddingMoney] = useState<boolean>(false); 
  const [selectedOrgForFunding, setSelectedOrgForFunding] = useState<string>('');
  const [fundingAmount, setFundingAmount] = useState<string>('');
  const [showFundingModal, setShowFundingModal] = useState<boolean>(false);
  
  const { userData } = useAuth();

  useEffect(() => {
    console.log('BankDashboard rendered with user role:', userData?.role);
    if (userData?.role === 'bank') {
      fetchTransactions();
      fetchOrganizations();
      fetchPendingOrganizations();
    } else {
      console.log('User is not a bank admin. Transactions will not be fetched.');
    }
  }, [userData]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      console.log('Fetching credit transactions...');
      
      // First, try a simple query without filters to check if the collection exists and has documents
      const basicQuery = query(collection(db, 'credit_transactions'));
      const basicSnapshot = await getDocs(basicQuery);
      
      console.log(`Found ${basicSnapshot.size} total transactions in credit_transactions collection`);
      
      if (basicSnapshot.size === 0) {
        // No transactions at all - maybe the collection doesn't exist yet
        console.log('No transactions found in the database. The collection might be empty.');
        setPendingTransactions([]);
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      // If we have documents, proceed with our original query
      // But let's remove the orderBy to rule out issues with indexes
      const transactionsQuery = query(collection(db, 'credit_transactions'));
      
      const transactionsSnapshot = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log(`Transaction ${doc.id} status:`, data.status);
        
        // Ensure all transaction properties have default values
        return {
          id: doc.id,
          ...data,
          creditAmount: data.creditAmount || 0,
          price: data.price || 0,
          sellerOrgId: data.sellerOrgId || '',
          sellerOrgName: data.sellerOrgName || 'Unknown Seller',
          buyerOrgId: data.buyerOrgId || '',
          buyerOrgName: data.buyerOrgName || 'Unknown Buyer',
          status: data.status || 'pending',
          createdAt: data.createdAt || new Date().toISOString()
        };
      }) as CreditTransaction[];
      
      // Store all transactions
      setTransactions(transactionsData);
      
      // Filter pending transactions locally
      const pending = transactionsData.filter(tx => {
        // Check if the status is exactly 'pending' - case sensitive!
        return tx.status === 'pending';
      });
      
      console.log(`Found ${pending.length} pending transactions:`, pending);
      
      // If no pending transactions were found but we have transactions
      if (pending.length === 0 && transactionsData.length > 0) {
        console.log('No pending transactions found. Checking the status values in the data:');
        // Log the status values we have to check for typos or capitalization issues
        const statuses = new Set(transactionsData.map(tx => tx.status));
        console.log('Unique status values:', Array.from(statuses));
      }
      
      setPendingTransactions(pending);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast('Failed to load transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      // Fetch all organizations
      const orgsQuery = query(
        collection(db, 'organizations'),
        orderBy('name', 'asc')
      );
      
      const orgsSnapshot = await getDocs(orgsQuery);
      const orgsData = orgsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure totalCredits is initialized
          totalCredits: data.totalCredits || 0,
          carbonCredits: data.carbonCredits || 0
        };
      }) as Organization[];
      
      setOrganizations(orgsData);
      
      // Fetch employee counts for each organization
      const employeeCounts: Record<string, number> = {};
      
      for (const org of orgsData) {
        const count = await fetchEmployeeCountForOrganization(org.domain);
        employeeCounts[org.id] = count;
      }
      
      setOrganizationEmployeeCounts(employeeCounts);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      showToast('Failed to load organizations', 'error');
    }
  };

  const fetchEmployeeCountForOrganization = async (domain: string): Promise<number> => {
    try {
      const employeesQuery = query(
        collection(db, 'users'),
        where('domain', '==', domain),
        where('role', '==', 'employee'),
        where('approved', '==', true)
      );
      
      const employeesSnapshot = await getDocs(employeesQuery);
      return employeesSnapshot.size;
    } catch (error) {
      console.error('Error fetching employee count:', error);
      return 0;
    }
  };

  const fetchPendingOrganizations = async () => {
    try {
      const pendingQuery = query(
        collection(db, 'pending_employers'),
        where('approved', '==', false)
      );
      
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingOrgs: PendingEmployer[] = [];
      
      pendingSnapshot.forEach(doc => {
        const data = doc.data();
        pendingOrgs.push({
          id: doc.id,
          fullName: data.fullName || 'Unknown',
          email: data.email || '',
          organizationName: data.organizationName || '',
          organizationDomain: data.organizationDomain || '',
          createdAt: data.createdAt || ''
        });
      });
      
      setPendingOrganizations(pendingOrgs);
    } catch (error) {
      console.error('Error fetching pending organizations:', error);
      showToast('Failed to load pending organizations', 'error');
    }
  };

  const handleTransactionApproval = async (transactionId: string, approved: boolean) => {
    try {
      const transactionRef = doc(db, 'credit_transactions', transactionId);
      const transaction = pendingTransactions.find(t => t.id === transactionId);
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      console.log('Processing transaction:', transaction);
      
      if (approved) {
        // Update the transaction status
        await updateDoc(transactionRef, {
          status: 'approved'
        });
        
        // When approving a credit sale, we don't transfer credits immediately
        // Credits will be transferred when someone purchases them
        if (transaction.buyerOrgId && transaction.buyerOrgId.trim() !== '') {
          // This is a direct transfer between organizations
          
          // Check if both seller and buyer organization references are valid
          if (!transaction.sellerOrgId || transaction.sellerOrgId.trim() === '') {
            console.error('Invalid seller org ID:', transaction.sellerOrgId);
            showToast('Invalid seller organization reference', 'error');
            return;
          }
          
          console.log('Transfer between orgs:', {
            seller: transaction.sellerOrgId,
            buyer: transaction.buyerOrgId,
            amount: transaction.creditAmount
          });
          
          // Transfer credits between organizations
          const sellerOrgRef = doc(db, 'organizations', transaction.sellerOrgId);
          const buyerOrgRef = doc(db, 'organizations', transaction.buyerOrgId);
          
          await updateDoc(sellerOrgRef, {
            totalCredits: increment(-transaction.creditAmount)
          });
          
          await updateDoc(buyerOrgRef, {
            totalCredits: increment(transaction.creditAmount)
          });
        } else {
          // This is a sale listing without a buyer yet
          // We don't need to transfer credits yet
          console.log('Approved sale listing. Credits will be transferred when purchased.');
        }
        
        showToast('Transaction approved successfully', 'success');
      } else {
        // Update the transaction status to rejected
        await updateDoc(transactionRef, {
          status: 'rejected'
        });
        
        showToast('Transaction rejected', 'info');
      }
      
      // Refresh the transactions list
      fetchTransactions();
      fetchOrganizations();
    } catch (error) {
      console.error('Error processing transaction:', error);
      showToast('Failed to process transaction', 'error');
    }
  };

  const handleCreditAllocation = async (organizationId: string) => {
    setIsAllocating(true);
    try {
      // Simplified allocation logic
      const orgRef = doc(db, 'organizations', organizationId);
      const orgDoc = await getDoc(orgRef);
      
      if (orgDoc.exists()) {
        const creditsToAdd = 100; // Arbitrary amount, could be calculated or input by user
        
        await updateDoc(orgRef, {
          totalCredits: increment(creditsToAdd)
        });
        
        showToast(`Successfully allocated ${creditsToAdd} credits`, 'success');
        fetchOrganizations();
      }
    } catch (error) {
      console.error('Error allocating credits:', error);
      showToast('Failed to allocate credits', 'error');
    } finally {
      setIsAllocating(false);
    }
  };

  const handleOrganizationApproval = async (orgId: string, approve: boolean) => {
    try {
      const org = pendingOrganizations.find(o => o.id === orgId);
      if (!org) {
        showToast('Organization not found', 'error');
        return;
      }
      
      if (approve) {
        // Update user document to approved
        await updateDoc(doc(db, 'users', orgId), {
          role: 'employer',
          approved: true,
          updatedAt: new Date().toISOString()
        });
        
        // Create organization record
        const orgRef = collection(db, 'organizations');
        const newOrgDoc = doc(orgRef);
        
        await setDoc(newOrgDoc, {
          name: org.organizationName,
          domain: org.organizationDomain,
          totalCredits: 0,
          carbonCredits: 0,
          availableMoney: 1000, // Initialize with $1000 available money
          createdAt: new Date().toISOString(),
          approved: true,
          employerId: orgId
        });
        
        showToast(`${org.organizationName} has been approved`, 'success');
      } else {
        // Delete user account if it exists
        try {
          await deleteDoc(doc(db, 'users', orgId));
        } catch (error) {
          console.error('Error deleting user:', error);
        }
        
        showToast(`${org.organizationName} has been rejected`, 'info');
      }
      
      // Remove from pending_employers collection
      await deleteDoc(doc(db, 'pending_employers', orgId));
      
      // Refresh data
      fetchPendingOrganizations();
      fetchOrganizations();
    } catch (error) {
      console.error('Error handling organization approval:', error);
      showToast('Failed to process organization approval', 'error');
    }
  };

  const handleAddMoney = async () => {
    if (!selectedOrgForFunding) {
      showToast('No organization selected', 'error');
      return;
    }
    
    const amount = parseFloat(fundingAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }
    
    setIsAddingMoney(true);
    try {
      const orgRef = doc(db, 'organizations', selectedOrgForFunding);
      const orgDoc = await getDoc(orgRef);
      
      if (orgDoc.exists()) {
        const currentMoney = orgDoc.data().availableMoney || 0;
        
        await updateDoc(orgRef, {
          availableMoney: currentMoney + amount
        });
        
        showToast(`Successfully added ${formatCurrency(amount)} to organization`, 'success');
        setShowFundingModal(false);
        setFundingAmount('');
        fetchOrganizations();
      } else {
        showToast('Organization not found', 'error');
      }
    } catch (error) {
      console.error('Error adding money:', error);
      showToast('Failed to add money', 'error');
    } finally {
      setIsAddingMoney(false);
    }
  };

  const showToast = (message: string, type: ToastType['type']) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ ...toast, visible: false });
  };

  // Additional style objects for better organization
  const cardHeaderStyle = {
    padding: '1.25rem 1.5rem', 
    borderBottom: `1px solid ${colors.gray[100]}`
  };
  
  const cardTitleStyle = { 
    fontSize: '1.25rem', 
    fontWeight: 600, 
    color: colors.gray[900], 
    marginBottom: '0.5rem' 
  };
  
  const cardSubtitleStyle = { 
    fontSize: '0.875rem', 
    color: colors.gray[600],
    margin: 0
  };

  // Define blue colors since it's not in the main colors object
  const blueColors = {
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  };

  const statCardStyle = {
    ...styles.card,
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    backgroundColor: colors.green[50],
    border: `1px solid ${colors.green[100]}`
  };

  const statNumberStyle = {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: colors.green[700],
    marginBottom: '0.5rem',
    lineHeight: 1
  };

  const statLabelStyle = {
    fontSize: '1rem',
    color: colors.gray[700],
    fontWeight: 500
  };

  // Create style objects outside JSX 
  const transactionsContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    maxHeight: '400px',
    padding: '1rem'
  };

  // Add a style object for the table container
  const tableContainerStyle = {
    maxHeight: '400px',
    borderRadius: '0.5rem',
    border: `1px solid ${colors.gray[200]}`
  };

  // Debug function to validate transaction data
  const verifyTransactionStructure = async () => {
    try {
      // Try without orderBy to see if there's any data in the collection
      const basicQuery = query(collection(db, 'credit_transactions'));
      const snapshot = await getDocs(basicQuery);
      
      console.log('Verifying transaction data structure:');
      console.log(`Total documents in credit_transactions: ${snapshot.size}`);
      
      if (snapshot.size > 0) {
        // Log some sample data
        const samples = snapshot.docs.slice(0, 3); // Look at up to 3 samples
        
        samples.forEach((doc, idx) => {
          const data = doc.data();
          console.log(`Sample transaction ${idx + 1}:`, {
            id: doc.id,
            status: data.status,
            sellerOrgId: data.sellerOrgId,
            buyerOrgId: data.buyerOrgId,
            creditAmount: data.creditAmount,
            createdAt: data.createdAt
          });
        });
        
        // Check specifically for pending transactions
        const pendingDocs = snapshot.docs.filter(doc => doc.data().status === 'pending');
        console.log(`Pending transactions: ${pendingDocs.length}`);
        
        if (pendingDocs.length === 0) {
          console.log('No pending transactions found. All transactions have other statuses.');
        }
      }
    } catch (error) {
      console.error('Error verifying transaction structure:', error);
    }
  };
  
  useEffect(() => {
    // Run the verification on component mount
    verifyTransactionStructure();
  }, []);

  const FundingModal = () => {
    const selectedOrg = organizations.find(org => org.id === selectedOrgForFunding);
    
    if (!selectedOrg) return null;
    
    return (
      <div style={styles.modal}>
        <div style={styles.modalContent}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>
              Add Funds to {selectedOrg.name}
            </h3>
          </div>
          
          <div style={styles.modalBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: colors.gray[600] }}>
                Current balance: <span style={{ fontWeight: 600, color: colors.gray[800] }}>{formatCurrency(selectedOrg.availableMoney)}</span>
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="fundingAmount" style={{ fontSize: '0.875rem', fontWeight: 500, color: colors.gray[700] }}>
                  Amount to Add
                </label>
                <input
                  id="fundingAmount"
                  type="number"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  placeholder="Enter amount"
                  style={{
                    padding: '0.625rem',
                    borderRadius: '0.375rem',
                    border: `1px solid ${colors.gray[300]}`,
                    fontSize: '0.875rem'
                  }}
                  min="1"
                  step="1"
                />
              </div>
            </div>
          </div>
          
          <div style={styles.modalFooter}>
            <button
              onClick={() => setShowFundingModal(false)}
              style={{
                ...styles.button,
                ...styles.secondaryButton,
              }}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, styles.secondaryButtonHover);
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, styles.secondaryButton);
              }}
            >
              Cancel
            </button>
            
            <button
              onClick={handleAddMoney}
              disabled={isAddingMoney}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                opacity: isAddingMoney ? 0.7 : 1
              }}
              onMouseEnter={(e) => !isAddingMoney && Object.assign(e.currentTarget.style, styles.primaryButtonHover)}
              onMouseLeave={(e) => !isAddingMoney && Object.assign(e.currentTarget.style, styles.primaryButton)}
            >
              {isAddingMoney ? 'Processing...' : 'Add Funds'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header userData={userData} />
      <main style={styles.contentArea}>
        <div style={styles.maxWidthWrapper}>
          {/* Stats overview */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '1rem' 
            }}>
              <div style={statCardStyle}>
                <div style={statNumberStyle}>{organizations.length}</div>
                <div style={statLabelStyle}>Registered Organizations</div>
              </div>
              
              <div style={statCardStyle}>
                <div style={statNumberStyle}>
                  {Object.values(organizationEmployeeCounts).reduce((sum, count) => sum + count, 0)}
                </div>
                <div style={statLabelStyle}>Total Employees</div>
              </div>
              
              <div style={statCardStyle}>
                <div style={statNumberStyle}>{pendingOrganizations.length}</div>
                <div style={statLabelStyle}>Pending Organizations</div>
              </div>
              
              <div style={statCardStyle}>
                <div style={statNumberStyle}>{pendingTransactions.length}</div>
                <div style={statLabelStyle}>Pending Transactions</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Pending Organizations */}
            {pendingOrganizations.length > 0 && (
              <div style={styles.card}>
                <div style={cardHeaderStyle}>
                  <h3 style={cardTitleStyle}>
                    Pending Organizations
                  </h3>
                  <p style={cardSubtitleStyle}>
                    Review and approve organization registrations
                  </p>
                </div>
                
                <div style={tableContainerStyle} className={scrollbarStyles.scrollable}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.tableHeader}>Organization</th>
                        <th style={styles.tableHeader}>Domain</th>
                        <th style={styles.tableHeader}>Contact</th>
                        <th style={styles.tableHeader}>Email</th>
                        <th style={styles.tableHeader}>Date</th>
                        <th style={styles.tableHeader}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrganizations.map(org => (
                        <tr 
                          key={org.id}
                          style={styles.tableRow}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                        >
                          <td style={styles.tableCell}>{org.organizationName}</td>
                          <td style={styles.tableCell}>{org.organizationDomain}</td>
                          <td style={styles.tableCell}>{org.fullName}</td>
                          <td style={styles.tableCell}>{org.email}</td>
                          <td style={styles.tableCell}>
                            {new Date(org.createdAt).toLocaleDateString()}
                          </td>
                          <td style={styles.tableCell}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleOrganizationApproval(org.id, true)}
                                style={{
                                  ...styles.button,
                                  ...styles.approveButton,
                                }}
                                onMouseEnter={(e) => {
                                  Object.assign(e.currentTarget.style, styles.approveButtonHover);
                                }}
                                onMouseLeave={(e) => {
                                  Object.assign(e.currentTarget.style, styles.approveButton);
                                }}
                              >
                                Approve
                              </button>
                              
                              <button
                                onClick={() => handleOrganizationApproval(org.id, false)}
                                style={{
                                  ...styles.button,
                                  ...styles.rejectButton,
                                }}
                                onMouseEnter={(e) => {
                                  Object.assign(e.currentTarget.style, styles.rejectButtonHover);
                                }}
                                onMouseLeave={(e) => {
                                  Object.assign(e.currentTarget.style, styles.rejectButton);
                                }}
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
            
            {/* Pending Transactions */}
            <div style={styles.card}>
              <div style={cardHeaderStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={cardTitleStyle}>
                      Pending Transactions
                    </h3>
                    <p style={cardSubtitleStyle}>
                      Review and approve carbon credit transfers
                    </p>
                  </div>
                  <button 
                    onClick={fetchTransactions}
                    disabled={loading}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: colors.green[100],
                      color: colors.green[700],
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      border: `1px solid ${colors.green[200]}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {loading ? 'Refreshing...' : 'Refresh Transactions'}
                  </button>
                </div>
              </div>
              
              {loading ? (
                <div style={styles.loader}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-spin">
                    <circle cx="12" cy="12" r="10" stroke={colors.gray[300]} strokeWidth="4" />
                    <path d="M12 2C6.47715 2 2 6.47715 2 12" stroke={colors.green[500]} strokeWidth="4" />
                  </svg>
                  <p style={styles.loaderText}>Loading transactions...</p>
                </div>
              ) : (
                <div style={transactionsContainerStyle} className={scrollbarStyles.scrollable}>
                  {pendingTransactions.length === 0 ? (
                    <div style={styles.emptyState}>
                      <p style={styles.emptyStateTitle}>No Pending Transactions</p>
                      <p style={styles.emptyStateText}>
                        There are no pending transactions to review at this time
                      </p>
                    </div>
                  ) : (
                    pendingTransactions.map(transaction => (
                      <div key={transaction.id} style={styles.transactionCard as React.CSSProperties}>
                        <div style={styles.transactionHeader}>
                          <div style={styles.transactionTitle}>
                            Credit Transfer - {(transaction.creditAmount ?? 0).toFixed(2)} Credits
                          </div>
                          <div style={styles.transactionDate}>
                            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Date not available'}
                          </div>
                        </div>
                        
                        <div style={styles.transactionDetails}>
                          <div style={styles.transactionParty}>
                            <div style={{ fontSize: '0.75rem', color: colors.gray[500], marginBottom: '0.25rem' }}>
                              Seller
                            </div>
                            <div style={{ fontWeight: 500 }}>{transaction.sellerOrgName || 'Unknown Seller'}</div>
                          </div>
                          
                          <div style={styles.transactionInfo}>
                            <div style={{ fontSize: '0.75rem', color: colors.gray[500], marginBottom: '0.25rem' }}>
                              Price per Credit
                            </div>
                            <div style={{ fontWeight: 600 }}>{formatCurrency(transaction.price ?? 0)}</div>
                          </div>
                          
                          <div style={styles.transactionParty}>
                            <div style={{ fontSize: '0.75rem', color: colors.gray[500], marginBottom: '0.25rem' }}>
                              {transaction.buyerOrgId && transaction.buyerOrgId.trim() !== '' ? 'Buyer' : 'Transaction Type'}
                            </div>
                            <div style={{ fontWeight: 500 }}>
                              {transaction.buyerOrgId && transaction.buyerOrgId.trim() !== '' 
                                ? transaction.buyerOrgName || 'Unknown Buyer'
                                : 'Credit Sale Listing'}
                            </div>
                          </div>
                          
                          <div style={styles.transactionInfo}>
                            <div style={{ fontSize: '0.75rem', color: colors.gray[500], marginBottom: '0.25rem' }}>
                              Status
                            </div>
                            <div>
                              <span style={{ 
                                padding: '0.125rem 0.5rem', 
                                backgroundColor: colors.green[50], 
                                color: colors.green[700],
                                borderRadius: '9999px', 
                                fontSize: '0.75rem', 
                                fontWeight: 500,
                                border: `1px solid ${colors.green[200]}`
                              }}>
                                {transaction.status === 'pending' ? 'Pending' : transaction.status === 'approved' ? 'Approved' : 'Rejected'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div style={styles.transactionActions}>
                          <button
                            onClick={() => handleTransactionApproval(transaction.id, true)}
                            style={{
                              ...styles.button,
                              ...styles.approveButton,
                            }}
                            onMouseEnter={(e) => {
                              Object.assign(e.currentTarget.style, styles.approveButtonHover);
                            }}
                            onMouseLeave={(e) => {
                              Object.assign(e.currentTarget.style, styles.approveButton);
                            }}
                          >
                            Approve
                          </button>
                          
                          <button
                            onClick={() => handleTransactionApproval(transaction.id, false)}
                            style={{
                              ...styles.button,
                              ...styles.rejectButton,
                            }}
                            onMouseEnter={(e) => {
                              Object.assign(e.currentTarget.style, styles.rejectButtonHover);
                            }}
                            onMouseLeave={(e) => {
                              Object.assign(e.currentTarget.style, styles.rejectButton);
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            
            {/* Organizations */}
            <div style={styles.card}>
              <div style={cardHeaderStyle}>
                <h3 style={cardTitleStyle}>
                  Registered Organizations
                </h3>
                <p style={cardSubtitleStyle}>
                  Manage organization details and carbon credits
                </p>
              </div>
              
              <div style={tableContainerStyle} className={scrollbarStyles.scrollable}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.tableHeader}>Organization</th>
                      <th style={styles.tableHeader}>Domain</th>
                      <th style={{...styles.tableHeader, textAlign: 'center' as const}}>Employees</th>
                      <th style={{...styles.tableHeader, textAlign: 'right' as const}}>Credits</th>
                      <th style={{...styles.tableHeader, textAlign: 'right' as const}}>Available Money</th>
                      <th style={{...styles.tableHeader, textAlign: 'center' as const}}>Actions</th>
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
                          <td style={{...styles.tableCell, textAlign: 'center' as const}}>
                            {organizationEmployeeCounts[org.id] || 0}
                          </td>
                          <td style={{...styles.tableCell, textAlign: 'right' as const, fontWeight: 600}}>
                            {(org.totalCredits ?? 0).toFixed(2)}
                          </td>
                          <td style={{...styles.tableCell, textAlign: 'right' as const, fontWeight: 600}}>
                            {formatCurrency(org.availableMoney ?? 0)}
                          </td>
                          <td style={{...styles.tableCell, textAlign: 'center' as const}}>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleCreditAllocation(org.id)}
                                disabled={isAllocating}
                                style={styles.allocateButton as React.CSSProperties}
                              >
                                Allocate Credits
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedOrgForFunding(org.id);
                                  setFundingAmount('');
                                  setShowFundingModal(true);
                                }}
                                style={{
                                  ...styles.button,
                                  backgroundColor: blueColors[500],
                                  color: colors.white,
                                  padding: '0.5rem 1rem',
                                  borderRadius: '0.375rem',
                                  fontSize: '0.875rem',
                                  fontWeight: 500,
                                  border: 'none',
                                  cursor: 'pointer',
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = blueColors[600]; // darker blue
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = blueColors[500]; // default blue
                                }}
                              >
                                Add Money
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {showFundingModal && <FundingModal />}
      <Toast toast={toast} onClose={hideToast} />
    </>
  );
};

export default BankDashboard; 