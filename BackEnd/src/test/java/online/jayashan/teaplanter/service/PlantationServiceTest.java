package online.jayashan.teaplanter.service;

import online.jayashan.teaplanter.entity.Plantation;
import online.jayashan.teaplanter.entity.User;
import online.jayashan.teaplanter.repository.PlantationRepository;
import online.jayashan.teaplanter.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PlantationServiceTest {

    @Mock
    private PlantationRepository plantationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClerkService clerkService;

    @InjectMocks
    private PlantationService plantationService;

    @Test
    @DisplayName("[PLT-01] Should validate administrative PIN correctly")
    void validatePlantationPin_Success() {
        ReflectionTestUtils.setField(plantationService, "requiredCreationPin", "1234");
        assertDoesNotThrow(() -> plantationService.validatePlantationPin("1234"));
    }

    @Test
    @DisplayName("[PLT-02] Should throw error on invalid PIN")
    void validatePlantationPin_Failure() {
        ReflectionTestUtils.setField(plantationService, "requiredCreationPin", "1234");
        assertThrows(RuntimeException.class, () -> plantationService.validatePlantationPin("0000"));
    }

    @Test
    @DisplayName("[PLT-03] Should find plantation by Clerk ID")
    void getPlantationByClerkId_Success() {
        Plantation plantation = new Plantation();
        plantation.setId(100L);
        User user = User.builder().plantation(plantation).build();

        when(userRepository.findByClerkId("user_123")).thenReturn(Optional.of(user));

        Plantation result = plantationService.getPlantationByClerkId("user_123");

        assertNotNull(result);
        assertEquals(100L, result.getId());
    }
}
