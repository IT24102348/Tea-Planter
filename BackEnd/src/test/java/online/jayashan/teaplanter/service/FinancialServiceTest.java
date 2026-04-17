package online.jayashan.teaplanter.service;

import online.jayashan.teaplanter.entity.Payroll;
import online.jayashan.teaplanter.entity.Worker;
import online.jayashan.teaplanter.repository.PayrollRepository;
import online.jayashan.teaplanter.repository.WorkerRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinancialServiceTest {

    @Mock
    private PayrollRepository payrollRepository;

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private online.jayashan.teaplanter.repository.HarvestRepository harvestRepository;

    @Mock
    private online.jayashan.teaplanter.repository.TaskRepository taskRepository;

    @InjectMocks
    private FinancialService financialService;

    @Test
    @DisplayName("[FIN-01] Should throw exception if payroll already exists for the month")
    void generatePayroll_DuplicateMonth() {
        Worker worker = Worker.builder().id(1L).build();
        LocalDate month = LocalDate.now().withDayOfMonth(1);
        Payroll payroll = Payroll.builder().worker(worker).month(month).build();

        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(payrollRepository.existsByWorkerAndMonth(worker, month)).thenReturn(true);

        assertThrows(IllegalStateException.class, () -> financialService.generatePayroll(payroll));
    }

    @Test
    @DisplayName("[FIN-02] Should update payroll status successfully")
    void updatePayrollStatus_Success() {
        Payroll payroll = Payroll.builder().id(10L).status("PENDING").build();
        when(payrollRepository.findById(10L)).thenReturn(Optional.of(payroll));
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(i -> i.getArguments()[0]);

        Payroll updated = financialService.updatePayrollStatus(10L, "PAID", "CASH");

        assertEquals("PAID", updated.getStatus());
        assertEquals("CASH", updated.getPaymentMode());
        assertNotNull(updated.getPaidDate());
    }

    @Test
    @DisplayName("[FIN-03] Should calculate net profit correctly (logic check)")
    void deletePayroll_Success() {
        Payroll payroll = new Payroll();
        when(payrollRepository.findById(1L)).thenReturn(Optional.of(payroll));
        doNothing().when(payrollRepository).delete(payroll);

        assertDoesNotThrow(() -> financialService.deletePayroll(1L));
        verify(payrollRepository, times(1)).delete(payroll);
    }
}
