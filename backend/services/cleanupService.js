const { getFirestore } = require('../config/firebase');

class CleanupService {
  constructor() {
    this.db = null; // Will be initialized when needed
    this.cleanupInterval = null;
    this.isRunning = false;
  }

  /**
   * Initialize the Firestore connection (lazy loading)
   */
  initializeDb() {
    if (!this.db) {
      this.db = getFirestore();
    }
    return this.db;
  }

  /**
   * Start the cleanup service with periodic execution
   * @param {number} intervalMinutes - How often to run cleanup (in minutes)
   */
  start(intervalMinutes = 60) { // Default: run every hour
    if (this.isRunning) {
      console.log('🧹 Cleanup service is already running');
      return;
    }

    
    // Run immediately on start
    this.cleanupExpiredPolls();
    
    // Then run periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredPolls();
    }, intervalMinutes * 60 * 1000);
    
    this.isRunning = true;
  }

  /**
   * Stop the cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.isRunning = false;
  }

  /**
   * Clean up expired polls from Firestore
   */
  async cleanupExpiredPolls() {
    try {
      
      // Initialize database connection
      const db = this.initializeDb();
      
      const now = new Date();
      let deletedCount = 0;
      let totalChecked = 0;

      // Query all polls (we need to check expiration date)
      const pollsRef = db.collection('polls');
      const snapshot = await pollsRef.get();
      
      totalChecked = snapshot.size;

      if (snapshot.empty) {
        console.log('🧹 No polls found to check');
        return { deletedCount: 0, totalChecked: 0 };
      }

      // Batch delete for efficiency
      const batch = db.batch();
      const pollsToDelete = [];

      snapshot.forEach(doc => {
        const pollData = doc.data();
        
        // Check if poll has expired
        if (pollData.expiresAt) {
          let expirationDate;
          
          // Handle different date formats
          if (pollData.expiresAt.toDate && typeof pollData.expiresAt.toDate === 'function') {
            // Firestore timestamp
            expirationDate = pollData.expiresAt.toDate();
          } else if (pollData.expiresAt instanceof Date) {
            expirationDate = pollData.expiresAt;
          } else {
            // String or number
            expirationDate = new Date(pollData.expiresAt);
          }

          // If the poll has expired, mark it for deletion
          if (expirationDate && expirationDate < now) {
            console.log(`🗑️ Marking expired poll for deletion: ${pollData.question} (expired: ${expirationDate.toISOString()})`);
            batch.delete(doc.ref);
            pollsToDelete.push({
              id: doc.id,
              question: pollData.question,
              expiredAt: expirationDate
            });
            deletedCount++;
          }
        }
      });

      // Execute batch delete if there are polls to delete
      if (deletedCount > 0) {
        await batch.commit();
        
        // Log details of deleted polls
        pollsToDelete.forEach(poll => {
          console.log(`   - "${poll.question}" (ID: ${poll.id})`);
        });
      } else {
        console.log('✅ No expired polls found to delete');
      }

      return { deletedCount, totalChecked };

    } catch (error) {
      console.error('❌ Error during polls cleanup:', error);
      throw error;
    }
  }

  /**
   * Get cleanup service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.cleanupInterval !== null
    };
  }

  /**
   * Run a one-time cleanup (useful for manual triggers)
   */
  async runOnce() {
    console.log('🧹 Running one-time cleanup...');
    return await this.cleanupExpiredPolls();
  }
}

// Create singleton instance
const cleanupService = new CleanupService();

module.exports = {
  CleanupService,
  cleanupService
};
