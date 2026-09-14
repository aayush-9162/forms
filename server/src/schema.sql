-- Forms Portal database schema (MySQL 5.7+ / 8.0+)
-- Run against the database named in .env (DB_NAME).
-- All tables share: id, email, submitted_by_name, created_at.
-- Complex/nested answers (grids, file metadata arrays) are stored as JSON columns.

-- ---------------------------------------------------------------------------
-- Idempotency log — prevents duplicate submissions when the client retries
-- a request that the server actually processed (e.g. response was lost to a
-- network blip, or both the SW and the tab retried the same entry).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submission_idempotency (
  idempotency_key VARCHAR(64) NOT NULL,
  form_key VARCHAR(64) NOT NULL,
  form_row_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (idempotency_key, form_key)
);

-- ---------------------------------------------------------------------------
-- Cash Received (Arden + Waynesville share the same schema; two tables)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cash_received_arden (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  opening_cash DECIMAL(12,2),
  total_cash_received DECIMAL(12,2),
  total_check_received DECIMAL(12,2),
  total DECIMAL(12,2),
  closing_balance DECIMAL(12,2),
  ext_no VARCHAR(50),
  remarks TEXT
);

CREATE TABLE IF NOT EXISTS cash_received_wvl (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  opening_cash DECIMAL(12,2),
  total_cash_received DECIMAL(12,2),
  total_check_received DECIMAL(12,2),
  total DECIMAL(12,2),
  closing_balance DECIMAL(12,2),
  ext_no VARCHAR(50),
  remarks TEXT
);

-- ---------------------------------------------------------------------------
-- Managers Opening Checklist (Arden + Waynesville)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS managers_opening_checklist_arden (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  name VARCHAR(255),
  checklist JSON,
  comments TEXT,
  ext_no VARCHAR(50),
  prepared_for_sales_meeting VARCHAR(20),
  prepared_for_sales_meeting_describe TEXT,
  all_team_members_arrived VARCHAR(20),
  asked_for_quote_sheet VARCHAR(20),
  checklist_names JSON,
  open_sign_on_image JSON,
  assigned_work VARCHAR(20),
  assigned_work_describe TEXT
);

CREATE TABLE IF NOT EXISTS managers_opening_checklist_waynesville (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  name VARCHAR(255),
  checklist JSON,
  comments TEXT,
  ext_no VARCHAR(50),
  prepared_for_sales_meeting VARCHAR(20),
  prepared_for_sales_meeting_describe TEXT,
  all_team_members_arrived VARCHAR(20),
  asked_for_quote_sheet VARCHAR(20),
  checklist_names JSON,
  open_sign_on_image JSON,
  assigned_work VARCHAR(20),
  assigned_work_describe TEXT
);

-- ---------------------------------------------------------------------------
-- Managers Closing Checklist (Arden + Waynesville)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS managers_closing_checklist_arden (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  name VARCHAR(255),
  checklist JSON,
  scanned_checks_to_bank VARCHAR(20),
  sent_report_to_team_india VARCHAR(20),
  comment TEXT,
  talking_points TEXT,
  ext_no VARCHAR(50),
  birdeye_reviews_requested INT,
  dt_no_pickups_screenshot JSON
);

CREATE TABLE IF NOT EXISTS managers_closing_checklist_waynesville (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  name VARCHAR(255),
  checklist JSON,
  scanned_checks_to_bank VARCHAR(20),
  sent_report_to_team_india VARCHAR(20),
  comment TEXT,
  talking_points TEXT,
  ext_no VARCHAR(50),
  birdeye_reviews_requested INT,
  dt_no_pickups_screenshot JSON
);

-- ---------------------------------------------------------------------------
-- Warehouse Notification
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouse_notification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  originator VARCHAR(255),
  customer_name VARCHAR(255),
  sale_no VARCHAR(100),
  status VARCHAR(100),
  assembly_required VARCHAR(20),
  assembly_remark VARCHAR(255),
  comment TEXT
);

-- ---------------------------------------------------------------------------
-- Warehouse Opening Checklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouse_opening_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  person VARCHAR(50),
  pieces_in_route INT,
  stops_in_route INT,
  trucks_scheduled INT,
  manifest_checked VARCHAR(255),
  cods_confirmed VARCHAR(255),
  dt_rv_match VARCHAR(255),
  dt_notifications VARCHAR(255),
  prev_day_finished VARCHAR(255),
  return_items_report VARCHAR(100),
  email_voice_mail VARCHAR(50),
  today_items_confirmed VARCHAR(255),
  next_day_confirmed VARCHAR(255),
  ext_no VARCHAR(50),
  manifest_report_issues VARCHAR(20),
  manifest_issue_details TEXT,
  cods_file_no VARCHAR(255),
  dt_rv_explain TEXT,
  prev_day_screenshot JSON,
  return_items_count INT,
  email_voice_mail_count INT,
  email_voice_mail_explain TEXT,
  today_items_count INT,
  team_wearing_uniform VARCHAR(20),
  uniform_photo JSON,
  truck_loading_monitored VARCHAR(20),
  truck_loading_explain TEXT,
  truck_loading_photo JSON
);

-- ---------------------------------------------------------------------------
-- Warehouse Closing Checklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouse_closing_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  name VARCHAR(50),
  trucks_received VARCHAR(20),
  paperwork_completed VARCHAR(20),
  pieces_in_route INT,
  stops_in_route INT,
  trucks_scheduled VARCHAR(20),
  next_day_delivery VARCHAR(20),
  arden_pickup VARCHAR(20),
  waynesville_pickup VARCHAR(20),
  line_up JSON,
  line_up_comments TEXT,
  dispatch_track JSON,
  dispatch_track_comments TEXT,
  electronic_devices JSON,
  warehouse JSON,
  comments TEXT,
  time_clocked_out TIME
);

-- ---------------------------------------------------------------------------
-- Part Received
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS part_received (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  your_name VARCHAR(255),
  part_received TINYINT(1) DEFAULT 0,
  need_po TINYINT(1) DEFAULT 0,
  shipping_company VARCHAR(100),
  vendor VARCHAR(255),
  files JSON,
  comment TEXT
);

-- ---------------------------------------------------------------------------
-- Delivery Checklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delivery_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sale_number VARCHAR(100),
  pwr_check VARCHAR(20),
  clean_check VARCHAR(20),
  functionality VARCHAR(20),
  damage VARCHAR(20),
  all_parts VARCHAR(20),
  pwr_supply VARCHAR(20),
  stains VARCHAR(20),
  checked_by VARCHAR(255),
  attachment JSON,
  ready_for_delivery VARCHAR(20),
  remarks TEXT,
  damage_customer_name VARCHAR(255),
  damage_sales_number VARCHAR(100),
  damage_photo JSON,
  all_items_loaded VARCHAR(20),
  loading_area_photo JSON,
  all_parts_photo JSON
);

-- ---------------------------------------------------------------------------
-- Pre-Delivery Checklist
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pre_delivery_checklist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  items_ready VARCHAR(20),
  items_ready_exceptions TEXT,
  clean_status JSON,
  clean_exceptions TEXT,
  accessories_available VARCHAR(20),
  if_no_explain TEXT,
  accessories_exceptions TEXT,
  damages TEXT,
  exception_pics JSON,
  delivery_manager VARCHAR(255),
  warehouse_manager VARCHAR(255),
  power_supply_on_item VARCHAR(20),
  power_supply_status VARCHAR(50),
  bed_on_truck VARCHAR(20),
  rails_slats_checked VARCHAR(20),
  rails_slats_image JSON
);

-- ---------------------------------------------------------------------------
-- To Do List
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS to_do_list (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  your_name VARCHAR(255),
  task TEXT,
  ext_no VARCHAR(50),
  attachment JSON,
  remarks TEXT
);

-- ---------------------------------------------------------------------------
-- Hot Button / Status Call Alert
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hot_button_status_call_alert (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sales_person_name VARCHAR(255),
  concern_type VARCHAR(255),
  store VARCHAR(50),
  customer_name VARCHAR(255),
  sale_number VARCHAR(100),
  sale_date DATE,
  description TEXT,
  steps_taken TEXT
);

-- ---------------------------------------------------------------------------
-- Customer Service Request
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_service_request (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  submitted_by_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date DATE,
  your_name VARCHAR(255),
  notice_type VARCHAR(100),
  customer_name VARCHAR(255),
  phone VARCHAR(50),
  item_id VARCHAR(100),
  bar_code VARCHAR(100),
  location VARCHAR(255),
  description_of_problem TEXT,
  note TEXT,
  damage_image JSON
);
