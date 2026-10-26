const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas using the URI from your .env file
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Define Mongoose Schema and Model for Feedback
const feedbackSchema = new mongoose.Schema({
  courseName: { type: String, required: true },
  courseDuration: { type: String, required: true },
  feedbackComments: { type: String, required: true },
  feedbackRating: { type: Number, required: true }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

// 1. Get All Feedback
app.get('/api/feedbacks', async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Add Feedback
app.post('/api/feedbacks', async (req, res) => {
  try {
    const newItem = new Feedback(req.body);
    const savedItem = await newItem.save();
    res.json(savedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Delete Feedback
app.delete('/api/feedbacks/:id', async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update Feedback
app.put('/api/feedbacks/:id', async (req, res) => {
  try {
    const updatedItem = await Feedback.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} connected to MongoDB Atlas`));