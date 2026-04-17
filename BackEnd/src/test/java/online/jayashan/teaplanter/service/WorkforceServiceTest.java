package online.jayashan.teaplanter.service;

import online.jayashan.teaplanter.entity.Attendance;
import online.jayashan.teaplanter.entity.Plantation;
import online.jayashan.teaplanter.entity.User;
import online.jayashan.teaplanter.entity.Worker;
import online.jayashan.teaplanter.repository.AttendanceRepository;
import online.jayashan.teaplanter.repository.WorkerRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkforceServiceTest {

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @InjectMocks
    private WorkforceService workforceService;

    @Test
    @DisplayName("[HR-01] Should generate a new QR code if one doesn't exist")
    void generateQrCode_NewCode() {
        Worker worker = new Worker();
        worker.setId(1L);
        worker.setQrCode(null);

        when(workerRepository.findById(1L)).thenReturn(Optional.of(worker));
        when(workerRepository.save(any(Worker.class))).thenAnswer(i -> i.getArguments()[0]);

        Worker updated = workforceService.generateQrCode(1L);

        assertNotNull(updated.getQrCode());
        assertTrue(updated.getQrCode().startsWith("TP-WORKER-1-"));
        verify(workerRepository, times(1)).save(any(Worker.class));
    }

    @Test
    @DisplayName("[HR-02] Should throw exception if QR scan is from wrong plantation")
    void markAttendanceByQr_WrongPlantation() {
        Plantation p1 = Plantation.builder().id(1L).build();
        Plantation p2 = Plantation.builder().id(2L).build();
        User user = User.builder().name("Test User").build();
        Worker worker = Worker.builder().id(10L).user(user).plantation(p1).build();

        when(workerRepository.findByQrCode("MOCK_QR")).thenReturn(Optional.of(worker));

        Exception exception = assertThrows(RuntimeException.class, () -> {
            workforceService.markAttendanceByQr("MOCK_QR", 2L); // Scanning at Plantation 2
        });

        assertEquals("Worker does not belong to this plantation.", exception.getMessage());
    }

    @Test
    @DisplayName("[HR-03] Should create new attendance record on first scan (Check-in)")
    void markAttendanceByQr_SuccessCheckIn() {
        Plantation p1 = Plantation.builder().id(1L).build();
        User user = User.builder().name("Test User").build();
        Worker worker = Worker.builder().id(10L).user(user).plantation(p1).build();

        when(workerRepository.findByQrCode("MOCK_QR")).thenReturn(Optional.of(worker));
        when(attendanceRepository.findByWorkerAndCheckInBetween(any(), any(), any())).thenReturn(java.util.List.of());
        when(attendanceRepository.save(any(Attendance.class))).thenAnswer(i -> i.getArguments()[0]);

        Attendance result = workforceService.markAttendanceByQr("MOCK_QR", 1L);

        assertNotNull(result);
        assertEquals("Present", result.getStatus());
        assertNotNull(result.getCheckIn());
        assertNull(result.getCheckOut());
    }
}
