const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authmiddleware');
const taskController = require('../controllers/taskcontroller');

// All task routes protected
router.use(authMiddleware);

// GET /api/tasks
router.get('/', taskController.getTasks);

// POST /api/tasks
router.post('/', taskController.createTask);

// GET /api/tasks/:id
router.get('/:id', taskController.getTaskById);

// PUT /api/tasks/:id
router.put('/:id', taskController.updateTask);

// DELETE /api/tasks/:id
router.delete('/:id', taskController.deleteTask);

module.exports = router;
