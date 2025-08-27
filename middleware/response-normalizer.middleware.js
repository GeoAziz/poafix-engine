export const normalizeUserResponse = (req, res, next) => {
  // Store original send function
  const originalSend = res.json;

  // Override json method
  res.json = function (data) {
    if (data && data.data) {
      // Normalize array of users
      if (Array.isArray(data.data)) {
        data.data = data.data.map(normalizeUser);
      } 
      // Normalize single user
      else if (data.data.role || data.data.userType) {
        data.data = normalizeUser(data.data);
      }
    }
    
    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

function normalizeUser(user) {
  if (!user) return user;

  return {
    ...user,
    role: (user.role || user.userType || 'client').toLowerCase(),
    userType: (user.userType || user.role || 'client').toLowerCase(),
  };
}
