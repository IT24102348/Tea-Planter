package online.jayashan.teaplanter.controller;

import online.jayashan.teaplanter.entity.Harvest;
import online.jayashan.teaplanter.service.HarvestService;
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
class HarvestControllerTest {

    @Mock
    private HarvestService harvestService;

    @InjectMocks
    private HarvestController harvestController;

    @Test
    @DisplayName("[HV-04] Should return harvests via API")
    void getAllHarvests_Success() {
        Harvest h = new Harvest();
        h.setGrossWeight(50.0);
        when(harvestService.getAllHarvests(null, 1L)).thenReturn(Collections.singletonList(h));

        ResponseEntity<List<Harvest>> response = harvestController.getAllHarvests(null, 1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(50.0, response.getBody().get(0).getGrossWeight());
    }

    @Test
    @DisplayName("[HV-05] Should return harvests for a worker via API")
    void getWorkerHarvests_Success() {
        Harvest h = new Harvest();
        h.setId(10L);
        when(harvestService.getHarvestsByWorker(1L)).thenReturn(Collections.singletonList(h));

        ResponseEntity<List<Harvest>> response = harvestController.getWorkerHarvests(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(10L, response.getBody().get(0).getId());
    }

    @Test
    @DisplayName("[HV-06] Should delete harvest via API")
    void deleteHarvest_Success() {
        doNothing().when(harvestService).deleteHarvest(100L);

        ResponseEntity<Void> response = harvestController.deleteHarvest(100L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(harvestService, times(1)).deleteHarvest(100L);
    }
}
