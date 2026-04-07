class TodoChannel {
  constructor() {
    this.channelId = window.chickenChannelId;
    this.username = window.chickenUser;
    this.todos = [];
  }

  async init() {
    await this.loadTodos();
    this.render();
    this.setupSocketListeners();
  }

  async loadTodos() {
    const res = await fetch(
      `/api/channels/${this.channelId}/data?key=todos`,
      { credentials: 'same-origin' }
    );
    const data = await res.json();
    this.todos = data.value ? JSON.parse(data.value) : [];
  }

  async addTodo(text) {
    const todo = {
      id: Date.now(),
      text,
      completed: false,
      createdBy: this.username,
      createdAt: new Date().toISOString()
    };

    this.todos.push(todo);
    await this.saveTodos();
    window.channelSocket?.emit('todos:update', {
      channel_id: this.channelId,
      todos: this.todos
    });
  }

  async saveTodos() {
    await fetch(`/api/channels/${this.channelId}/data`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'todos',
        value: JSON.stringify(this.todos)
      })
    });
  }

  setupSocketListeners() {
    window.channelSocket?.on('todos:update', (data) => {
      this.todos = data.todos;
      this.render();
    });
  }

  render() {
    const html = this.todos.map(todo => `
      <div class="todo ${todo.completed ? 'completed' : ''}">
        <input type="checkbox" 
          onchange="toggleTodo(${todo.id}, this.checked)" 
          ${todo.completed ? 'checked' : ''}>
        <span>${todo.text}</span>
        <small>${todo.createdBy}</small>
      </div>
    `).join('');
    
    document.getElementById('todos').innerHTML = html;
  }
}

// Initialize
const todoChannel = new TodoChannel();
todoChannel.init();
