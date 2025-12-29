// src/routes/depRoutes.js
const express = require("express");
const router = express.Router();
const {
     getDep,
    createDep,
    updateDep,
    deleteDep ,
    updateHeadId,
    getRoomByDepartment,
    assignRoomTodepartment,
    removeRoomFromDepartment } = require("../controllers/depControllers");
router.get("/", getDep);
router.post("/", createDep);
router.put("/:id", updateDep);
router.put("/:id/head", updateHeadId);
router.get("/:departmentId/rooms", getRoomByDepartment);
router.delete("/:departmentId/rooms/:roomId", removeRoomFromDepartment); // Remove block from faculty

router.post("/:id/rooms", assignRoomTodepartment);
router.delete("/:id", deleteDep);


module.exports = router;