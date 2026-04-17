package online.jayashan.teaplanter.controller;

import online.jayashan.teaplanter.entity.Worker;
import online.jayashan.teaplanter.service.WorkforceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkerControllerTest {

    @Mock
    private WorkforceService workforceService;

    @InjectMocks
    private WorkerController workerController;

    @Test
    @DisplayName("[HR-04] Should return list of workers from controller")
    void getAllWorkers_Success() {
        Worker worker = new Worker();
        worker.setId(1L);
        when(workforceService.getAllWorkers(10L)).thenReturn(Collections.singletonList(worker));

        ResponseEntity<List<Worker>> response = workerController.getAllWorkers(10L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertFalse(response.getBody().isEmpty());
        assertEquals(1, response.getBody().size());
    }

    @Test
    @DisplayName("[HR-05] Should return single worker by ID")
    void getWorkerById_Success() {
        Worker worker = new Worker();
        worker.setId(5L);
        when(workforceService.getWorkerById(5L)).thenReturn(worker);

        ResponseEntity<Worker> response = workerController.getWorkerById(5L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(5L, response.getBody().getId());
    }

    @Test
    @DisplayName("[HR-06] Should deactivate worker and return OK")
    void deactivateWorker_Success() {
        doNothing().when(workforceService).deactivateWorker(1L);

        ResponseEntity<Void> response = workerController.deactivateWorker(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(workforceService, times(1)).deactivateWorker(1L);
    }
}
