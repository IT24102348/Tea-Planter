package online.jayashan.teaplanter.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class FactoryPaysheetTest {

    @Test
    @DisplayName("Should calculate gross and net amounts correctly")
    void calculateTotals_BaseCase() {
        FactoryPaysheet paysheet = FactoryPaysheet.builder()
                .totalWeight(1000.0)
                .pricePerKg(250.0)
                .transportDeduction(5000.0)
                .otherDeductions(2000.0)
                .build();

        paysheet.calculateTotals();

        assertEquals(250000.0, paysheet.getGrossAmount(), "Gross should be weight * price");
        assertEquals(243000.0, paysheet.getNetAmount(), "Net should be Gross - Deductions");
    }

    @Test
    @DisplayName("Should handle null weights and prices by treating them as 0.0")
    void calculateTotals_Nulls() {
        FactoryPaysheet paysheet = new FactoryPaysheet();
        // all values are null

        paysheet.calculateTotals();

        assertEquals(0.0, paysheet.getGrossAmount());
        assertEquals(0.0, paysheet.getNetAmount());
    }
}
