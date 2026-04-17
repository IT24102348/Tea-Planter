package online.jayashan.teaplanter.service;

import online.jayashan.teaplanter.entity.Task;
import online.jayashan.teaplanter.entity.Worker;
import online.jayashan.teaplanter.repository.TaskRepository;
import online.jayashan.teaplanter.repository.WorkerRepository;
import online.jayashan.teaplanter.repository.TaskRateRepository;
import online.jayashan.teaplanter.repository.PlantationRepository;
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
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private WorkerRepository workerRepository;

    @Mock
    private TaskRateRepository taskRateRepository;

    @Mock
    private PlantationRepository plantationRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private TaskService taskService;

    @Test
    @DisplayName("[OPS-01] Should correctly update task status to COMPLETED")
    void updateTaskStatus_Completed() {
        Task task = Task.builder().id(1L).status("ASSIGNED").taskCategory("PRUNING").build();
        when(taskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(taskRateRepository.findByCategory("PRUNING")).thenReturn(Optional.of(online.jayashan.teaplanter.entity.TaskRate.builder().rate(500.0).build()));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> i.getArguments()[0]);

        Task updated = taskService.updateTaskStatus(1L, "COMPLETED");

        assertEquals("COMPLETED", updated.getStatus());
        assertNotNull(updated.getCompletedAt());
        assertEquals(500.0, updated.getPaymentAmount());
    }

    @Test
    @DisplayName("[OPS-02] Should throw exception if task not found")
    void updateTaskStatus_NotFound() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> taskService.updateTaskStatus(99L, "COMPLETED"));
    }

    @Test
    @DisplayName("[OPS-03] Should delete task successfully")
    void deleteTask_Success() {
        Task task = new Task();
        task.setId(10L);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        doNothing().when(taskRepository).delete(task);

        assertDoesNotThrow(() -> taskService.deleteTask(10L));
        verify(taskRepository, times(1)).delete(task);
    }
}
