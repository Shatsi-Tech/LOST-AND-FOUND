CREATE OR REPLACE FUNCTION exec_sql(query_text TEXT, params JSONB DEFAULT '[]'::jsonb)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result      JSONB;
  final_q     TEXT;
  clean_q     TEXT;
  idx         INT;
  pval        TEXT;
  row_count   BIGINT;
  params_arr  JSONB;
BEGIN
  final_q := query_text;

  IF params IS NULL THEN
    params_arr := '[]'::jsonb;
  ELSIF jsonb_typeof(params) = 'array' THEN
    params_arr := params;
  ELSIF jsonb_typeof(params) = 'string' THEN
    BEGIN
      params_arr := params::text::jsonb;
      IF jsonb_typeof(params_arr) != 'array' THEN
        params_arr := jsonb_build_array(params);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      params_arr := '[]'::jsonb;
    END;
  ELSE
    params_arr := jsonb_build_array(params);
  END IF;

  IF jsonb_array_length(params_arr) > 0 THEN
    FOR idx IN REVERSE (jsonb_array_length(params_arr) - 1) .. 0
    LOOP
      pval := params_arr ->> idx;
      IF pval IS NULL THEN
        final_q := regexp_replace(final_q, '\$' || (idx + 1) || '(?!\d)', 'NULL', 'g');
      ELSE
        final_q := regexp_replace(final_q, '\$' || (idx + 1) || '(?!\d)', replace(quote_literal(pval), '\', '\\'), 'g');
      END IF;
    END LOOP;
  END IF;

  -- Strip all leading whitespace, newlines, tabs, and comments
  clean_q := regexp_replace(final_q, '^\s+', '');

  -- SELECT / WITH → return rows as a JSONB array
  IF upper(clean_q) LIKE 'SELECT%' OR upper(clean_q) LIKE 'WITH%' THEN
    -- Strip trailing semicolon if present so subquery syntax is valid
    clean_q := regexp_replace(clean_q, ';\s*$', '');
    EXECUTE
      'SELECT COALESCE(jsonb_agg(t), ''[]''::jsonb) FROM (' || clean_q || ') t'
    INTO result;
    RETURN COALESCE(result, '[]'::JSONB);
  ELSE
    -- INSERT / UPDATE / DELETE / DDL → return affected row count
    EXECUTE final_q;
    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN jsonb_build_object('rowCount', COALESCE(row_count, 0));
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'exec_sql error: % | query: %', SQLERRM, final_q;
END;
$$;

GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT, JSONB) TO anon;
