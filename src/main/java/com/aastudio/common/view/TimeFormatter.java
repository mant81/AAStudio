package com.aastudio.common.view;

import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Date;

@Component("time")
public class TimeFormatter {
    private static final DateTimeFormatter OUTPUT_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public String format(Object value) {
        if (value == null) {
            return "-";
        }
        if (value instanceof LocalDateTime localDateTime) {
            return OUTPUT_FORMAT.format(localDateTime);
        }
        if (value instanceof LocalDate localDate) {
            return OUTPUT_FORMAT.format(localDate.atStartOfDay());
        }
        if (value instanceof Timestamp timestamp) {
            return OUTPUT_FORMAT.format(timestamp.toLocalDateTime());
        }
        if (value instanceof Date date) {
            return formatInstant(date.toInstant());
        }
        if (value instanceof Number number) {
            long epoch = number.longValue();
            if (Math.abs(epoch) < 100_000_000_000L) {
                epoch *= 1_000L;
            }
            return formatInstant(Instant.ofEpochMilli(epoch));
        }

        String text = value.toString().trim();
        if (text.isEmpty()) {
            return "-";
        }
        try {
            return OUTPUT_FORMAT.format(Timestamp.valueOf(text).toLocalDateTime());
        } catch (IllegalArgumentException ignored) {
            try {
                return OUTPUT_FORMAT.format(LocalDateTime.parse(text));
            } catch (DateTimeParseException ignoredAgain) {
                return text;
            }
        }
    }

    private String formatInstant(Instant instant) {
        return OUTPUT_FORMAT.format(LocalDateTime.ofInstant(instant, ZoneId.systemDefault()));
    }
}
