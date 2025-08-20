// Array to store all our tasks
let tasks = [];
let taskIdCounter = 0;
let currentDate = new Date();
let currentTheme = localStorage.getItem('theme') || 'light';

// Reminder system variables
let remindersEnabled = localStorage.getItem('remindersEnabled') === 'true';
let lastReminderCheck = localStorage.getItem('lastReminderCheck') || '';

// Native notification variables
let notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
let notificationPermission = 'default';

// Initialize theme
document.documentElement.setAttribute('data-theme', currentTheme);

// Check notification support and permission on load
function initializeNotifications() {
  if ('Notification' in window) {
    notificationPermission = Notification.permission;
    
    // If user previously enabled notifications but permission was revoked
    if (notificationsEnabled && Notification.permission !== 'granted') {
      notificationsEnabled = false;
      localStorage.setItem('notificationsEnabled', 'false');
    }
  } else {
    // Browser doesn't support notifications
    notificationsEnabled = false;
    localStorage.setItem('notificationsEnabled', 'false');
  }
}

// Request notification permission
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    showToast('Not Supported', 'This browser does not support notifications', 'error', 5000);
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    showToast('Permission Denied', 'Please enable notifications in your browser settings', 'error', 5000);
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    
    if (permission === 'granted') {
      showToast('Notifications Enabled!', 'You will now receive device notifications', 'success', 4000);
      return true;
    } else {
      showToast('Permission Required', 'Please allow notifications to use this feature', 'warning', 4000);
      return false;
    }
  } catch (error) {
    showToast('Error', 'Failed to request notification permission', 'error', 3000);
    return false;
  }
}

// Send native device notification
function sendNativeNotification(title, message, taskId = null, options = {}) {
  if (!notificationsEnabled || Notification.permission !== 'granted') {
    return;
  }

  const defaultOptions = {
    icon: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#3b82f6" rx="20"/>
        <text x="50" y="60" font-size="50" text-anchor="middle" fill="white">📅</text>
      </svg>
    `),
    badge: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
        <circle cx="25" cy="25" r="25" fill="#3b82f6"/>
        <text x="25" y="35" font-size="25" text-anchor="middle" fill="white">📅</text>
      </svg>
    `),
    tag: taskId ? `task-${taskId}` : `reminder-${Date.now()}`,
    requireInteraction: false,
    silent: false,
    ...options
  };

  try {
    const notification = new Notification(title, {
      body: message,
      ...defaultOptions
    });

    // Handle notification click
    notification.onclick = function() {
      window.focus(); // Focus the browser window
      
      // If there's a task ID, show the task modal
      if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          showTaskModal(task);
        }
      }
      
      notification.close();
    };

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

// Toast Notification System
function showToast(title, message = '', type = 'success', duration = 4000) {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.success}</div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-message">${message}</div>` : ''}
    </div>
    <button class="toast-close" onclick="removeToast(this.parentElement)">&times;</button>
    <div class="toast-progress" style="width: 100%;"></div>
  `;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  // Progress bar animation
  const progressBar = toast.querySelector('.toast-progress');
  setTimeout(() => {
    progressBar.style.width = '0%';
    progressBar.style.transition = `width ${duration}ms linear`;
  }, 100);

  // Auto remove
  setTimeout(() => {
    removeToast(toast);
  }, duration);

  return toast;
}

function removeToast(toast) {
  toast.classList.remove('show');
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

// Highlight calendar day with animation
function highlightCalendarDay(dateString) {
  if (!dateString) return;
  
  const targetDate = new Date(dateString);
  const calendarDays = document.querySelectorAll('.calendar-day');
  
  calendarDays.forEach(day => {
    const dayNumber = day.querySelector('.day-number');
    if (dayNumber) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(dayNumber.textContent));
      if (dayDate.toDateString() === targetDate.toDateString()) {
        day.classList.add('highlight');
        setTimeout(() => {
          day.classList.remove('highlight');
        }, 1000);
      }
    }
  });
}

// Initialize reminder system
function initializeReminders() {
  const reminderToggle = document.querySelector('.reminder-toggle');
  if (remindersEnabled) {
    reminderToggle.classList.add('active');
    document.getElementById('reminderPanel').classList.add('active');
  }
  
  // Check for reminders immediately and set up periodic checks
  checkReminders();
  
  // Check every 30 minutes for new reminders
  setInterval(checkReminders, 30 * 60 * 1000);
}

// Enhanced toggle reminders with notification permission
async function toggleReminders() {
  const panel = document.getElementById('reminderPanel');
  const toggle = document.querySelector('.reminder-toggle');
  
  if (!remindersEnabled) {
    // Request permission when enabling reminders
    const hasPermission = await requestNotificationPermission();
    notificationsEnabled = hasPermission;
    localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
  }
  
  remindersEnabled = !remindersEnabled;
  localStorage.setItem('remindersEnabled', remindersEnabled.toString());
  
  if (remindersEnabled) {
    panel.classList.add('active');
    toggle.classList.add('active');
    updateReminderList();
    
    if (notificationsEnabled) {
      showToast('Full Reminders Enabled', 'You will receive both in-app and device notifications', 'success', 3000);
      
      // Send a test notification
      sendNativeNotification(
        '🔔 DayPlan Notifications Active',
        'You will now receive reminders for upcoming and overdue tasks',
        null,
        { requireInteraction: false }
      );
    } else {
      showToast('Reminders Enabled', 'You will receive in-app reminders only', 'success', 3000);
    }
  } else {
    panel.classList.remove('active');
    toggle.classList.remove('active');
    notificationsEnabled = false;
    localStorage.setItem('notificationsEnabled', 'false');
    showToast('Reminders Disabled', 'All reminders have been turned off', 'info', 3000);
  }
}

// Enhanced check for tasks that need reminders
function checkReminders() {
  if (!remindersEnabled) return;
  
  const today = new Date();
  const todayStr = today.toDateString();
  
  // Don't check more than once per day for initial load
  if (lastReminderCheck === todayStr) return;
  
  const reminders = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  tasks.forEach(task => {
    if (task.completed || !task.dueDate) return;
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Overdue tasks
    if (daysDiff < 0) {
      reminders.push({
        task,
        type: 'overdue',
        message: `${Math.abs(daysDiff)} days overdue`,
        priority: 1
      });
    }
    // Due tomorrow
    else if (daysDiff === 1) {
      reminders.push({
        task,
        type: 'due-tomorrow',
        message: 'Due tomorrow',
        priority: 2
      });
    }
    // Due in 3 days
    else if (daysDiff === 3) {
      reminders.push({
        task,
        type: 'due-3-days',
        message: 'Due in 3 days',
        priority: 3
      });
    }
    // Due in 1 week
    else if (daysDiff === 7) {
      reminders.push({
        task,
        type: 'due-1-week',
        message: 'Due in 1 week',
        priority: 4
      });
    }
    // Due in 2 weeks
    else if (daysDiff === 14) {
      reminders.push({
        task,
        type: 'due-2-weeks',
        message: 'Due in 2 weeks',
        priority: 5
      });
    }
  });
  
  // Show notifications for high priority reminders (only once per day)
  if (lastReminderCheck !== todayStr) {
    const criticalReminders = reminders.filter(r => r.priority <= 2);
    if (criticalReminders.length > 0) {
      const overdueCount = reminders.filter(r => r.type === 'overdue').length;
      const tomorrowCount = reminders.filter(r => r.type === 'due-tomorrow').length;
      
      if (overdueCount > 0) {
        // In-app toast
        showToast('⚠️ Overdue Tasks!', 
          `You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}`, 
          'error', 6000);
        
        // Native notification
        sendNativeNotification(
          '⚠️ Overdue Tasks!',
          `You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} that need attention`,
          null,
          { requireInteraction: true }
        );
      }
      
      if (tomorrowCount > 0) {
        // In-app toast
        showToast('📅 Tasks Due Tomorrow', 
          `${tomorrowCount} task${tomorrowCount > 1 ? 's' : ''} due tomorrow`, 
          'warning', 5000);
        
        // Native notification
        sendNativeNotification(
          '📅 Tasks Due Tomorrow',
          `${tomorrowCount} task${tomorrowCount > 1 ? 's' : ''} due tomorrow - don't forget!`,
          null,
          { requireInteraction: false }
        );
      }
    }
    
    lastReminderCheck = todayStr;
    localStorage.setItem('lastReminderCheck', lastReminderCheck);
  }
  
  updateReminderList();
}

// Update the reminder list display (fixed the onclick issue)
function updateReminderList() {
  if (!remindersEnabled) return;
  
  const reminderList = document.getElementById('reminderList');
  const reminders = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  tasks.forEach(task => {
    if (task.completed || !task.dueDate) return;
    
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    let reminderInfo = null;
    
    if (daysDiff < 0) {
      reminderInfo = {
        task,
        type: 'overdue',
        message: `${Math.abs(daysDiff)} day${Math.abs(daysDiff) > 1 ? 's' : ''} overdue`,
        priority: 1,
        badgeText: 'OVERDUE'
      };
    } else if (daysDiff === 1) {
      reminderInfo = {
        task,
        type: 'due-tomorrow',
        message: 'Due tomorrow',
        priority: 2,
        badgeText: 'TOMORROW'
      };
    } else if (daysDiff <= 3) {
      reminderInfo = {
        task,
        type: 'due-3-days',
        message: `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`,
        priority: 3,
        badgeText: `${daysDiff} DAY${daysDiff > 1 ? 'S' : ''}`
      };
    } else if (daysDiff <= 7) {
      reminderInfo = {
        task,
        type: 'due-1-week',
        message: `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`,
        priority: 4,
        badgeText: `${daysDiff} DAYS`
      };
    } else if (daysDiff <= 14) {
      reminderInfo = {
        task,
        type: 'due-2-weeks',
        message: `Due in ${daysDiff} day${daysDiff > 1 ? 's' : ''}`,
        priority: 5,
        badgeText: `${daysDiff} DAYS`
      };
    }
    
    if (reminderInfo) {
      reminders.push(reminderInfo);
    }
  });
  
  // Sort by priority (most urgent first)
  reminders.sort((a, b) => a.priority - b.priority);
  
  if (reminders.length === 0) {
    reminderList.innerHTML = `
      <div class="no-reminders">
        🎉 No upcoming deadlines! You're all caught up.
      </div>
    `;
    return;
  }
  
  // FIXED: Use task ID instead of reminder object
  reminderList.innerHTML = reminders.map(reminder => `
    <div class="reminder-item ${reminder.type}" onclick="showTaskFromReminder(${reminder.task.id})">
      <div class="reminder-content">
        <div class="reminder-title">${reminder.task.title}</div>
        <div class="reminder-details">
          ${reminder.task.category} • Priority: ${reminder.task.priority} • ${reminder.message}
        </div>
      </div>
      <div class="reminder-badge ${reminder.type}">
        ${reminder.badgeText}
      </div>
    </div>
  `).join('');
}

// Helper function to show task modal from reminder click
function showTaskFromReminder(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    showTaskModal(task);
  }
}

// Load tasks from localStorage when page loads
function loadTasks() {
  const savedTasks = localStorage.getItem('todoTasks');
  const savedCounter = localStorage.getItem('taskIdCounter');
  
  if (savedTasks) {
    tasks = JSON.parse(savedTasks);
  }
  
  if (savedCounter) {
    taskIdCounter = parseInt(savedCounter);
  }
  
  renderCalendar();
  
  // Welcome message
  if (tasks.length === 0) {
    setTimeout(() => {
      showToast('Welcome to DayPlan!', 'Start by adding your first task above', 'info', 5000);
    }, 500);
  }
}

// Save tasks to localStorage
function saveTasks() {
  localStorage.setItem('todoTasks', JSON.stringify(tasks));
  localStorage.setItem('taskIdCounter', taskIdCounter.toString());
}

// Theme toggle
function toggleTheme() {
  currentTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', currentTheme);
  localStorage.setItem('theme', currentTheme);
  
  const themeMessage = currentTheme === 'dark' ? 'Dark mode activated' : 'Light mode activated';
  showToast('Theme Changed', themeMessage, 'info', 2000);
}

// Date helper functions
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    return date.toLocaleDateString();
  }
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function isDueToday(dueDate) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due.getTime() === today.getTime();
}

function isDueTomorrow(dueDate) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  due.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  return due.getTime() === tomorrow.getTime();
}

function isDueThisWeek(dueDate) {
  if (!dueDate) return false;
  const due = new Date(dueDate);
  const today = new Date();
  const weekFromToday = new Date(today);
  weekFromToday.setDate(today.getDate() + 7);
  
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  weekFromToday.setHours(0, 0, 0, 0);
  
  return due.getTime() >= today.getTime() && due.getTime() <= weekFromToday.getTime();
}

// Filter tasks
function filterTasks() {
  const statusFilter = document.getElementById('statusFilter').value;
  const priorityFilter = document.getElementById('priorityFilter').value;
  const categoryFilter = document.getElementById('categoryFilter').value;
  
  return tasks.filter(task => {
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    return true;
  });
}

// Clear filters
function clearFilters() {
  document.getElementById('statusFilter').value = 'all';
  document.getElementById('priorityFilter').value = 'all';
  document.getElementById('categoryFilter').value = 'all';
  renderCalendar();
  showToast('Filters Cleared', 'All tasks are now visible', 'info', 2000);
}

// Enhanced add task with native notifications
function addTask() {
  const titleInput = document.getElementById('taskTitle');
  const bodyInput = document.getElementById('taskBody');
  const priorityLevel = document.getElementById('taskPriority');
  const categorySelect = document.getElementById('taskCategory');
  const taskDueDate = document.getElementById('taskDueDate');

  const titleText = titleInput.value.trim();
  const bodyText = bodyInput.value.trim();
  const priority = priorityLevel.value;
  const category = categorySelect.value;
  const dueDate = taskDueDate.value.trim();

  if (titleText === '' || bodyText === '') {
    showToast('Incomplete Information', 'Please fill in both title and description', 'error', 3000);
    return;
  }

  const newTask = {
    id: taskIdCounter++,
    title: titleText,
    body: bodyText,
    priority: priority,
    category: category,
    dueDate: dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  saveTasks();

  // Clear inputs
  titleInput.value = '';
  bodyInput.value = '';
  taskDueDate.value = '';
  priorityLevel.value = 'low';

  renderCalendar();
  
  // Show success notification
  const dueDateText = dueDate ? ` for ${formatDate(dueDate)}` : '';
  showToast('Task Added Successfully!', `"${titleText}"${dueDateText} has been added to your calendar`, 'success', 4000);
  
  // Send native notification for urgent tasks
  if (dueDate && notificationsEnabled) {
    const today = new Date();
    const taskDate = new Date(dueDate);
    const timeDiff = taskDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1 && priority === 'high') {
      sendNativeNotification(
        '🚨 Urgent Task Added!',
        `High priority task "${titleText}" is due ${daysDiff === 0 ? 'today' : 'tomorrow'}`,
        newTask.id,
        { requireInteraction: true }
      );
    }
  }
  
  // Highlight the calendar day
  if (dueDate) {
    highlightCalendarDay(dueDate);
  }
  
  // Update reminders to include the new task
  updateReminderList();
}

// Calendar navigation
function previousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

function goToToday() {
  currentDate = new Date();
  renderCalendar();
  showToast('Current Month', 'Navigated to current month', 'info', 2000);
}

// Render calendar
function renderCalendar() {
  const filteredTasks = filterTasks();
  
  // Update month display
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  document.getElementById('currentMonth').textContent = 
    `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Get first day of month and number of days
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const calendarBody = document.getElementById('calendarBody');
  calendarBody.innerHTML = '';

  // Generate 6 weeks of calendar
  for (let week = 0; week < 6; week++) {
    for (let day = 0; day < 7; day++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + (week * 7) + day);
      
      const dayDiv = document.createElement('div');
      dayDiv.className = 'calendar-day';
      
      // Add classes for styling
      if (cellDate.getMonth() !== currentDate.getMonth()) {
        dayDiv.classList.add('other-month');
      }
      
      const today = new Date();
      if (cellDate.toDateString() === today.toDateString()) {
        dayDiv.classList.add('today');
      }

      // Day number
      const dayNumber = document.createElement('div');
      dayNumber.className = 'day-number';
      dayNumber.textContent = cellDate.getDate();
      dayDiv.appendChild(dayNumber);

      // Add tasks for this day
      const dayTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        const taskDate = new Date(task.dueDate);
        return taskDate.toDateString() === cellDate.toDateString();
      });

      dayTasks.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = `task-item priority-${task.priority}`;
        taskDiv.textContent = task.title;
        
        if (task.completed) {
          taskDiv.classList.add('completed');
        }
        
        if (!task.completed && isOverdue(task.dueDate)) {
          taskDiv.classList.add('overdue');
        }

        taskDiv.onclick = (e) => {
          e.stopPropagation();
          showTaskModal(task);
        };

        dayDiv.appendChild(taskDiv);
      });

      // Click handler to add task for this date
      dayDiv.onclick = () => {
        const dateInput = document.getElementById('taskDueDate');
        dateInput.value = cellDate.toISOString().split('T')[0];
        document.getElementById('taskTitle').focus();
        showToast('Date Selected', `Click "Add Task" to create a task for ${formatDate(cellDate.toISOString().split('T')[0])}`, 'info', 3000);
      };

      calendarBody.appendChild(dayDiv);
    }
  }

  updateStats();
  updateReminderList();
}

// Modal functions
function showTaskModal(task) {
  const modal = document.getElementById('taskModal');
  const modalBody = document.getElementById('modalBody');
  
  const createdDate = new Date(task.createdAt).toLocaleDateString();
  const dueDate = task.dueDate ? formatDate(task.dueDate) : 'No due date';
  
  modalBody.innerHTML = `
    <div class="task-details">
      <h3>${task.title}</h3>
      <p><strong>Description:</strong> ${task.body}</p>
      <p><strong>Priority:</strong> <span class="priority-badge ${task.priority}">${task.priority}</span></p>
      <p><strong>Category:</strong> ${task.category}</p>
      <p><strong>Due Date:</strong> ${dueDate}</p>
      <p><strong>Status:</strong> ${task.completed ? '✅ Completed' : '⏳ Pending'}</p>
      <p><strong>Created:</strong> ${createdDate}</p>
    </div>
    <div class="modal-actions">
      <button onclick="editTask(${task.id})">Edit</button>
      <button onclick="toggleComplete(${task.id})" class="${task.completed ? 'cancel-btn' : 'save-btn'}">
        ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
      </button>
      <button class="btn-danger" onclick="deleteTask(${task.id})">Delete</button>
    </div>
  `;
  
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('taskModal').classList.remove('active');
}

// Task operations
function deleteTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  if (confirm('Are you sure you want to delete this task?')) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    closeModal();
    renderCalendar();
    showToast('Task Deleted', `"${task.title}" has been removed from your calendar`, 'warning', 3000);
  }
}

// Enhanced toggle complete with celebration notifications
function toggleComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    closeModal();
    renderCalendar();
    
    if (task.completed) {
      showToast('Task Completed! 🎉', `"${task.title}" has been marked as completed`, 'success', 4000);
      
      // Send celebration notification for completed high-priority tasks
      if (task.priority === 'high' && notificationsEnabled) {
        sendNativeNotification(
          '🎉 High Priority Task Completed!',
          `Great job completing "${task.title}"!`,
          task.id,
          { requireInteraction: false }
        );
      }
    } else {
      showToast('Task Reopened', `"${task.title}" has been marked as incomplete`, 'info', 3000);
    }
    
    // Update reminders since task status changed
    updateReminderList();
  }
}

function editTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  
  const modalBody = document.getElementById('modalBody');
  
  modalBody.innerHTML = `
    <div class="edit-field">
      <label>Title:</label>
      <input type="text" id="edit-title-${taskId}" value="${task.title}" class="edit-input">
    </div>
    <div class="edit-field">
      <label>Description:</label>
      <input type="text" id="edit-body-${taskId}" value="${task.body}" class="edit-input">
    </div>
    <div class="edit-field">
      <label>Due Date:</label>
      <input type="date" id="edit-date-${taskId}" value="${task.dueDate || ''}" class="edit-input">
    </div>
    <div class="edit-field">
      <label>Priority:</label>
      <select id="edit-priority-${taskId}" class="edit-select">
        <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low Priority</option>
        <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
        <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High Priority</option>
      </select>
    </div>
    <div class="edit-field">
      <label>Category:</label>
      <select id="edit-category-${taskId}" class="edit-select">
        <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>Personal</option>
        <option value="work" ${task.category === 'work' ? 'selected' : ''}>Work</option>
        <option value="shopping" ${task.category === 'shopping' ? 'selected' : ''}>Shopping</option>
        <option value="health" ${task.category === 'health' ? 'selected' : ''}>Health</option>
        <option value="other" ${task.category === 'other' ? 'selected' : ''}>Other</option>
      </select>
    </div>
    <div class="modal-actions">
      <button class="save-btn" onclick="saveTask(${taskId})">Save Changes</button>
      <button class="cancel-btn" onclick="cancelEdit(${taskId})">Cancel</button>
    </div>
  `;
  
  document.getElementById(`edit-title-${taskId}`).focus();
}

function saveTask(taskId) {
  const titleInput = document.getElementById(`edit-title-${taskId}`);
  const bodyInput = document.getElementById(`edit-body-${taskId}`);
  const dateInput = document.getElementById(`edit-date-${taskId}`);
  const prioritySelect = document.getElementById(`edit-priority-${taskId}`);
  const categorySelect = document.getElementById(`edit-category-${taskId}`);
  
  const newTitle = titleInput.value.trim();
  const newBody = bodyInput.value.trim();
  
  if (newTitle === '' || newBody === '') {
    showToast('Incomplete Information', 'Please fill in both title and description', 'error', 3000);
    return;
  }
  
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    const oldTitle = task.title;
    task.title = newTitle;
    task.body = newBody;
    task.dueDate = dateInput.value.trim();
    task.priority = prioritySelect.value;
    task.category = categorySelect.value;
    task.updatedAt = new Date().toISOString();
    
    saveTasks();
    closeModal();
    renderCalendar();
    showToast('Task Updated Successfully!', `"${oldTitle}" has been updated`, 'success', 4000);
    
    // Highlight the calendar day if date changed
    if (task.dueDate) {
      highlightCalendarDay(task.dueDate);
    }
  }
}

function cancelEdit(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    showTaskModal(task);
  }
}

function clearAll() {
  if (tasks.length === 0) {
    showToast('Nothing to Clear', 'Your calendar is already empty', 'info', 2000);
    return;
  }
  
  const taskCount = tasks.length;
  if (confirm(`Are you sure you want to delete all ${taskCount} tasks?`)) {
    tasks = [];
    saveTasks();
    renderCalendar();
    showToast('All Tasks Cleared', `${taskCount} tasks have been removed from your calendar`, 'warning', 4000);
  }
}

function updateStats() {
  const totalCount = tasks.length;
  let completedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  
  tasks.forEach(task => {
    if (task.completed) {
      completedCount++;
    } else {
      pendingCount++;
      if (isOverdue(task.dueDate)) {
        overdueCount++;
      }
    }
  });
  
  document.getElementById('totalCount').textContent = totalCount;
  document.getElementById('completedCount').textContent = completedCount;
  document.getElementById('pendingCount').textContent = pendingCount;
  document.getElementById('overdueCount').textContent = overdueCount;
}

// Event listeners
document.getElementById('taskTitle').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    addTask();
  }
});

document.getElementById('taskBody').addEventListener('keypress', function(event) {
  if (event.key === 'Enter') {
    addTask();
  }
});

// Close modal when clicking outside
document.getElementById('taskModal').addEventListener('click', function(event) {
  if (event.target === this) {
    closeModal();
  }
});

// Mobile swipe gestures
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  if (Math.abs(touchEndX - touchStartX) > 50) {
    if (touchEndX < touchStartX - 50) {
      nextMonth();    // Swipe left
      showToast('Next Month', 'Swiped to next month', 'info', 1500);
    }
    if (touchEndX > touchStartX + 50) {
      previousMonth(); // Swipe right
      showToast('Previous Month', 'Swiped to previous month', 'info', 1500);
    }
  }
});

// Enhanced initialization
window.addEventListener('load', function() {
  initializeNotifications();
  initializeReminders();
  loadTasks();
});