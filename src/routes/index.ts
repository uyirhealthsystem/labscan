import { Router } from 'express';
import labroute from "../routes/lab.route"
import scanroute from "../routes/scan.route"
import patientroute from "../routes/patient.route"
import equipmentRoutes from "../routes/equipment.route"
import appointmentRoutes from "../routes/appointment.route"
import appointmentlifecycleRoutes from "../routes/appointmentlifecycle.route"
import homeCollectionRoutes from "../routes/homecollection.route"
import reportRoutes from "../routes/report.route"
import sampleRoutes from "../routes/sample.route"
import labscanRoutes from "../routes/labscan.route"
import timeSlotRoutes from "../routes/timeslot.route"
import providerSettingRoutes from "../routes/providersetting.route"

const router = Router();


router.use('/',labroute);
router.use('/',scanroute);
router.use('/',patientroute)
router.use('/',equipmentRoutes);
router.use('/',appointmentRoutes);
router.use('/',appointmentlifecycleRoutes);
router.use('/',homeCollectionRoutes);
router.use('/',reportRoutes);
router.use('/',sampleRoutes);
router.use('/',labscanRoutes);
router.use('/',timeSlotRoutes);
router.use('/',providerSettingRoutes);

export default router;