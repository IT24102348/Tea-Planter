package online.jayashan.teaplanter.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

class DomainEntityTest {

    @Nested
    @DisplayName("Attendance Entity Tests")
    class AttendanceTests {
        @Test
        void testBuilder() {
            LocalDateTime now = LocalDateTime.now();
            Attendance attendance = Attendance.builder()
                    .checkIn(now)
                    .status("Present")
                    .build();
            assertEquals(now, attendance.getCheckIn());
            assertEquals("Present", attendance.getStatus());
        }
    }

    @Nested
    @DisplayName("Factory Entity Tests")
    class FactoryTests {
        @Test
        void testData() {
            Factory factory = new Factory();
            factory.setName("Mountain View Factory");
            assertEquals("Mountain View Factory", factory.getName());
        }
    }

    @Nested
    @DisplayName("InventoryItem Entity Tests")
    class InventoryItemTests {
        @Test
        void testBuilder() {
            InventoryItem item = InventoryItem.builder()
                    .name("Urea Fertilizer")
                    .category("Chemical")
                    .currentStock(500.0)
                    .build();
            assertEquals("Urea Fertilizer", item.getName());
            assertEquals(500.0, item.getCurrentStock());
        }
    }

    @Nested
    @DisplayName("Leave Entity Tests")
    class LeaveTests {
        @Test
        void testDates() {
            LocalDate start = LocalDate.now();
            LocalDate end = start.plusDays(3);
            Leave leave = Leave.builder()
                    .startDate(start)
                    .endDate(end)
                    .status("PENDING")
                    .build();
            assertEquals(start, leave.getStartDate());
            assertEquals(end, leave.getEndDate());
        }
    }

    @Nested
    @DisplayName("Plantation Entity Tests")
    class PlantationTests {
        @Test
        void testData() {
            Plantation plantation = Plantation.builder().name("Estate Alpha").build();
            assertEquals("Estate Alpha", plantation.getName());
        }
    }

    @Nested
    @DisplayName("Plot Entity Tests")
    class PlotTests {
        @Test
        void testBuilder() {
            Plot plot = Plot.builder()
                    .blockId("B1-P05")
                    .acreage(5.5)
                    .status("Active")
                    .build();
            assertEquals("B1-P05", plot.getBlockId());
            assertEquals(5.5, plot.getAcreage());
        }
    }

    @Nested
    @DisplayName("Role Entity Tests")
    class RoleTests {
        @Test
        void testData() {
            Role role = new Role();
            role.setName("SUPERVISOR");
            assertEquals("SUPERVISOR", role.getName());
        }
    }

    @Nested
    @DisplayName("SoilTest Entity Tests")
    class SoilTestTests {
        @Test
        void testData() {
            SoilTest test = SoilTest.builder().pH(6.5).testDate(LocalDate.now()).build();
            assertEquals(6.5, test.getPH());
        }
    }

    @Nested
    @DisplayName("StockEntry Entity Tests")
    class StockEntryTests {
        @Test
        void testType() {
            StockEntry entry = StockEntry.builder().type("PURCHASE").quantity(100.0).build();
            assertEquals("PURCHASE", entry.getType());
        }
    }

    @Nested
    @DisplayName("Task Entity Tests")
    class TaskTests {
        @Test
        void testPriority() {
            Task task = Task.builder().title("Weeding").priority("HIGH").build();
            assertEquals("HIGH", task.getPriority());
        }
    }

    @Nested
    @DisplayName("TaskRate Entity Tests")
    class TaskRateTests {
        @Test
        void testRate() {
            TaskRate rate = TaskRate.builder().category("HARVESTING").rate(15.0).unit("PER_KG").build();
            assertEquals(15.0, rate.getRate());
        }
    }

    @Nested
    @DisplayName("TeaDelivery Entity Tests")
    class TeaDeliveryTests {
        @Test
        void testData() {
            TeaDelivery delivery = TeaDelivery.builder().quantity(1250.5).receiverName("John Factory Mgr").build();
            assertEquals(1250.5, delivery.getQuantity());
        }
    }

    @Nested
    @DisplayName("User Entity Tests")
    class UserTests {
        @Test
        void testData() {
            User user = User.builder().name("Kamal").email("kamal@example.com").clerkId("user_123").build();
            assertEquals("user_123", user.getClerkId());
        }
    }

    @Nested
    @DisplayName("Worker Entity Tests")
    class WorkerTests {
        @Test
        void testStatus() {
            Worker worker = Worker.builder().status("Active").workerFunctions("Harvester,Pruner").build();
            assertEquals("Active", worker.getStatus());
            assertTrue(worker.getWorkerFunctions().contains("Harvester"));
        }
    }

    @Nested
    @DisplayName("IncomeDate Entity Tests")
    class IncomeDateTests {
        @Test
        void testData() {
            IncomeDate date = new IncomeDate(5, 2026);
            assertEquals(5, date.getMonth());
            assertEquals(2026, date.getYear());
        }
    }
}
