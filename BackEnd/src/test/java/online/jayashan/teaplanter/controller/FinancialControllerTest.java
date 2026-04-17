package online.jayashan.teaplanter.controller;

import online.jayashan.teaplanter.entity.Payroll;
import online.jayashan.teaplanter.service.FinancialService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinancialControllerTest {

    @Mock
    private FinancialService financialService;

    @InjectMocks
    private FinancialController financialController;

    @Test
    @DisplayName("[FIN-04] Should return payroll history via API")
    void getAllPayrolls_Success() {
        Payroll p = new Payroll();
        p.setBasicWage(25000.0);
        when(financialService.getAllPayrolls(null, 1L)).thenReturn(Collections.singletonList(p));

        List<Payroll> response = financialController.getAllPayrolls(null, 1L);

        assertNotNull(response);
        assertEquals(25000.0, response.get(0).getBasicWage());
    }

    @Test
    @DisplayName("[FIN-05] Should update status of a payroll thru API")
    void updateStatus_Success() {
        Payroll p = new Payroll();
        p.setStatus("PAID");
        when(financialService.updatePayrollStatus(1L, "PAID", "ONLINE")).thenReturn(p);

        Payroll response = financialController.updateStatus(1L, "PAID", "ONLINE");

        assertNotNull(response);
        assertEquals("PAID", response.getStatus());
        verify(financialService, times(1)).updatePayrollStatus(1L, "PAID", "ONLINE");
    }

    @Test
    @DisplayName("[FIN-06] Should preview payroll before generation via API")
    void getPayrollPreview_Success() {
        online.jayashan.teaplanter.dto.PayrollPreviewDTO preview = online.jayashan.teaplanter.dto.PayrollPreviewDTO.builder().totalEarnings(30000.0).build();
        when(financialService.getPayrollPreview(eq(1L), any())).thenReturn(preview);

        online.jayashan.teaplanter.dto.PayrollPreviewDTO response = financialController.getPayrollPreview(1L, "2024-03");

        assertNotNull(response);
        assertEquals(30000.0, response.getTotalEarnings());
    }
}
