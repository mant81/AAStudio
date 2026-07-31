class ProjectController {
    @GetMapping("/api/projects")
    void list() {}
    @PostMapping(value = "/api/projects")
    void create() {}
}
