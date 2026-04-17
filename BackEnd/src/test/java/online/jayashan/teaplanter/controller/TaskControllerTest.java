package online.jayashan.teaplanter.controller;

import online.jayashan.teaplanter.entity.Task;
import online.jayashan.teaplanter.service.TaskService;
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
class TaskControllerTest {

    @Mock
    private TaskService taskService;

    @InjectMocks
    private TaskController taskController;

    @Test
    @DisplayName("[OPS-04] Should return tasks for a plantation")
    void getAllTasks_Success() {
        Task task = new Task();
        task.setTitle("Test Task");
        when(taskService.getAllTasks(null, 1L)).thenReturn(Collections.singletonList(task));

        ResponseEntity<List<Task>> response = taskController.getAllTasks(null, 1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals("Test Task", response.getBody().get(0).getTitle());
    }

    @Test
    @DisplayName("[OPS-05] Should return tasks for a specific worker")
    void getWorkerTasks_Success() {
        Task task = new Task();
        task.setId(101L);
        when(taskService.getTasksByWorker(5L)).thenReturn(Collections.singletonList(task));

        ResponseEntity<List<Task>> response = taskController.getWorkerTasks(5L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(101L, response.getBody().get(0).getId());
    }

    @Test
    @DisplayName("[OPS-06] Should update task status via API")
    void updateTaskStatus_Success() {
        Task task = new Task();
        task.setStatus("COMPLETED");
        when(taskService.updateTaskStatus(1L, "COMPLETED")).thenReturn(task);

        ResponseEntity<Task> response = taskController.updateTaskStatus(1L, "COMPLETED");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("COMPLETED", response.getBody().getStatus());
        verify(taskService, times(1)).updateTaskStatus(1L, "COMPLETED");
    }
}
