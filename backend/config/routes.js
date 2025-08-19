module.exports.routes = {
  'POST /api/register': 'auth/register',
  'POST /api/login': 'auth/login',
  'POST /api/refresh': 'auth/refresh',
  'DELETE /api/delete-account': 'auth/deleteAccount',
  
  'GET /api/tasks': 'tasks/index',
  'POST /api/tasks': 'tasks/create',
  'PATCH /api/tasks/:id': 'tasks/update',
  'DELETE /api/tasks/:id': 'tasks/destroy',
};
