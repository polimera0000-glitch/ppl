// Role-based access control middleware
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    
    // Convert single role to array
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Specific role checks
const requireAdmin = requireRole('admin');
const requireHiring = requireRole(['hiring', 'admin']);
const requireInvestor = requireRole(['investor', 'admin']);
const requireStudent = requireRole(['student', 'admin']);

// Multiple role checks
const requireHiringOrInvestor = requireRole(['hiring', 'investor', 'admin']);
const requireAnyRole = requireRole(['student', 'hiring', 'investor', 'admin']);

module.exports = {
  requireRole,
  requireAdmin,
  requireHiring,
  requireInvestor,
  requireStudent,
  requireHiringOrInvestor,
  requireAnyRole
};