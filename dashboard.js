// dashboard.js - handles UI and task CRUD on dashboard page
let editingTaskId = null;

document.addEventListener('DOMContentLoaded', () => {
  // protect page
  const token = localStorage.getItem('taskflow_token');
  const user = JSON.parse(localStorage.getItem('taskflow_user') || 'null');
  if (!token || !user) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('userName').textContent = user.name;
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // Filters
  document.getElementById('applyFilters').addEventListener('click', loadTasks);
  // Open add task page (separate flow)
  document.getElementById('openAddTask').addEventListener('click', () => { window.location.href = 'addtask.html'; });

  // Modal actions (only attach if modal exists)
  const cancelTaskBtn = document.getElementById('cancelTask');
  if (cancelTaskBtn) cancelTaskBtn.addEventListener('click', closeTaskModal);
  const taskFormEl = document.getElementById('taskForm');
  if (taskFormEl) taskFormEl.addEventListener('submit', onTaskFormSubmit);

  // initial load
  loadTasks();
  // start clock and periodic refresh for missed notifications
  startClock();
  // refresh tasks every minute to update notifications and progress
  setInterval(loadTasks, 60 * 1000);
});

function startClock() {
  const el = document.getElementById('digitalClock');
  if (!el) return;
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString();
  }
  tick();
  setInterval(tick, 1000);
}

function renderMissedNotifications(allTasks) {
  const el = document.getElementById('missedNotifications');
  if (!el) return;
  const now = new Date();
  const missed = allTasks.filter(t => {
    if (t.completed) return false;
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return (now - due) > (30 * 60 * 1000); // more than 30 minutes past due
  });

  if (!missed.length) {
    el.textContent = 'No missed tasks';
    return;
  }

  el.innerHTML = '';
  missed.forEach(t => {
    const row = document.createElement('div');
    const due = new Date(t.dueDate);
    row.textContent = `Missed: ${t.title} (due ${due.toLocaleString()})`;
    el.appendChild(row);
  });
}

// render today's tasks (compact view)
function renderTodayTasks(allTasks) {
  const el = document.getElementById('todayList');
  const today = new Date(); today.setHours(0,0,0,0);
  const todayEnd = new Date(today); todayEnd.setHours(23,59,59,999);

  const dueToday = allTasks.filter(t => t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) <= todayEnd);

  el.innerHTML = '';
  dueToday.forEach(t => {
    const item = document.createElement('div');
    item.className = 'task today-task';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!t.completed;
    cb.addEventListener('change', async () => {
      await apiUpdateTask(t._id, { completed: cb.checked });
      loadTasks();
    });

    const lbl = document.createElement('label');
    lbl.style.marginLeft = '8px';
    const due = new Date(t.dueDate);
    lbl.textContent = t.title + (t.priority ? ` (${t.priority})` : '') + ` — ${due.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;

    item.appendChild(cb);
    item.appendChild(lbl);
    el.appendChild(item);
  });

  // summary: how many remaining
  const remaining = dueToday.filter(t => !t.completed).length;
  const summaryEl = document.getElementById('todaySummary');
  if (summaryEl) summaryEl.textContent = `${remaining} remaining task${remaining === 1 ? '' : 's'} today`;
}

async function logout() {
  localStorage.removeItem('taskflow_token');
  localStorage.removeItem('taskflow_user');
  window.location.href = 'index.html';
}

function getFilterParams() {
  const priority = document.getElementById('filterPriority').value;
  const completed = document.getElementById('filterCompleted').value;
  const upcoming = document.getElementById('filterUpcoming').checked;
  const params = {};
  if (priority) params.priority = priority;
  if (completed) params.completed = completed;
  if (upcoming) params.upcoming = 'true';
  return params;
}

async function loadTasks() {
  const list = document.getElementById('taskList');
  list.innerHTML = 'Loading...';
  try {
    const params = getFilterParams();
    const tasks = await apiGetTasks(params);
    if (!Array.isArray(tasks)) {
      list.innerHTML = `<div class="error">${tasks.error || 'Failed to fetch tasks'}</div>`;
      return;
    }
    renderTasks(tasks);
    renderTodayTasks(tasks);
    computeDailyProgress(tasks);
    computeWeeklySummary(tasks);
  } catch (err) {
    list.innerHTML = `<div class="error">Network error</div>`;
  }
}

function renderTasks(tasks) {
  const list = document.getElementById('taskList');
  if (!tasks.length) { list.innerHTML = '<div class="muted">No tasks found</div>'; return; }

  list.innerHTML = '';
  tasks.forEach(t => {
    const item = document.createElement('div');
    item.className = 'task';

    const left = document.createElement('div');
    left.className = 'left';
    const title = document.createElement('h4');
    title.textContent = t.title + (t.completed ? ' ✓' : '');
    left.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const due = t.dueDate ? `Due: ${new Date(t.dueDate).toLocaleDateString()}` : 'No due date';
    meta.innerHTML = `<span class="muted">${due}</span><span class="badge ${t.priority}">${t.priority}</span>`;
    left.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'actions';

    // checkbox for completion
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = !!t.completed;
    checkbox.title = 'Mark task complete';
    checkbox.addEventListener('change', async () => {
      await apiUpdateTask(t._id, { completed: checkbox.checked });
      loadTasks();
    });

    const del = document.createElement('button');
    del.className = 'btn small ghost';
    del.textContent = 'Delete';
    del.addEventListener('click', async () => {
      if (!confirm('Delete this task?')) return;
      await apiDeleteTask(t._id);
      loadTasks();
    });

    actions.appendChild(checkbox);
    actions.appendChild(del);

    item.appendChild(left);
    item.appendChild(actions);
    list.appendChild(item);
  });
}

function openTaskModal(task = null) {
  editingTaskId = task ? task._id : null;
  document.getElementById('modalTitle').textContent = task ? 'Edit Task' : 'Add Task';
  document.getElementById('taskTitle').value = task ? task.title : '';
  document.getElementById('taskDescription').value = task ? task.description : '';
  document.getElementById('taskPriority').value = task ? task.priority : 'medium';
  document.getElementById('taskDueDate').value = task && task.dueDate ? new Date(task.dueDate).toISOString().slice(0,10) : '';
  document.getElementById('taskFormError').textContent = '';
  document.getElementById('taskModal').classList.remove('hidden');
}

function closeTaskModal() {
  editingTaskId = null;
  document.getElementById('taskModal').classList.add('hidden');
}

async function onTaskFormSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('taskTitle').value.trim();
  const description = document.getElementById('taskDescription').value.trim();
  const priority = document.getElementById('taskPriority').value;
  const dueDate = document.getElementById('taskDueDate').value || null;
  const err = document.getElementById('taskFormError');
  err.textContent = '';

  if (!title) { err.textContent = 'Title required'; return; }

  try {
    if (editingTaskId) {
      await apiUpdateTask(editingTaskId, { title, description, priority, dueDate });
    } else {
      await apiCreateTask({ title, description, priority, dueDate });
    }
    closeTaskModal();
    loadTasks();
  } catch (e) {
    err.textContent = 'Network error';
  }
}

// Daily completion = completed tasks with dueDate equal to today / tasks due today (or consider all tasks that are due today)
function computeDailyProgress(allTasks) {
  // If tasks not passed, fetch them
  if (!allTasks) return;

  const today = new Date(); today.setHours(0,0,0,0);
  const todayEnd = new Date(today); todayEnd.setHours(23,59,59,999);

  const dueToday = allTasks.filter(t => t.dueDate && new Date(t.dueDate) >= today && new Date(t.dueDate) <= todayEnd);
  const doneToday = dueToday.filter(t => t.completed);

  let pct = 0;
  if (dueToday.length) pct = Math.round((doneToday.length / dueToday.length) * 100);

  document.getElementById('dailyProgress').style.width = pct + '%';
  document.getElementById('dailyPct').textContent = pct + '%';
}

// Weekly summary - show counts and simple percent
function computeWeeklySummary(allTasks) {
  // If tasks not passed, fetch them
  if (!allTasks) {
    apiGetTasks().then(tasks => computeWeeklySummary(tasks)).catch(()=>{});
    return;
  }

  const now = new Date(); now.setHours(0,0,0,0);
  const monday = new Date(now);
  const day = monday.getDay(); // 0..6 (Sun..Sat)
  // Calculate Monday of current week (or local week start)
  const diff = (day + 6) % 7; // convert so Monday=0
  monday.setDate(monday.getDate() - diff);
  monday.setHours(0,0,0,0);
  const sunday = new Date(monday); sunday.setDate(sunday.getDate() + 6); sunday.setHours(23,59,59,999);
  // Consider tasks that are due this week OR were updated (completed) this week
  const weekTasks = allTasks.filter(t => {
    const hasDue = t.dueDate && new Date(t.dueDate) >= monday && new Date(t.dueDate) <= sunday;
    const updated = t.updatedAt && new Date(t.updatedAt) >= monday && new Date(t.updatedAt) <= sunday;
    return hasDue || updated;
  });

  // Tasks due this week (for progress denominator)
  const dueThisWeek = allTasks.filter(t => t.dueDate && new Date(t.dueDate) >= monday && new Date(t.dueDate) <= sunday);

  // Tasks completed during the week (based on updatedAt and completed flag)
  const completedThisWeek = weekTasks.filter(t => t.completed && t.updatedAt && new Date(t.updatedAt) >= monday && new Date(t.updatedAt) <= sunday);

  const completedCount = completedThisWeek.length;
  const denom = dueThisWeek.length || weekTasks.length || 1;
  const pct = denom ? Math.round((completedCount / denom) * 100) : 0;

  // Accuracy: percent of completed tasks that were completed on or before their due date
  const withDueAndCompleted = completedThisWeek.filter(t => t.dueDate);
  const completedOnTime = withDueAndCompleted.filter(t => new Date(t.updatedAt) <= new Date(t.dueDate)).length;
  const accuracy = withDueAndCompleted.length ? Math.round((completedOnTime / withDueAndCompleted.length) * 100) : null;

  // Efficiency: average time (in days) from creation to completion for tasks completed this week
  const durations = completedThisWeek.map(t => {
    const created = t.createdAt ? new Date(t.createdAt) : null;
    const finished = t.updatedAt ? new Date(t.updatedAt) : null;
    if (!created || !finished) return null;
    return (finished - created) / (1000 * 60 * 60 * 24); // days
  }).filter(d => typeof d === 'number');

  const avgDays = durations.length ? (durations.reduce((a,b)=>a+b,0) / durations.length) : null;

  const el = document.getElementById('weeklySummary');
  el.innerHTML = `
    <div><strong>${completedCount}</strong> completed of <strong>${dueThisWeek.length || weekTasks.length}</strong></div>
    <div style="margin-top:8px" class="progress-bar"><div style="width:${pct}%" class="progress-fill"></div></div>
    <div style="margin-top:6px" class="muted small">${pct}% this week</div>
    <div style="margin-top:8px" class="muted small">Accuracy: ${accuracy === null ? 'N/A' : accuracy + '%'} &nbsp;|&nbsp; Efficiency: ${avgDays === null ? 'N/A' : avgDays.toFixed(1) + ' days'}</div>
  `;
}
