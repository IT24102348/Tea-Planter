package online.jayashan.teaplanter.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PayrollTest {

    @Test
    @DisplayName("Should calculate net pay correctly with basic wage, bonuses, and deductions")
    void calculateNetPay_BaseCase() {
        Payroll payroll = Payroll.builder()
                .basicWage(50000.0)
                .bonuses(5000.0)
                .deductions(2000.0)
                .build();

        payroll.calculateNetPay();

        assertEquals(53000.0, payroll.getNetPay(), "Net pay should be Basic + Bonuses - Deductions");
    }

    @Test
    @DisplayName("Should handle null values by treating them as 0.0")
    void calculateNetPay_WithNulls() {
        Payroll payroll = new Payroll();
        payroll.setBasicWage(40000.0);
        // bonuses and deductions are null

        payroll.calculateNetPay();

        assertEquals(40000.0, payroll.getNetPay(), "Net pay should handle null components as 0.0");
    }

    @Test
    @DisplayName("Should allow net pay to be negative if deductions exceed earnings")
    void calculateNetPay_NegativeResult() {
        Payroll payroll = Payroll.builder()
                .basicWage(1000.0)
                .bonuses(0.0)
                .deductions(1500.0)
                .build();

        payroll.calculateNetPay();

        assertEquals(-500.0, payroll.getNetPay(), "Net pay can be negative if deductions are high");
    }
}
