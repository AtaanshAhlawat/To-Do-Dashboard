const policies = require('./policies');

/**
 * Sails.js-style policy loader that applies policies to routes automatically
 * This prevents the need to manually add auth middleware to each route
 */
class PolicyLoader {
  constructor() {
    this.policies = policies.policies;
    this.middlewares = {
      isAuthenticated: policies.isAuthenticated,
      isResourceOwner: policies.isResourceOwner,
      isOwner: policies.isOwner,
      authRateLimit: policies.authRateLimit,
      apiRateLimit: policies.apiRateLimit
    };
  }

  /**
   * Apply policies to Express app
   * @param {Express} app - Express application instance
   */
  applyPolicies(app) {
    // Store original router methods
    const originalGet = app.get;
    const originalPost = app.post;
    const originalPut = app.put;
    const originalPatch = app.patch;
    const originalDelete = app.delete;

    // Override router methods to apply policies
    app.get = this.wrapMethod(originalGet.bind(app), 'GET');
    app.post = this.wrapMethod(originalPost.bind(app), 'POST');
    app.put = this.wrapMethod(originalPut.bind(app), 'PUT');
    app.patch = this.wrapMethod(originalPatch.bind(app), 'PATCH');
    app.delete = this.wrapMethod(originalDelete.bind(app), 'DELETE');

    return app;
  }

  /**
   * Wrap Express router methods to apply policies
   */
  wrapMethod(originalMethod, httpMethod) {
    return (path, ...handlers) => {
      const policyMiddlewares = this.getPolicyMiddlewares(path, httpMethod);
      return originalMethod(path, ...policyMiddlewares, ...handlers);
    };
  }

  /**
   * Get policy middlewares for a given route
   */
  getPolicyMiddlewares(path, httpMethod) {
    const middlewares = [];
    
    // Clean path for matching
    const cleanPath = path.replace('/api/', '').replace(/^\//, '');
    
    // Check for exact matches first
    if (this.policies[cleanPath]) {
      const policyNames = Array.isArray(this.policies[cleanPath]) 
        ? this.policies[cleanPath] 
        : [this.policies[cleanPath]];
      
      middlewares.push(...this.resolvePolicyNames(policyNames));
    }
    // Check for wildcard matches
    else {
      for (const [policyPath, policyNames] of Object.entries(this.policies)) {
        if (this.matchesWildcard(cleanPath, policyPath)) {
          const resolvedPolicies = Array.isArray(policyNames) 
            ? policyNames 
            : [policyNames];
          
          middlewares.push(...this.resolvePolicyNames(resolvedPolicies));
          break; // Use first match
        }
      }
    }

    return middlewares;
  }

  /**
   * Check if a path matches a wildcard pattern
   */
  matchesWildcard(path, pattern) {
    if (pattern === '*') return true;
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2);
      return path.startsWith(prefix);
    }
    return path === pattern;
  }

  /**
   * Resolve policy names to actual middleware functions
   */
  resolvePolicyNames(policyNames) {
    const middlewares = [];
    
    for (const policyName of policyNames) {
      if (policyName === true) {
        // true means allow all (no middleware)
        continue;
      }
      
      if (policyName === false) {
        // false means deny all
        middlewares.push((req, res, next) => {
          res.status(403).json({ 
            error: 'Access denied by policy.',
            code: 'POLICY_DENIED'
          });
        });
        continue;
      }
      
      if (typeof policyName === 'string' && this.middlewares[policyName]) {
        middlewares.push(this.middlewares[policyName]);
      }
    }
    
    return middlewares;
  }

  /**
   * Apply policies to a router (for modular route files)
   */
  applyToRouter(router, routePrefix = '') {
    const originalMethods = ['get', 'post', 'put', 'patch', 'delete'];
    
    originalMethods.forEach(method => {
      const originalMethod = router[method];
      
      router[method] = (path, ...handlers) => {
        const fullPath = `${routePrefix}${path}`.replace('//', '/');
        const policyMiddlewares = this.getPolicyMiddlewares(fullPath, method.toUpperCase());
        return originalMethod.call(router, path, ...policyMiddlewares, ...handlers);
      };
    });

    return router;
  }

  /**
   * Manually apply policies to specific routes (fallback method)
   */
  applyToRoute(routePath, httpMethod = 'GET') {
    return this.getPolicyMiddlewares(routePath, httpMethod);
  }
}

module.exports = new PolicyLoader();
