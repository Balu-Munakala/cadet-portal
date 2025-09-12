const pool = require('../config/db');

/**
 * GET /api/master/platform-config
 * List all key/value pairs. Master only.
 */
exports.getAllConfig = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may view platform configuration.' });
  }
  try {
    const result = await pool.query(
      `SELECT config_id, config_key, config_value, description, updated_at
       FROM platform_config
       ORDER BY config_key ASC`
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('[Get Config Error]', err);
    return res.status(500).json({ msg: 'Database error while fetching config.' });
  }
};

/**
 * PUT /api/master/platform-config
 * Body: [{ key, value, description? }]
 * This endpoint now handles an array of updates.
 */
exports.updateConfig = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may update configuration.' });
  }
  const updates = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ msg: 'Invalid update payload.' });
  }
  try {
    const updatePromises = updates.map(u =>
      pool.query(
        `INSERT INTO platform_config (config_key, config_value, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (config_key) DO UPDATE SET
           config_value = EXCLUDED.config_value,
           description = EXCLUDED.description,
           updated_at = CURRENT_TIMESTAMP`,
        [u.key, u.value, u.description || null]
      )
    );
    await Promise.all(updatePromises);
    return res.json({ msg: 'Configuration updated successfully.' });
  } catch (err) {
    console.error('[Update Config Error]', err);
    return res.status(500).json({ msg: 'Database error while updating config.' });
  }
};

/**
 * POST /api/master/platform-config
 * Body: { config_key, config_value, description? }
 */
exports.createConfig = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may create configuration.' });
  }
  const { config_key, config_value, description } = req.body;
  if (!config_key || !config_value) {
    return res.status(400).json({ msg: 'config_key and config_value are required.' });
  }
  try {
    await pool.query(
      `INSERT INTO platform_config (config_key, config_value, description)
       VALUES ($1, $2, $3)`,
      [config_key, config_value, description || null]
    );
    return res.json({ msg: 'Configuration created.' });
  } catch (err) {
    console.error('[Create Config Error]', err);
    if (err.code === '23505') { // PostgreSQL unique violation error code
      return res.status(400).json({ msg: 'config_key already exists.' });
    }
    return res.status(500).json({ msg: 'Database error while creating config.' });
  }
};

/**
 * DELETE /api/master/platform-config/:config_id
 */
exports.deleteConfig = async (req, res) => {
  if (req.user.userType !== 'master') {
    return res.status(403).json({ msg: 'Only master may delete configuration.' });
  }
  const { config_id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM platform_config WHERE config_id = $1`,
      [config_id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Configuration not found.' });
    }
    return res.json({ msg: 'Configuration deleted.' });
  } catch (err) {
    console.error('[Delete Config Error]', err);
    return res.status(500).json({ msg: 'Database error while deleting config.' });
  }
};
