package online.jayashan.teaplanter.controller;

import online.jayashan.teaplanter.entity.InventoryItem;
import online.jayashan.teaplanter.entity.StockEntry;
import online.jayashan.teaplanter.service.InventoryService;
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
class InventoryControllerTest {

    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private InventoryController inventoryController;

    @Test
    @DisplayName("[INV-04] Should return inventory items via API")
    void getAllItems_Success() {
        InventoryItem item = new InventoryItem();
        item.setName("Fertilizer");
        when(inventoryService.getAllItems(1L)).thenReturn(Collections.singletonList(item));

        ResponseEntity<List<InventoryItem>> response = inventoryController.getAllItems(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Fertilizer", response.getBody().get(0).getName());
    }

    @Test
    @DisplayName("[INV-05] Should record stock entry via API")
    void recordStockEntry_Success() {
        StockEntry entry = new StockEntry();
        entry.setQuantity(10.0);
        when(inventoryService.recordStockEntry(1L, 10.0, 500.0, "PURCHASE")).thenReturn(entry);

        ResponseEntity<StockEntry> response = inventoryController.recordStockEntry(1L, 10.0, 500.0, "PURCHASE");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(10.0, response.getBody().getQuantity());
    }

    @Test
    @DisplayName("[INV-06] Should delete item via API")
    void deleteItem_Success() {
        doNothing().when(inventoryService).deleteItem(1L);

        ResponseEntity<Void> response = inventoryController.deleteItem(1L);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(inventoryService, times(1)).deleteItem(1L);
    }
}
