package online.jayashan.teaplanter.controller;

import online.jayashan.teaplanter.entity.Plantation;
import online.jayashan.teaplanter.service.PlantationService;
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
class PlantationControllerTest {

    @Mock
    private PlantationService plantationService;

    @InjectMocks
    private PlantationController plantationController;

    @Test
    @DisplayName("[PLT-04] Should return single plantation for user")
    void getPlantations_Success() {
        Plantation p = new Plantation();
        p.setName("Green Estate");
        when(plantationService.getPlantationByClerkId("user_123")).thenReturn(p);

        ResponseEntity<List<Plantation>> response = plantationController.getPlantations("user_123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
        assertEquals("Green Estate", response.getBody().get(0).getName());
    }

    @Test
    @DisplayName("[PLT-05] Should validate PIN via API")
    void validatePin_Success() {
        doNothing().when(plantationService).validatePlantationPin("1234");
        
        ResponseEntity<Void> response = plantationController.validatePin("1234");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(plantationService, times(1)).validatePlantationPin("1234");
    }

    @Test
    @DisplayName("[PLT-06] Should fail with 401 on invalid PIN")
    void validatePin_Failure() {
        doThrow(new RuntimeException("Invalid PIN")).when(plantationService).validatePlantationPin("0000");

        ResponseEntity<Void> response = plantationController.validatePin("0000");

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }
}
