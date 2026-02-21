package online.jayashan.teaplanter.controller;

import lombok.RequiredArgsConstructor;
import online.jayashan.teaplanter.entity.TaskRate;
import online.jayashan.teaplanter.repository.TaskRateRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/task-rates")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TaskRateController {

    private final TaskRateRepository taskRateRepository;
    private final online.jayashan.teaplanter.repository.PlantationRepository plantationRepository;

    @GetMapping
    public List<TaskRate> getAllRates(@RequestParam(required = false) Long plantationId) {
        if (plantationId != null) {
            online.jayashan.teaplanter.entity.Plantation plantation = plantationRepository.findById(plantationId)
                    .orElseThrow(() -> new RuntimeException("Plantation not found"));
            return taskRateRepository.findByPlantation(plantation);
        }
        return taskRateRepository.findAll();
    }

    @PostMapping
    public TaskRate createRate(@RequestBody TaskRate rate, @RequestParam(required = false) Long plantationId) {
        if (plantationId != null) {
            plantationRepository.findById(plantationId).ifPresent(rate::setPlantation);
        }
        return taskRateRepository.save(rate);
    }

    @PutMapping("/{id}")
    public TaskRate updateRate(@PathVariable Long id, @RequestBody TaskRate details) {
        TaskRate rate = taskRateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rate not found"));
        rate.setCategory(details.getCategory());
        rate.setRate(details.getRate());
        rate.setUnit(details.getUnit());
        rate.setDescription(details.getDescription());
        return taskRateRepository.save(rate);
    }

    @DeleteMapping("/{id}")
    public void deleteRate(@PathVariable Long id) {
        taskRateRepository.deleteById(id);
    }
}
