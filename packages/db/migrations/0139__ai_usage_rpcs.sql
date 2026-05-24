-- File: 0139__ai_usage_rpcs.sql
-- Phase: 03
-- Description: Race-free AI quota reservation/completion/refund RPCs.
-- Idempotent: YES
BEGIN;

CREATE OR REPLACE FUNCTION reserve_ai_usage(
	p_event_id TEXT,
	p_workspace_id TEXT,
	p_user_id TEXT,
	p_idem_key TEXT,
	p_tokens BIGINT
) RETURNS ai_usage_events
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
	v_existing ai_usage_events;
	v_used BIGINT;
	v_limit BIGINT;
	v_event ai_usage_events;
BEGIN
	IF p_tokens <= 0 THEN RAISE EXCEPTION 'AI_TOKENS_INVALID' USING ERRCODE = 'P0001'; END IF;

	SELECT * INTO v_existing FROM ai_usage_events
		WHERE workspace_id = p_workspace_id AND idempotency_key = p_idem_key;
	IF FOUND THEN RETURN v_existing; END IF;

	SELECT monthly_ai_token_limit INTO v_limit
		FROM workspaces WHERE id = p_workspace_id FOR UPDATE;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'WORKSPACE_NOT_FOUND' USING ERRCODE = 'P0005';
	END IF;

	SELECT COALESCE(SUM(
		CASE WHEN status = 'completed' THEN COALESCE(tokens_used, 0)
		     WHEN status = 'reserved'  THEN tokens_reserved
		     ELSE 0 END
	), 0) INTO v_used
	FROM ai_usage_events
	WHERE workspace_id = p_workspace_id
	  AND created_at >= date_trunc('month', now());

	IF v_used + p_tokens > v_limit THEN
		RAISE EXCEPTION 'AI_QUOTA_EXCEEDED' USING ERRCODE = 'P0002';
	END IF;

	INSERT INTO ai_usage_events(id, workspace_id, user_id, idempotency_key, tokens_reserved, status)
	VALUES (p_event_id, p_workspace_id, p_user_id, p_idem_key, p_tokens, 'reserved')
	RETURNING * INTO v_event;

	RETURN v_event;
END;
$$;

CREATE OR REPLACE FUNCTION complete_ai_usage(p_event_id TEXT, p_tokens_used BIGINT)
RETURNS ai_usage_events LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event ai_usage_events; BEGIN
	IF p_tokens_used < 0 THEN RAISE EXCEPTION 'AI_TOKENS_INVALID' USING ERRCODE = 'P0001'; END IF;
	UPDATE ai_usage_events SET status = 'completed', tokens_used = p_tokens_used, completed_at = now()
	 WHERE id = p_event_id AND status = 'reserved' RETURNING * INTO v_event;
	IF NOT FOUND THEN RAISE EXCEPTION 'AI_USAGE_NOT_RESERVED' USING ERRCODE = 'P0003'; END IF;
	RETURN v_event;
END; $$;

CREATE OR REPLACE FUNCTION refund_ai_usage(p_event_id TEXT)
RETURNS ai_usage_events LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_event ai_usage_events; BEGIN
	UPDATE ai_usage_events SET status = 'refunded', tokens_reserved = 0, tokens_used = 0, completed_at = now()
	 WHERE id = p_event_id AND status IN ('reserved','completed') RETURNING * INTO v_event;
	IF NOT FOUND THEN RAISE EXCEPTION 'AI_USAGE_NOT_REFUNDABLE' USING ERRCODE = 'P0004'; END IF;
	RETURN v_event;
END; $$;

COMMIT;

-- ROLLBACK:
-- BEGIN;
-- DROP FUNCTION IF EXISTS refund_ai_usage(TEXT);
-- DROP FUNCTION IF EXISTS complete_ai_usage(TEXT, BIGINT);
-- DROP FUNCTION IF EXISTS reserve_ai_usage(TEXT, TEXT, TEXT, TEXT, BIGINT);
-- COMMIT;
