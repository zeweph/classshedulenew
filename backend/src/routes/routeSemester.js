// routes/semesterRoutes.js
const express = require('express');
const router = express.Router();
const semesterController = require('../controllers/semesterController');

// All routes with automatic status update
router.get('/', semesterController.getAllSemesters);
router.get('/batch/:batch_id', semesterController.getSemestersByBatch);
router.get('/active', semesterController.getActiveSemesters);
router.get('/completed', semesterController.getCompletedSemesters);
router.get('/current', semesterController.getCurrentSemester);
router.get('/:id', semesterController.getSemesterById);

router.post('/', semesterController.createSemester);
router.put('/:id', semesterController.updateSemester);
router.patch('/:id/status', semesterController.updateStatus);
router.delete('/:id', semesterController.deleteSemester);

// Manual trigger for updating expired semesters
router.post('/update-expired', semesterController.autoUpdateExpiredSemesters);

module.exports = router;