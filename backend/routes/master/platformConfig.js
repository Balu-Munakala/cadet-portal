const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/masterPlatformConfigController');

// GET all config entries
router.get('/', authenticate, ctrl.getAllConfig);

// PUT  /api/master/platform-config
router.put('/', authenticate, ctrl.updateConfig);

// The following routes are less common for a simple config manager,
// so we'll comment them out for now to prevent accidental misuse.
// If you need them later, you can uncomment them and ensure
// your controller methods handle them correctly.

// router.post('/', authenticate, ctrl.createConfig);
// router.delete('/:config_id', authenticate, ctrl.deleteConfig);

module.exports = router;
