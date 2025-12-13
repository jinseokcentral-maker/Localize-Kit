-- ============================================
-- LocalizeKit - Project API Usage Aggregation
-- ============================================
-- Run AFTER 20241203000003_webhooks_and_api_usage.sql
-- Adds helper function to aggregate project API usage for business logic (rate limiting)

-- ============================================
-- FUNCTION: Get Project API Usage (Current Month)
-- ============================================
-- Aggregates API usage for a project in the current month
-- Used by backend for rate limiting and quota enforcement

CREATE OR REPLACE FUNCTION get_project_api_usage(project_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  current_year INT;
  current_month INT;
  total_usage INT;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::INT;
  current_month := EXTRACT(MONTH FROM NOW())::INT;

  SELECT COALESCE(SUM(request_count), 0)::INT
  INTO total_usage
  FROM api_usage
  WHERE project_id = project_uuid
    AND year = current_year
    AND month = current_month;

  RETURN total_usage;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_project_api_usage(UUID) IS 'Returns total API usage for a project in the current month. Used for rate limiting and quota enforcement.';

-- ============================================
-- FUNCTION: Get Project API Usage (Specific Month)
-- ============================================
-- Aggregates API usage for a project in a specific month/year
-- Useful for historical data and reporting

CREATE OR REPLACE FUNCTION get_project_api_usage_by_month(
  project_uuid UUID,
  target_year INT,
  target_month INT
)
RETURNS INTEGER AS $$
DECLARE
  total_usage INT;
BEGIN
  SELECT COALESCE(SUM(request_count), 0)::INT
  INTO total_usage
  FROM api_usage
  WHERE project_id = project_uuid
    AND year = target_year
    AND month = target_month;

  RETURN total_usage;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_project_api_usage_by_month(UUID, INT, INT) IS 'Returns total API usage for a project in a specific month/year. Used for historical data and reporting.';

