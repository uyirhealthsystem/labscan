"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEarningsSummary = exports.uploadReport = void 0;
exports.createReport = createReport;
exports.getReports = getReports;
exports.getReportById = getReportById;
exports.getReportByAppointment = getReportByAppointment;
exports.updateReport = updateReport;
exports.deleteReport = deleteReport;
exports.createReportFile = createReportFile;
exports.getReportFiles = getReportFiles;
exports.getReportFileById = getReportFileById;
exports.updateReportFile = updateReportFile;
exports.deleteReportFile = deleteReportFile;
exports.createEarning = createEarning;
exports.getEarnings = getEarnings;
exports.getCollectorEarningsByUserId = getCollectorEarningsByUserId;
exports.getEarningById = getEarningById;
exports.getEarningByAppointment = getEarningByAppointment;
exports.updateEarning = updateEarning;
exports.deleteEarning = deleteEarning;
const prisma_service_1 = require("./prisma.service");
async function createReport(data) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: { appointmentId: data.appointmentId },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    if (appointment.appointmentType === "LAB" && !data.appointmentTestId) {
        throw new Error("appointmentTestId is required for LAB reports");
    }
    if (appointment.appointmentType === "SCAN" && data.appointmentTestId) {
        throw new Error("appointmentTestId must not be provided for SCAN reports");
    }
    if (data.appointmentTestId) {
        const appointmentTest = await prisma_service_1.prisma.appointmentTest.findUnique({
            where: { appointmentTestId: data.appointmentTestId },
        });
        if (!appointmentTest ||
            appointmentTest.appointmentId !== data.appointmentId) {
            throw new Error("Appointment test not found for this appointment");
        }
        const existingReport = await prisma_service_1.prisma.report.findUnique({
            where: { appointmentTestId: data.appointmentTestId },
        });
        if (existingReport) {
            throw new Error("A report already exists for this appointment test");
        }
    }
    else {
        const existingReport = await prisma_service_1.prisma.report.findFirst({
            where: {
                appointmentId: data.appointmentId,
                appointmentTestId: null,
            },
        });
        if (existingReport) {
            throw new Error("Report already exists for this appointment");
        }
    }
    return prisma_service_1.prisma.report.create({
        data: {
            appointmentId: data.appointmentId,
            appointmentTestId: data.appointmentTestId,
            status: data.status,
            reportNotes: data.reportNotes,
            uploadedAt: data.uploadedAt
                ? new Date(data.uploadedAt)
                : undefined,
            sentAt: data.sentAt ? new Date(data.sentAt) : undefined,
            notifyPatient: data.notifyPatient,
        },
        include: {
            appointment: true,
            appointmentTest: true,
            files: true,
        },
    });
}
async function getReports() {
    return prisma_service_1.prisma.report.findMany({
        include: {
            appointment: true,
            appointmentTest: true,
            files: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
// =========================================================
// UPLOAD REPORT
// =========================================================
const uploadReport = async (appointmentId, file, appointmentTestId) => {
    console.log("SERVICE uploadReport received:", {
        appointmentId,
        appointmentTestId,
        hasAppointmentTestId: Boolean(appointmentTestId),
    });
    console.log("UPLOAD SERVICE DEBUG:", {
        appointmentId,
        appointmentTestId,
        type: typeof appointmentTestId,
    });
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: { appointmentId },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    if (appointment.appointmentType === "LAB" && !appointmentTestId) {
        throw new Error("appointmentTestId is required for LAB reports");
    }
    if (appointment.appointmentType === "SCAN" && appointmentTestId) {
        throw new Error("appointmentTestId must not be provided for SCAN reports");
    }
    return prisma_service_1.prisma.$transaction(async (tx) => {
        let reportId;
        if (appointmentTestId) {
            const appointmentTest = await tx.appointmentTest.findUnique({
                where: { appointmentTestId },
            });
            if (!appointmentTest ||
                appointmentTest.appointmentId !== appointmentId) {
                throw new Error("Appointment test not found for this appointment");
            }
            if (appointmentTest.status === "COMPLETED") {
                throw new Error("This test is already completed");
            }
            const existingReport = await tx.report.findUnique({
                where: { appointmentTestId },
            });
            if (existingReport) {
                await tx.report.update({
                    where: { reportId: existingReport.reportId },
                    data: {
                        status: "UPLOADED",
                        uploadedAt: new Date(),
                    },
                });
                reportId = existingReport.reportId;
            }
            else {
                const newReport = await tx.report.create({
                    data: {
                        appointmentId,
                        appointmentTestId,
                        status: "UPLOADED",
                        uploadedAt: new Date(),
                    },
                });
                reportId = newReport.reportId;
            }
        }
        else {
            // SCAN reports remain linked to the appointment, not a lab test.
            const existingReport = await tx.report.findFirst({
                where: {
                    appointmentId,
                    appointmentTestId: null,
                },
            });
            if (existingReport) {
                await tx.report.update({
                    where: { reportId: existingReport.reportId },
                    data: {
                        status: "UPLOADED",
                        uploadedAt: new Date(),
                    },
                });
                reportId = existingReport.reportId;
            }
            else {
                const newReport = await tx.report.create({
                    data: {
                        appointmentId,
                        status: "UPLOADED",
                        uploadedAt: new Date(),
                    },
                });
                reportId = newReport.reportId;
            }
        }
        const reportFile = await tx.reportFile.create({
            data: {
                reportId,
                fileName: file.originalname,
                fileUrl: `reports/${file.filename}`,
                fileType: file.mimetype,
                fileSize: file.size,
            },
        });
        // Complete only the test whose report was uploaded.
        if (appointmentTestId) {
            await tx.appointmentTest.update({
                where: { appointmentTestId },
                data: { status: "COMPLETED" },
            });
        }
        const report = await tx.report.findUniqueOrThrow({
            where: { reportId },
            include: {
                appointment: true,
                appointmentTest: true,
                files: true,
            },
        });
        return {
            report,
            file: reportFile,
        };
    });
};
exports.uploadReport = uploadReport;
// =========================================================
// GET REPORT
// =========================================================
async function getReportById(reportId) {
    const report = await prisma_service_1.prisma.report.findUnique({
        where: { reportId },
        include: {
            appointment: true,
            appointmentTest: true,
            files: true,
        },
    });
    if (!report) {
        throw new Error("Report not found");
    }
    return report;
}
async function getReportByAppointment(appointmentId) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: { appointmentId },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    // An appointment can now have multiple reports.
    return prisma_service_1.prisma.report.findMany({
        where: { appointmentId },
        include: {
            appointment: true,
            appointmentTest: true,
            files: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
// =========================================================
// UPDATE REPORT
// =========================================================
async function updateReport(reportId, data) {
    const existingReport = await prisma_service_1.prisma.report.findUnique({
        where: { reportId },
    });
    if (!existingReport) {
        throw new Error("Report not found");
    }
    return prisma_service_1.prisma.report.update({
        where: { reportId },
        data: {
            status: data.status,
            reportNotes: data.reportNotes,
            uploadedAt: data.uploadedAt
                ? new Date(data.uploadedAt)
                : undefined,
            sentAt: data.sentAt ? new Date(data.sentAt) : undefined,
            notifyPatient: data.notifyPatient,
        },
        include: {
            appointment: true,
            appointmentTest: true,
            files: true,
        },
    });
}
async function deleteReport(reportId) {
    const existingReport = await prisma_service_1.prisma.report.findUnique({
        where: { reportId },
    });
    if (!existingReport) {
        throw new Error("Report not found");
    }
    return prisma_service_1.prisma.report.delete({
        where: { reportId },
    });
}
async function createReportFile(data) {
    const report = await prisma_service_1.prisma.report.findUnique({
        where: { reportId: data.reportId },
    });
    if (!report) {
        throw new Error("Report not found");
    }
    return prisma_service_1.prisma.reportFile.create({
        data: {
            reportId: data.reportId,
            fileName: data.fileName,
            fileUrl: data.fileUrl,
            fileType: data.fileType,
            fileSize: data.fileSize,
        },
    });
}
async function getReportFiles(reportId) {
    const report = await prisma_service_1.prisma.report.findUnique({
        where: { reportId },
    });
    if (!report) {
        throw new Error("Report not found");
    }
    return prisma_service_1.prisma.reportFile.findMany({
        where: { reportId },
        orderBy: {
            uploadedAt: "desc",
        },
    });
}
async function getReportFileById(reportFileId) {
    const reportFile = await prisma_service_1.prisma.reportFile.findUnique({
        where: { reportFileId },
        include: {
            report: true,
        },
    });
    if (!reportFile) {
        throw new Error("Report file not found");
    }
    return reportFile;
}
async function updateReportFile(reportFileId, data) {
    const existingFile = await prisma_service_1.prisma.reportFile.findUnique({
        where: { reportFileId },
    });
    if (!existingFile) {
        throw new Error("Report file not found");
    }
    return prisma_service_1.prisma.reportFile.update({
        where: { reportFileId },
        data,
    });
}
async function deleteReportFile(reportFileId) {
    const existingFile = await prisma_service_1.prisma.reportFile.findUnique({
        where: { reportFileId },
    });
    if (!existingFile) {
        throw new Error("Report file not found");
    }
    return prisma_service_1.prisma.reportFile.delete({
        where: { reportFileId },
    });
}
async function createEarning(data) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: { appointmentId: data.appointmentId },
        include: {
            homeCollection: {
                include: {
                    collectorAssignment: true,
                },
            },
        },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    const existingEarning = await prisma_service_1.prisma.earning.findUnique({
        where: { appointmentId: data.appointmentId },
    });
    if (existingEarning) {
        throw new Error("Earning already exists for this appointment");
    }
    return prisma_service_1.prisma.earning.create({
        data: {
            appointmentId: data.appointmentId,
            collectorId: data.collectorId ??
                appointment.homeCollection?.collectorAssignment?.collectorId ??
                null,
            amount: data.amount,
            status: data.status,
            earnedAt: data.earnedAt
                ? new Date(data.earnedAt)
                : undefined,
        },
        include: {
            appointment: true,
        },
    });
}
async function getEarnings() {
    return prisma_service_1.prisma.earning.findMany({
        include: {
            appointment: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}
const getEarningsSummary = async () => {
    const earnings = await prisma_service_1.prisma.earning.findMany({
        select: {
            amount: true,
            status: true,
        },
    });
    let totalEarnings = 0;
    let completedEarnings = 0;
    let pendingEarnings = 0;
    for (const earning of earnings) {
        const amount = Number(earning.amount);
        totalEarnings += amount;
        if (earning.status === "PENDING") {
            pendingEarnings += amount;
        }
        if (earning.status === "EARNED" ||
            earning.status === "PAID") {
            completedEarnings += amount;
        }
    }
    return {
        totalEarnings,
        completedEarnings,
        pendingEarnings,
    };
};
exports.getEarningsSummary = getEarningsSummary;
async function getCollectorEarningsByUserId(userId) {
    const collector = await prisma_service_1.prisma.collector.findUnique({
        where: { userId },
        select: {
            collectorId: true,
            name: true,
            collectorType: true,
        },
    });
    if (!collector) {
        throw new Error("Collector profile not found");
    }
    const earnings = await prisma_service_1.prisma.earning.findMany({
        where: { collectorId: collector.collectorId },
        include: {
            appointment: true,
        },
        orderBy: { createdAt: "desc" },
    });
    const total = earnings.reduce((sum, earning) => sum + Number(earning.amount), 0);
    const completed = earnings
        .filter((earning) => earning.status === "EARNED" || earning.status === "PAID")
        .reduce((sum, earning) => sum + Number(earning.amount), 0);
    const pending = earnings
        .filter((earning) => earning.status === "PENDING")
        .reduce((sum, earning) => sum + Number(earning.amount), 0);
    return {
        collector,
        total,
        completed,
        pending,
        earnings,
    };
}
async function getEarningById(earningId) {
    const earning = await prisma_service_1.prisma.earning.findUnique({
        where: { earningId },
        include: {
            appointment: true,
        },
    });
    if (!earning) {
        throw new Error("Earning not found");
    }
    return earning;
}
async function getEarningByAppointment(appointmentId) {
    const appointment = await prisma_service_1.prisma.appointment.findUnique({
        where: { appointmentId },
    });
    if (!appointment) {
        throw new Error("Appointment not found");
    }
    const earning = await prisma_service_1.prisma.earning.findUnique({
        where: { appointmentId },
        include: {
            appointment: true,
        },
    });
    if (!earning) {
        throw new Error("Earning not found");
    }
    return earning;
}
async function updateEarning(earningId, data) {
    const existingEarning = await prisma_service_1.prisma.earning.findUnique({
        where: { earningId },
    });
    if (!existingEarning) {
        throw new Error("Earning not found");
    }
    return prisma_service_1.prisma.earning.update({
        where: { earningId },
        data: {
            amount: data.amount,
            status: data.status,
            earnedAt: data.earnedAt
                ? new Date(data.earnedAt)
                : undefined,
        },
    });
}
async function deleteEarning(earningId) {
    const existingEarning = await prisma_service_1.prisma.earning.findUnique({
        where: { earningId },
    });
    if (!existingEarning) {
        throw new Error("Earning not found");
    }
    return prisma_service_1.prisma.earning.delete({
        where: { earningId },
    });
}
//# sourceMappingURL=report.service.js.map