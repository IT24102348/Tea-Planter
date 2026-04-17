package online.jayashan.teaplanter.service;

import online.jayashan.teaplanter.entity.InventoryItem;
import online.jayashan.teaplanter.entity.StockEntry;
import online.jayashan.teaplanter.repository.InventoryRepository;
import online.jayashan.teaplanter.repository.StockEntryRepository;
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
class InventoryServiceTest {

    @Mock
    private InventoryRepository inventoryRepository;

    @Mock
    private StockEntryRepository stockEntryRepository;

    @InjectMocks
    private InventoryService inventoryService;

    @Test
    @DisplayName("[INV-01] Should increase stock on PURCHASE entry")
    void recordStockEntry_Purchase() {
        InventoryItem item = InventoryItem.builder().id(1L).currentStock(100.0).build();
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(item));
        when(stockEntryRepository.save(any(StockEntry.class))).thenAnswer(i -> i.getArguments()[0]);

        inventoryService.recordStockEntry(1L, 50.0, 10.0, "PURCHASE");

        assertEquals(150.0, item.getCurrentStock());
        verify(inventoryRepository, times(1)).save(item);
    }

    @Test
    @DisplayName("[INV-02] Should decrease stock on USAGE entry")
    void recordStockEntry_Usage() {
        InventoryItem item = InventoryItem.builder().id(1L).currentStock(100.0).build();
        when(inventoryRepository.findById(1L)).thenReturn(Optional.of(item));
        when(stockEntryRepository.save(any(StockEntry.class))).thenAnswer(i -> i.getArguments()[0]);

        inventoryService.recordStockEntry(1L, 30.0, null, "USAGE");

        assertEquals(70.0, item.getCurrentStock());
    }

    @Test
    @DisplayName("[INV-03] Should throw exception if item not found for stock entry")
    void recordStockEntry_NotFound() {
        when(inventoryRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> inventoryService.recordStockEntry(99L, 10.0, 1.0, "PURCHASE"));
    }
}
