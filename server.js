const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ========== DATABASE CONNECTION ==========
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/railway_db';

console.log('🔌 Connecting to MongoDB...');

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds
}).then(() => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📁 Database: ${mongoose.connection.name}`);
}).catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.log('⚠️ Server will run with limited functionality');
});

// Connection events
mongoose.connection.on('error', err => {
    console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose disconnected from MongoDB');
});

// ========== SCHEMAS WITH VALIDATION ==========
const eventSchema = new mongoose.Schema({
    dateKey: { 
        type: String, 
        required: [true, 'Date key is required'],
        match: [/^\d{4}-\d{2}-\d{2}$/, 'Date key must be YYYY-MM-DD']
    }, 
    type: { 
        type: String, 
        required: [true, 'Event type is required'],
        enum: ['Festival', 'Sport', 'Political', 'Religious', 'Other']
    }, 
    station: { 
        type: String, 
        required: [true, 'Station name is required'] 
    }, 
    zone: String, 
    division: String,
    crowd: { 
        type: Number, 
        required: [true, 'Crowd estimate is required'],
        min: [0, 'Crowd cannot be negative']
    }, 
    level: { 
        type: String, 
        required: [true, 'Crowd level is required'],
        enum: ['L-1', 'L-2', 'L-3'] 
    }, 
    createdAt: { type: Date, default: Date.now }
});

const planningSchema = new mongoose.Schema({
    dateKey: { 
        type: String, 
        required: [true, 'Date key is required'] 
    }, 
    stationName: { 
        type: String, 
        required: [true, 'Station name is required'] 
    }, 
    expectedCrowd: { 
        type: Number, 
        required: [true, 'Expected crowd is required'],
        min: [0, 'Expected crowd cannot be negative']
    }, 
    grpStaff: { 
        type: Number, 
        default: 0,
        min: [0, 'Staff count cannot be negative']
    },
    rpfStaff: { 
        type: Number, 
        default: 0,
        min: [0, 'Staff count cannot be negative']
    }, 
    commercialStaff: { 
        type: Number, 
        default: 0,
        min: [0, 'Staff count cannot be negative']
    }, 
    trainNumber: String, 
    trainType: String,
    trainRoute: String, 
    createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);
const Planning = mongoose.model('Planning', planningSchema);

// ========== HEALTH CHECK ==========
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
    };
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: statusMap[dbStatus] || 'unknown',
        mongodb_connected: dbStatus === 1
    });
});

// ========== EVENT ROUTES WITH ERROR HANDLING ==========
app.get('/api/events', async (req, res) => {
    try {
        const events = await Event.find().sort({createdAt: -1});
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            error: 'Failed to fetch events',
            message: error.message 
        });
    }
});

app.post('/api/events', async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json(event);
    } catch (error) {
        console.error('Error creating event:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to create event',
            message: error.message 
        });
    }
});

app.delete('/api/events/:id', async (req, res) => {
    try {
        const result = await Event.findByIdAndDelete(req.params.id);
        
        if (!result) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({ 
            message: 'Event deleted successfully',
            id: req.params.id 
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ 
            error: 'Failed to delete event',
            message: error.message 
        });
    }
});

// ========== PLANNING ROUTES WITH ERROR HANDLING ==========
app.get('/api/planning', async (req, res) => {
    try {
        const planning = await Planning.find().sort({createdAt: -1});
        res.json(planning);
    } catch (error) {
        console.error('Error fetching planning:', error);
        res.status(500).json({ 
            error: 'Failed to fetch planning',
            message: error.message 
        });
    }
});

app.post('/api/planning', async (req, res) => {
    try {
        const plan = new Planning(req.body);
        await plan.save();
        res.status(201).json(plan);
    } catch (error) {
        console.error('Error creating plan:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to create plan',
            message: error.message 
        });
    }
});

app.delete('/api/planning/:id', async (req, res) => {
    try {
        const result = await Planning.findByIdAndDelete(req.params.id);
        
        if (!result) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        
        res.json({ 
            message: 'Plan deleted successfully',
            id: req.params.id 
        });
    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ 
            error: 'Failed to delete plan',
            message: error.message 
        });
    }
});

// ========== ROOT ROUTE ==========
app.get('/', (req, res) => {
    res.json({
        message: 'Railway Management API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            events: {
                GET: '/api/events',
                POST: '/api/events',
                DELETE: '/api/events/:id'
            },
            planning: {
                GET: '/api/planning',
                POST: '/api/planning',
                DELETE: '/api/planning/:id'
            }
        }
    });
});

// ========== 404 HANDLER ==========
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 API Documentation: http://localhost:${PORT}/`);
});