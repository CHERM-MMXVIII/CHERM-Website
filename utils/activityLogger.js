module.exports = async function logActivity(req, pool, type, entity, name, message) {
  try {
    if (!req.session?.user) return;

    await pool.query(
      `INSERT INTO activity_logs
       (user_id, action_type, entity_type, entity_name, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.session.user.id, type, entity, name, message]
    );
  } catch (err) {
    console.error('Activity log failed:', err);
  }
};