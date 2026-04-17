package online.jayashan.teaplanter.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class HarvestTest {

    @Test
    @DisplayName("Should subtract tare weight from gross weight")
    void calculateNetWeight_BaseCase() {
        Harvest harvest = Harvest.builder()
                .grossWeight(50.5)
                .tareWeight(2.5)
                .build();

        harvest.calculateNetWeight();

        assertEquals(48.0, harvest.getNetWeight(), "Net weight should be gross - tare");
    }

    @Test
    @DisplayName("Should handle 0 tare weight")
    void calculateNetWeight_NoTare() {
        Harvest harvest = Harvest.builder()
                .grossWeight(100.0)
                .tareWeight(0.0)
                .build();

        harvest.calculateNetWeight();

        assertEquals(100.0, harvest.getNetWeight());
    }
}
