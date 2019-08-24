import casbin from 'libraries/casbin';

/**
 * Grant or deny user access to admin endpoints
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export async function canAccessToAdmin(req, res, next) {
  const roles = await casbin.getRolesArray(req.user.id);
  if (roles.includes('admin')) {
    req.permissions = await casbin.getRolePolicies('admin');
    next();
  } else {
    res.boom.forbidden();
  }
};

/**
 * Grant or deny access to read orders
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export async function canReadAnyOrder(req, res, next) {
  // eslint-disable-next-line max-len
  const permission = await casbin.can(req.user.id, `order:${req.params.order}`, 'order', 'read');
  if (permission.granted) {
    next();
  } else {
    // eslint-disable-next-line max-len
    res.boom.forbidden(res.__('Your account is not allowed to %s', 'view this order'));
  }
}

/**
 * Grant or deny access to create categories
 * @param {Request} req
 * @param {Response} res
 * @param {Function} next
 */
export async function canCreateCategories(req, res, next) {
  const permission = await casbin.globalResource(req.user.id, 'coupon', 'create');
  if (permission.granted) {
    next();
  } else {
    // eslint-disable-next-line max-len
    res.boom.forbidden(res.__('Your account is not allowed to %s', 'view this order'));
  }
}