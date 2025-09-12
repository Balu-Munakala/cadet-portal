const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/masterManageAdminsController');

// All endpoints here require master-level access

router.get('/', authenticate, ctrl.getAllAdmins);
router.put('/:ano_id/disable', authenticate, ctrl.disableAdmin);
router.put('/:ano_id/enable', authenticate, ctrl.enableAdmin);
router.delete('/:ano_id', authenticate, ctrl.deleteAdmin);

module.exports = router;
