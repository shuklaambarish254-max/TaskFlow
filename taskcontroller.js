// models folder is the parent of controllers, so require models directly from '../task'
const Task = require('../task');
const mongoose = require('mongoose');

// Create
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const t = await Task.create({
      title,
      description: description || '',
      priority: priority || 'low',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      userId: req.user.id
    });

    res.status(201).json(t);
  } catch (err) {
    next(err);
  }
};

// Read (list for user with optional filters)
exports.getTasks = async (req, res, next) => {
  try {
    const { priority, completed, upcoming } = req.query;
    const filter = { userId: req.user.id };

    if (priority) filter.priority = priority;
    if (typeof completed !== 'undefined') {
      filter.completed = completed === 'true' || completed === '1';
    }
    if (upcoming === 'true') {
      const now = new Date();
      filter.dueDate = { $gte: now };
    }

    const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: -1 }).exec();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
};

// Read single
exports.getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const task = await Task.findOne({ _id: id, userId: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// Update
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
};

// Delete
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const task = await Task.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
