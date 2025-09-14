// Utility to clear all local storage and cache

export const clearAllLocalData = () => {
  try {
    console.log('🧹 Clearing all local data...');
    
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage);
    console.log('📦 LocalStorage keys found:', localStorageKeys);
    localStorage.clear();
    
    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    console.log('📦 SessionStorage keys found:', sessionStorageKeys);
    sessionStorage.clear();
    
    // Clear IndexedDB (used by Firebase)
    if ('indexedDB' in window) {
      // Get all databases
      if (indexedDB.databases) {
        indexedDB.databases().then(databases => {
          databases.forEach(db => {
            console.log('🗄️ Clearing IndexedDB:', db.name);
            indexedDB.deleteDatabase(db.name);
          });
        });
      }
    }
    
    console.log('✅ All local data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing local data:', error);
    return false;
  }
};

export const clearAuthData = () => {
  try {
    console.log('🔐 Clearing authentication data...');
    
    // Clear Firebase Auth related items
    const authKeys = Object.keys(localStorage).filter(key => 
      key.includes('firebase') || 
      key.includes('auth') || 
      key.includes('user') ||
      key.includes('token')
    );
    
    console.log('🔐 Auth keys found:', authKeys);
    authKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`   Removed: ${key}`);
    });
    
    // Also check sessionStorage
    const sessionAuthKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('firebase') || 
      key.includes('auth') || 
      key.includes('user') ||
      key.includes('token')
    );
    
    console.log('🔐 Session auth keys found:', sessionAuthKeys);
    sessionAuthKeys.forEach(key => {
      sessionStorage.removeItem(key);
      console.log(`   Removed: ${key}`);
    });
    
    console.log('✅ Authentication data cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
    return false;
  }
};

export const logAllStoredData = () => {
  console.log('📊 === LOCAL STORAGE AUDIT ===');
  
  // Log localStorage
  console.log('📦 localStorage:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`   ${key}:`, value);
  }
  
  // Log sessionStorage
  console.log('📦 sessionStorage:');
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    const value = sessionStorage.getItem(key);
    console.log(`   ${key}:`, value);
  }
  
  // Log cookies
  console.log('🍪 cookies:');
  console.log('   ', document.cookie);
  
  console.log('📊 === END AUDIT ===');
};