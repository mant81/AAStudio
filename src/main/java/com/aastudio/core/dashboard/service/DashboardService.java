package com.aastudio.core.dashboard.service;

import com.aastudio.core.dashboard.mapper.DashboardMapper;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class DashboardService {

    private final DashboardMapper dashboardMapper;

    public DashboardService(DashboardMapper dashboardMapper) {
        this.dashboardMapper = dashboardMapper;
    }

    public List<Map<String, Object>> getMetricCards() {
        return dashboardMapper.selectMetricCards();
    }

    public List<Map<String, Object>> getActivityLogs() {
        return dashboardMapper.selectActivityLogs();
    }

    public List<Map<String, Object>> getQuickActions() {
        return dashboardMapper.selectQuickActions();
    }

    public List<Map<String, Object>> getStatusItems() {
        return dashboardMapper.selectStatusItems();
    }

    public List<Map<String, Object>> getTeamMembers() {
        return dashboardMapper.selectTeamMembers();
    }

    public Map<String, Object> getProfile() {
        return dashboardMapper.selectProfile();
    }
}
