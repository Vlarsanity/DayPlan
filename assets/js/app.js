// Array to store all our tasks
let tasks = [];
let taskIdCounter = 0;
let currentDate = new Date();
let currentTheme = localStorage.getItem('theme') || 'light';

// Initialize theme
document.documentElement.setAttribute('data-theme', currentTheme);

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
}

// Add task
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
    alert('Please fill in both title and description before adding!');
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
      };

      calendarBody.appendChild(dayDiv);
    }
  }

  updateStats();
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
  if (confirm('Are you sure you want to delete this task?')) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    closeModal();
    renderCalendar();
  }
}

function toggleComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    closeModal();
    renderCalendar();
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
    alert('Please fill in both title and description!');
    return;
  }
  
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.title = newTitle;
    task.body = newBody;
    task.dueDate = dateInput.value.trim();
    task.priority = prioritySelect.value;
    task.category = categorySelect.value;
    task.updatedAt = new Date().toISOString();
    
    saveTasks();
    closeModal();
    renderCalendar();
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
    alert('No tasks to clear!');
    return;
  }
  
  if (confirm('Are you sure you want to delete all tasks?')) {
    tasks = [];
    saveTasks();
    renderCalendar();
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

// Add to your JS for better mobile UX
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
  touchEndX = e.changedTouches[0].screenX;
  if (touchEndX < touchStartX - 50) nextMonth();    // Swipe left
  if (touchEndX > touchStartX + 50) previousMonth(); // Swipe right
});

// Initialize app
window.addEventListener('load', loadTasks);