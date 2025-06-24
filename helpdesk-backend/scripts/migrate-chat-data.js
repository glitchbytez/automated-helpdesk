import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to both databases
const helpDeskDB = mongoose.createConnection(process.env.MONGODB_URI || 'mongodb://localhost:27017/helpdesk');
const chatbotDB = mongoose.createConnection('mongodb://localhost:27017/chatapp');

// Define the schemas for both databases
// Original chatbot schemas
const OldSessionSchema = new mongoose.Schema({
  sessionId: String,
  userName: String,
  userEmail: String,
  ticketId: String,
  requestLiveChat: Boolean,
  agentId: String,
  agentName: String,
  conversationEnded: Boolean,
  conversationEndedBy: String,
  conversationEndedAt: Date
});

const OldMessageSchema = new mongoose.Schema({
  sessionId: String,
  from: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

// New helpdesk schemas
const NewSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  userName: String,
  userEmail: String,
  ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  requestLiveChat: { type: Boolean, default: false },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  agentName: String,
  conversationEnded: { type: Boolean, default: false },
  conversationEndedBy: String,
  conversationEndedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const NewMessageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  from: { type: String, required: true, enum: ['user', 'agent', 'system'] },
  text: { type: String, required: true },
  agentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  agentName: String,
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
}, { timestamps: true });

// Create models
const OldSession = chatbotDB.model('Session', OldSessionSchema);
const OldMessage = chatbotDB.model('Message', OldMessageSchema);
const NewSession = helpDeskDB.model('ChatSession', NewSessionSchema);
const NewMessage = helpDeskDB.model('ChatMessage', NewMessageSchema);

// Migration function
async function migrateData() {
  try {
    console.log('Starting migration...');
    
    // Migrate sessions
    console.log('Migrating sessions...');
    const sessions = await OldSession.find({});
    console.log(`Found ${sessions.length} sessions to migrate`);
    
    for (const oldSession of sessions) {
      // Check if session already exists in new database
      const existingSession = await NewSession.findOne({ sessionId: oldSession.sessionId });
      
      if (!existingSession) {
        // Convert ticketId to ObjectId if it exists and is valid
        let ticketId = null;
        if (oldSession.ticketId && mongoose.Types.ObjectId.isValid(oldSession.ticketId)) {
          ticketId = new mongoose.Types.ObjectId(oldSession.ticketId);
        }
        
        // Convert agentId to ObjectId if it exists and is valid
        let agentId = null;
        if (oldSession.agentId && mongoose.Types.ObjectId.isValid(oldSession.agentId)) {
          agentId = new mongoose.Types.ObjectId(oldSession.agentId);
        }
        
        // Create new session
        const newSession = new NewSession({
          sessionId: oldSession.sessionId,
          userName: oldSession.userName,
          userEmail: oldSession.userEmail,
          ticketId: ticketId,
          requestLiveChat: oldSession.requestLiveChat || false,
          agentId: agentId,
          agentName: oldSession.agentName,
          conversationEnded: oldSession.conversationEnded || false,
          conversationEndedBy: oldSession.conversationEndedBy,
          conversationEndedAt: oldSession.conversationEndedAt,
          createdAt: oldSession._id.getTimestamp(),
          updatedAt: new Date()
        });
        
        await newSession.save();
        console.log(`Migrated session: ${oldSession.sessionId}`);
      } else {
        console.log(`Session already exists: ${oldSession.sessionId}`);
      }
    }
    
    // Migrate messages
    console.log('Migrating messages...');
    const messages = await OldMessage.find({});
    console.log(`Found ${messages.length} messages to migrate`);
    
    for (const oldMessage of messages) {
      // Check if message already exists (based on sessionId, from, text, and timestamp)
      const existingMessage = await NewMessage.findOne({
        sessionId: oldMessage.sessionId,
        from: oldMessage.from,
        text: oldMessage.text,
        timestamp: oldMessage.timestamp
      });
      
      if (!existingMessage) {
        // Create new message
        const newMessage = new NewMessage({
          sessionId: oldMessage.sessionId,
          from: oldMessage.from,
          text: oldMessage.text,
          timestamp: oldMessage.timestamp,
          read: true,
          createdAt: oldMessage._id.getTimestamp(),
          updatedAt: new Date()
        });
        
        await newMessage.save();
        console.log(`Migrated message for session: ${oldMessage.sessionId}`);
      } else {
        console.log(`Message already exists for session: ${oldMessage.sessionId}`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close database connections
    await helpDeskDB.close();
    await chatbotDB.close();
    console.log('Database connections closed');
  }
}

// Run the migration
migrateData()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration script failed:', err);
    process.exit(1);
  });
