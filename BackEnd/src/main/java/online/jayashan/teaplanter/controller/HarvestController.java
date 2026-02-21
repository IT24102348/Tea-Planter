package online.jayashan.teaplanter.controller;

import lombok.RequiredArgsConstructor;
import online.jayashan.teaplanter.entity.Harvest;
import online.jayashan.teaplanter.service.HarvestService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/harvests")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HarvestController {

    private final HarvestService harvestService;

    @GetMapping
    public List<Harvest> getAllHarvests(@RequestParam(required = false) String month,
            @RequestParam(required = false) Long plantationId) {
        java.time.LocalDate date = (month != null) ? java.time.LocalDate.parse(month + "-01") : null;
        return harvestService.getAllHarvests(date, plantationId);
    }

    @PostMapping
    public Harvest recordHarvest(@RequestBody online.jayashan.teaplanter.dto.HarvestRequestDTO harvestRequest) {
        return harvestService.recordHarvest(harvestRequest);
    }

    @GetMapping("/worker/{workerId}")
    public List<Harvest> getByWorker(@PathVariable Long workerId) {
        return harvestService.getHarvestsByWorker(workerId);
    }

    @GetMapping("/plot/{plotId}")
    public List<Harvest> getByPlot(@PathVariable Long plotId) {
        return harvestService.getHarvestsByPlot(plotId);
    }

    @PutMapping("/{id}")
    public Harvest updateHarvest(@PathVariable Long id, @RequestBody Harvest harvest) {
        return harvestService.updateHarvest(id, harvest);
    }

    @DeleteMapping("/{id}")
    public void deleteHarvest(@PathVariable Long id) {
        harvestService.deleteHarvest(id);
    }
}
