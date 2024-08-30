CREATE DATABASE IF NOT EXISTS water_gas_meter;

USE water_gas_meter;

CREATE TABLE IF NOT EXISTS measures (
    measure_uuid VARCHAR(36) NOT NULL,
    customer_code VARCHAR(50) NOT NULL,
    measure_datetime DATETIME NOT NULL,
    measure_type ENUM('WATER', 'GAS') NOT NULL,
    has_confirmed VARCHAR(5) NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    measure_value INT NOT NULL,
    PRIMARY KEY (measure_uuid)
);