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
    this.cleanupExpiredEvents();
    
    // Then run periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredPolls();
      this.cleanupExpiredEvents();
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
   * Clean up expired events from Firestore
   */
  async cleanupExpiredEvents() {
    try {
      // Initialize database connection
      const db = this.initializeDb();
      
      const now = new Date();
      let deletedCount = 0;
      let totalChecked = 0;

      // Query all events
      const eventsRef = db.collection('events');
      const snapshot = await eventsRef.get();
      
      totalChecked = snapshot.size;

      if (snapshot.empty) {
        console.log('🧹 No events found to check');
        return { deletedCount: 0, totalChecked: 0 };
      }

      // Batch delete for efficiency
      const batch = db.batch();
      const eventsToDelete = [];

      snapshot.forEach(doc => {
        const eventData = doc.data();
        let shouldDelete = false;
        let expirationInfo = '';

        // Check if event has expired based on end time or start date
        if (eventData.date) {
          let eventDate = new Date(eventData.date);
          
          if (eventData.endTime) {
            // If end time is provided, combine date and end time
            const [hours, minutes] = eventData.endTime.split(':');
            eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            // Event expires when end time passes
            if (eventDate < now) {
              shouldDelete = true;
              expirationInfo = `ended at ${eventDate.toISOString()}`;
            }
          } else {
            // If no end time, event expires at end of the start date (23:59:59)
            eventDate.setHours(23, 59, 59, 999);
            
            if (eventDate < now) {
              shouldDelete = true;
              expirationInfo = `start date completed: ${eventDate.toDateString()}`;
            }
          }

          if (shouldDelete) {
            console.log(`🗑️ Marking expired event for deletion: "${eventData.title}" (${expirationInfo})`);
            batch.delete(doc.ref);
            eventsToDelete.push({
              id: doc.id,
              title: eventData.title,
              date: eventData.date,
              endTime: eventData.endTime,
              expirationInfo
            });
            deletedCount++;
          }
        }
      });

      // Execute batch delete if there are events to delete
      if (deletedCount > 0) {
        // First, delete the events themselves
        await batch.commit();
        
        // Now clean up related data for each deleted event
        for (const event of eventsToDelete) {
          await this.cleanupEventRelatedData(event.id);
        }
        
        // Log details of deleted events
        eventsToDelete.forEach(event => {
          console.log(`   - "${event.title}" (ID: ${event.id}) - ${event.expirationInfo}`);
        });
        
        console.log(`🧹 Deleted ${deletedCount} expired events out of ${totalChecked} total events`);
      } else {
        console.log('✅ No expired events found to delete');
      }

      return { deletedCount, totalChecked };

    } catch (error) {
      console.error('❌ Error during events cleanup:', error);
      throw error;
    }
  }

  /**
   * Clean up related data for a deleted event (likes, comments, reports)
   * @param {string} eventId - The ID of the deleted event
   */
  async cleanupEventRelatedData(eventId) {
    try {
      const db = this.initializeDb();
      let likesDeleted = 0;
      let commentsDeleted = 0;
      let reportsDeleted = 0;

      // Delete likes for this event
      const likesSnapshot = await db.collection('like_event')
        .where('eventId', '==', eventId)
        .get();
      
      if (!likesSnapshot.empty) {
        const likesBatch = db.batch();
        likesSnapshot.forEach(doc => {
          likesBatch.delete(doc.ref);
          likesDeleted++;
        });
        await likesBatch.commit();
      }

      // Delete comments for this event
      const commentsSnapshot = await db.collection('comment_event')
        .where('eventId', '==', eventId)
        .get();
      
      if (!commentsSnapshot.empty) {
        const commentsBatch = db.batch();
        commentsSnapshot.forEach(doc => {
          commentsBatch.delete(doc.ref);
          commentsDeleted++;
        });
        await commentsBatch.commit();
      }

      // Delete reports for this event
      const reportsSnapshot = await db.collection('event_reports')
        .where('eventId', '==', eventId)
        .get();
      
      if (!reportsSnapshot.empty) {
        const reportsBatch = db.batch();
        reportsSnapshot.forEach(doc => {
          reportsBatch.delete(doc.ref);
          reportsDeleted++;
        });
        await reportsBatch.commit();
      }

      if (likesDeleted > 0 || commentsDeleted > 0 || reportsDeleted > 0) {
        console.log(`     ↳ Cleaned up related data: ${likesDeleted} likes, ${commentsDeleted} comments, ${reportsDeleted} reports`);
      }

    } catch (error) {
      console.error(`❌ Error cleaning up related data for event ${eventId}:`, error);
      // Don't throw error - we don't want to stop the cleanup process
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
    const pollsResult = await this.cleanupExpiredPolls();
    const eventsResult = await this.cleanupExpiredEvents();
    
    return {
      polls: pollsResult,
      events: eventsResult,
      total: {
        deletedCount: pollsResult.deletedCount + eventsResult.deletedCount,
        totalChecked: pollsResult.totalChecked + eventsResult.totalChecked
      }
    };
  }
}

// Create singleton instance
const cleanupService = new CleanupService();

module.exports = {
  CleanupService,
  cleanupService
};
