function requireAdminPassword(req, res, next) {
  const submitted = req.body.admin_password;

  if (submitted === process.env.ADMIN_PASSWORD) {
    return next();
  }

  // 403 with the form re-rendered, so the user sees why nothing happened.
  res.status(403).render('error', {
    message: 'Wrong admin password. Nothing was deleted.',
  });
}

module.exports = requireAdminPassword;
