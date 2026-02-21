package online.jayashan.teaplanter.controller;

import lombok.RequiredArgsConstructor;
import online.jayashan.teaplanter.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;

    @PutMapping("/pin")
    public void updatePin(@RequestParam String clerkId, @RequestParam String pin) {
        userService.updatePin(clerkId, pin);
    }

    @PutMapping("/profile")
    public online.jayashan.teaplanter.entity.User updateProfile(@RequestParam String clerkId,
            @RequestBody online.jayashan.teaplanter.entity.User profile) {
        return userService.updateProfile(clerkId, profile);
    }

    @GetMapping("/me")
    public online.jayashan.teaplanter.entity.User getMe(@RequestParam String clerkId) {
        return userService.getUserByClerkId(clerkId);
    }
}
