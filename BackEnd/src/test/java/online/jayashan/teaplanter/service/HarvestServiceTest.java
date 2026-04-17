package online.jayashan.teaplanter.service;

import online.jayashan.teaplanter.entity.Harvest;
import online.jayashan.teaplanter.entity.Plantation;
import online.jayashan.teaplanter.repository.HarvestRepository;
import online.jayashan.teaplanter.repository.PlantationRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HarvestServiceTest {

    @Mock
    private HarvestRepository harvestRepository;

    @Mock
    private PlantationRepository plantationRepository;

    @InjectMocks
    private HarvestService harvestService;

    @Test
    @DisplayName("[HV-01] Should return all harvests for a plantation")
    void getAllHarvests_Success() {
        Plantation p = Plantation.builder().id(1L).build();
        Harvest h = Harvest.builder().id(101L).plantation(p).build();

        when(plantationRepository.findById(1L)).thenReturn(Optional.of(p));
        when(harvestRepository.findByPlantation(p)).thenReturn(Collections.singletonList(h));

        List<Harvest> results = harvestService.getAllHarvests(null, 1L);

        assertEquals(1, results.size());
        assertEquals(101L, results.get(0).getId());
    }

    @Test
    @DisplayName("[HV-02] Should throw error if plantation not found for harvests")
    void getAllHarvests_NotFound() {
        when(plantationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> harvestService.getAllHarvests(null, 99L));
    }

    @Test
    @DisplayName("[HV-03] Should delete harvest record success")
    void deleteHarvest_Success() {
        doNothing().when(harvestRepository).deleteById(1L);

        assertDoesNotThrow(() -> harvestService.deleteHarvest(1L));
        verify(harvestRepository, times(1)).deleteById(1L);
    }
}
