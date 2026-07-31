package com.aastudio.config;

import java.util.Locale;
import java.util.Map;
import org.apache.ibatis.reflection.MetaObject;
import org.apache.ibatis.reflection.wrapper.MapWrapper;
import org.apache.ibatis.reflection.wrapper.ObjectWrapper;
import org.apache.ibatis.reflection.wrapper.ObjectWrapperFactory;
import org.apache.ibatis.reflection.property.PropertyTokenizer;
import org.mybatis.spring.boot.autoconfigure.ConfigurationCustomizer;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan("com.aastudio.mapper")
public class MyBatisConfig {
    @Bean
    ConfigurationCustomizer mapKeyCustomizer() {
        return configuration -> configuration.setObjectWrapperFactory(new UppercaseMapWrapperFactory());
    }

    static class UppercaseMapWrapperFactory implements ObjectWrapperFactory {
        @Override
        public boolean hasWrapperFor(Object object) {
            return object instanceof Map<?, ?>;
        }

        @Override
        @SuppressWarnings("unchecked")
        public ObjectWrapper getWrapperFor(MetaObject metaObject, Object object) {
            return new UppercaseMapWrapper(metaObject, (Map<String, Object>) object);
        }
    }

    static class UppercaseMapWrapper extends MapWrapper {
        private final Map<String, Object> map;
        private final boolean normalizeWrites;

        UppercaseMapWrapper(MetaObject metaObject, Map<String, Object> map) {
            super(metaObject, map);
            this.map = map;
            this.normalizeWrites = map.isEmpty();
        }

        @Override
        public Object get(PropertyTokenizer property) {
            if (map.containsKey(property.getName())) return map.get(property.getName());
            String uppercase = property.getName().toUpperCase(Locale.ROOT);
            if (map.containsKey(uppercase)) return map.get(uppercase);
            return super.get(property);
        }

        @Override
        public void set(PropertyTokenizer property, Object value) {
            if (normalizeWrites && property.getChildren() == null) {
                map.put(property.getName().toUpperCase(Locale.ROOT), value);
                return;
            }
            super.set(property, value);
        }
    }
}
