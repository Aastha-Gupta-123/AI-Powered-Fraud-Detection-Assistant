-- AI Fraud Detection System - Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS fraud_detection_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fraud_detection_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150),
    role ENUM('admin', 'analyst', 'investigator', 'viewer') DEFAULT 'analyst',
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    account_number VARCHAR(20) NOT NULL,
    customer_name VARCHAR(150),
    amount FLOAT NOT NULL,
    transaction_type ENUM('debit', 'credit', 'transfer', 'withdrawal', 'deposit'),
    merchant_name VARCHAR(150),
    merchant_category VARCHAR(100),
    location VARCHAR(200),
    ip_address VARCHAR(45),
    device_type VARCHAR(50),
    channel ENUM('online', 'atm', 'branch', 'mobile', 'pos'),
    status ENUM('completed', 'pending', 'failed', 'reversed') DEFAULT 'completed',
    is_fraud BOOLEAN DEFAULT FALSE,
    fraud_score FLOAT DEFAULT 0.0,
    risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
    flagged_for_review BOOLEAN DEFAULT FALSE,
    transaction_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_is_fraud (is_fraud),
    INDEX idx_risk_level (risk_level),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_account_number (account_number)
);

CREATE TABLE investigations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(30) UNIQUE NOT NULL,
    transaction_id INT NOT NULL,
    investigator_id INT,
    status ENUM('open', 'in_progress', 'resolved', 'escalated', 'closed') DEFAULT 'open',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    title VARCHAR(200),
    description TEXT,
    fraud_explanation TEXT,
    investigator_remarks TEXT,
    resolution TEXT,
    is_confirmed_fraud BOOLEAN,
    assigned_at DATETIME,
    resolved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id),
    FOREIGN KEY (investigator_id) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
);

CREATE TABLE case_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    investigation_id INT NOT NULL,
    author_id INT,
    note_text TEXT NOT NULL,
    note_type ENUM('comment', 'action', 'evidence', 'escalation') DEFAULT 'comment',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investigation_id) REFERENCES investigations(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    report_id VARCHAR(30) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    report_type ENUM('fraud_summary', 'transaction_audit', 'investigation_report', 'risk_assessment'),
    generated_by INT,
    file_path VARCHAR(300),
    parameters JSON,
    status ENUM('generating', 'ready', 'failed') DEFAULT 'generating',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id)
);
