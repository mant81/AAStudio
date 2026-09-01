package com.aastudio.core.dashboard.mapper;

import java.util.List;
import java.util.Map;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DashboardMapper {

    List<Map<String, Object>> selectMetricCards();

    List<Map<String, Object>> selectActivityLogs();

    List<Map<String, Object>> selectQuickActions();

    List<Map<String, Object>> selectStatusItems();

    List<Map<String, Object>> selectTeamMembers();

    Map<String, Object> selectProfile();
}
