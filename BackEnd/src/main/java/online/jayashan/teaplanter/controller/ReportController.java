package online.jayashan.teaplanter.controller;

import lombok.RequiredArgsConstructor;
import online.jayashan.teaplanter.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/harvest")
    public ResponseEntity<byte[]> getHarvestReport(
            @RequestParam Long plantationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        byte[] pdf = reportService.generateHarvestReport(plantationId, month);
        return createPdfResponse(pdf, "harvest_report_" + month.toString() + ".pdf");
    }

    @GetMapping("/payroll")
    public ResponseEntity<byte[]> getPayrollReport(
            @RequestParam Long plantationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        byte[] pdf = reportService.generatePayrollReport(plantationId, month);
        return createPdfResponse(pdf, "payroll_registry_" + month.toString() + ".pdf");
    }

    @GetMapping("/inventory")
    public ResponseEntity<byte[]> getInventoryReport(
            @RequestParam Long plantationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        byte[] pdf = reportService.generateInventoryReport(plantationId, month);
        return createPdfResponse(pdf, "inventory_report_" + month.toString() + ".pdf");
    }

    @GetMapping("/financial")
    public ResponseEntity<byte[]> getFinancialReport(
            @RequestParam Long plantationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        byte[] pdf = reportService.generateFinancialSummaryReport(plantationId, month);
        return createPdfResponse(pdf, "financial_summary_" + month.toString() + ".pdf");
    }

    @GetMapping("/income-analysis")
    public ResponseEntity<byte[]> getIncomeAnalysisReport(
            @RequestParam Long plantationId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        byte[] pdf = reportService.generateIncomeAnalysisReport(plantationId, month);
        return createPdfResponse(pdf, "income_analysis_" + month.toString() + ".pdf");
    }

    @GetMapping("/worker-personal")
    public ResponseEntity<byte[]> getWorkerPersonalReport(
            @RequestParam Long plantationId,
            @RequestHeader("X-User-Clerk-Id") String clerkId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate month) {

        byte[] pdf = reportService.generateWorkerPersonalReport(plantationId, clerkId, month);
        return createPdfResponse(pdf, "worker_report_" + month.toString() + ".pdf");
    }

    private ResponseEntity<byte[]> createPdfResponse(byte[] pdf, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(org.springframework.http.ContentDisposition.inline().filename(filename).build());
        headers.setContentLength(pdf.length);
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdf);
    }
}
