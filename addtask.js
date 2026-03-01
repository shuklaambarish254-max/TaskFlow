// addtask.js - handle standalone add task form
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('taskflow_token');
  const user = JSON.parse(localStorage.getItem('taskflow_user') || 'null');
  if (!token || !user) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('userName').textContent = user.name;
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    window.location.href = 'index.html';
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.location.href = 'dashboard.html';
  });

  document.getElementById('addTaskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const dueDateVal = document.getElementById('taskDueDate').value || null;
    const dueTimeVal = document.getElementById('taskDueTime') ? document.getElementById('taskDueTime').value : null;
    let dueDate = null;
    if (dueDateVal) {
      // combine date and time if provided, default to start of day
      const iso = dueTimeVal ? `${dueDateVal}T${dueTimeVal}` : `${dueDateVal}T00:00:00`;
      dueDate = new Date(iso).toISOString();
    }
    const err = document.getElementById('formError');
    err.textContent = '';

    if (!title) { err.textContent = 'Title required'; return; }

    try {
      await apiCreateTask({ title, description, priority, dueDate });
      // after saving, redirect to dashboard (task list)
      window.location.href = 'dashboard.html';
    } catch (e) {
      err.textContent = 'Network error';
    }
  });
});
