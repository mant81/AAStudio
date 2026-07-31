package com.aastudio.config;

import javax.sql.DataSource;

import com.zaxxer.hikari.HikariDataSource;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
@EnableConfigurationProperties(DataSourceConfig.AppDataSourceProperties.class)
public class DataSourceConfig {

    @Bean
    @Primary
    public DataSource dataSource(AppDataSourceProperties properties) {
        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setPoolName(defaultString(properties.getPoolName(), "aastudioPool"));
        String driverClassName = defaultString(properties.getDriverClassName(), "org.sqlite.JDBC");
        dataSource.setDriverClassName(driverClassName);
        dataSource.setJdbcUrl(defaultString(properties.getJdbcUrl(), "jdbc:sqlite:./data/aastudio.sqlite3"));
        dataSource.setUsername(defaultString(properties.getUsername(), "sa"));
        dataSource.setPassword(defaultString(properties.getPassword(), ""));
        dataSource.setConnectionInitSql("PRAGMA foreign_keys=ON");

        if (properties.getHikari() != null) {
            AppDataSourceProperties.Hikari hikari = properties.getHikari();
            if (hikari.getConnectionTimeout() != null) {
                dataSource.setConnectionTimeout(hikari.getConnectionTimeout());
            }
            if (hikari.getIdleTimeout() != null) {
                dataSource.setIdleTimeout(hikari.getIdleTimeout());
            }
            if (hikari.getMaximumPoolSize() != null) {
                dataSource.setMaximumPoolSize(hikari.getMaximumPoolSize());
            }
            if (hikari.getMinimumIdle() != null) {
                dataSource.setMinimumIdle(hikari.getMinimumIdle());
            }
            if (hikari.getLeakDetectionThreshold() != null) {
                dataSource.setLeakDetectionThreshold(hikari.getLeakDetectionThreshold());
            }
        }

        return dataSource;
    }

    private String defaultString(String value, String fallback) {
        return value == null || value.trim().isEmpty() ? fallback : value.trim();
    }

    @ConfigurationProperties(prefix = "app.datasource")
    public static class AppDataSourceProperties {
        private String poolName;
        private String driverClassName;
        private String jdbcUrl;
        private String username;
        private String password;
        private Hikari hikari;

        public String getPoolName() {
            return poolName;
        }

        public void setPoolName(String poolName) {
            this.poolName = poolName;
        }

        public String getDriverClassName() {
            return driverClassName;
        }

        public void setDriverClassName(String driverClassName) {
            this.driverClassName = driverClassName;
        }

        public String getJdbcUrl() {
            return jdbcUrl;
        }

        public void setJdbcUrl(String jdbcUrl) {
            this.jdbcUrl = jdbcUrl;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public Hikari getHikari() {
            return hikari;
        }

        public void setHikari(Hikari hikari) {
            this.hikari = hikari;
        }

        public static class Hikari {
            private Long connectionTimeout;
            private Long idleTimeout;
            private Integer maximumPoolSize;
            private Integer minimumIdle;
            private Long leakDetectionThreshold;

            public Long getConnectionTimeout() {
                return connectionTimeout;
            }

            public void setConnectionTimeout(Long connectionTimeout) {
                this.connectionTimeout = connectionTimeout;
            }

            public Long getIdleTimeout() {
                return idleTimeout;
            }

            public void setIdleTimeout(Long idleTimeout) {
                this.idleTimeout = idleTimeout;
            }

            public Integer getMaximumPoolSize() {
                return maximumPoolSize;
            }

            public void setMaximumPoolSize(Integer maximumPoolSize) {
                this.maximumPoolSize = maximumPoolSize;
            }

            public Integer getMinimumIdle() {
                return minimumIdle;
            }

            public void setMinimumIdle(Integer minimumIdle) {
                this.minimumIdle = minimumIdle;
            }

            public Long getLeakDetectionThreshold() {
                return leakDetectionThreshold;
            }

            public void setLeakDetectionThreshold(Long leakDetectionThreshold) {
                this.leakDetectionThreshold = leakDetectionThreshold;
            }
        }
    }
}
