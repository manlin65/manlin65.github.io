-- Public demo API: tables stay private; read/delete require the import capability.
BEGIN;
CREATE OR REPLACE FUNCTION public.datencockpit_status()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT jsonb_build_object('connected',true,'service','PostgreSQL'); $$;

CREATE OR REPLACE FUNCTION public.datencockpit_import(p_rows jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_id uuid := gen_random_uuid();
  v_token text := encode(sha256(convert_to(gen_random_uuid()::text || gen_random_uuid()::text,'UTF8')),'hex');
  v_row jsonb;
  v_number text;
  v_customer text;
  v_date date;
  v_amount bigint;
  v_status text;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'Eine Auftragsliste ist erforderlich.' USING ERRCODE='22023';
  END IF;
  IF jsonb_array_length(p_rows) < 1 OR jsonb_array_length(p_rows) > 1000 OR octet_length(p_rows::text) > 1048576 THEN
    RAISE EXCEPTION 'Erlaubt sind 1 bis 1000 Aufträge und maximal 1 MB Nutzdaten.' USING ERRCODE='22023';
  END IF;
  -- Transactional: a later validation error rolls back this cleanup and all inserts.
  DELETE FROM public.datencockpit_batches WHERE expires_at <= now();
  INSERT INTO public.datencockpit_batches(id,token_hash)
    VALUES(v_id,encode(sha256(convert_to(v_token,'UTF8')),'hex'));
  FOR v_row IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    IF jsonb_typeof(v_row) IS DISTINCT FROM 'object'
      OR jsonb_typeof(v_row->'orderNumber') IS DISTINCT FROM 'string'
      OR jsonb_typeof(v_row->'customer') IS DISTINCT FROM 'string'
      OR jsonb_typeof(v_row->'date') IS DISTINCT FROM 'string'
      OR jsonb_typeof(v_row->'status') IS DISTINCT FROM 'string'
      OR jsonb_typeof(v_row->'amountCents') IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'Ungültige Felder im Import.' USING ERRCODE='22023';
    END IF;
    v_number := btrim(v_row->>'orderNumber');
    v_customer := btrim(v_row->>'customer');
    v_status := v_row->>'status';
    IF length(v_number) NOT BETWEEN 1 AND 80 OR length(v_customer) NOT BETWEEN 1 AND 160
      OR v_status NOT IN ('offen','bezahlt','storniert')
      OR (v_row->>'date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      OR (v_row->>'amountCents') !~ '^[0-9]{1,10}$' THEN
      RAISE EXCEPTION 'Pflichtwerte, Datum, Betrag oder Status sind ungültig.' USING ERRCODE='22023';
    END IF;
    BEGIN
      v_date := (v_row->>'date')::date;
      v_amount := (v_row->>'amountCents')::bigint;
    EXCEPTION WHEN datetime_field_overflow OR invalid_datetime_format OR invalid_text_representation OR numeric_value_out_of_range THEN
      RAISE EXCEPTION 'Datum oder Betrag ist ungültig.' USING ERRCODE='22023';
    END;
    IF v_date < DATE '2000-01-01' OR v_date > DATE '2100-12-31'
      OR to_char(v_date,'YYYY-MM-DD') <> (v_row->>'date') OR v_amount > 1000000000 THEN
      RAISE EXCEPTION 'Datum oder Betrag liegt außerhalb des erlaubten Bereichs.' USING ERRCODE='22023';
    END IF;
    BEGIN
      INSERT INTO public.datencockpit_orders(batch_id,order_number,order_date,customer,amount_cents,status)
        VALUES(v_id,v_number,v_date,v_customer,v_amount,v_status);
    EXCEPTION WHEN unique_violation THEN
      RAISE EXCEPTION 'Eine Auftragsnummer ist doppelt. Bitte vor der Freigabe korrigieren.' USING ERRCODE='22023';
    END;
  END LOOP;
  RETURN jsonb_build_object('batchId',v_id,'accessToken',v_token,'count',jsonb_array_length(p_rows),'expiresInHours',24);
END;
$$;

CREATE OR REPLACE FUNCTION public.datencockpit_report(p_batch_id uuid,p_token text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_months jsonb; v_totals jsonb;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' OR NOT EXISTS (
    SELECT 1 FROM public.datencockpit_batches
    WHERE id=p_batch_id AND expires_at>now()
      AND token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')
  ) THEN RAISE EXCEPTION 'Import nicht gefunden oder abgelaufen.' USING ERRCODE='P0002'; END IF;
  SELECT coalesce(jsonb_agg(m ORDER BY m->>'month'),'[]'::jsonb) INTO v_months FROM (
    SELECT jsonb_build_object('month',to_char(order_date,'YYYY-MM'),
      'orders',count(*),
      'openOrders',count(*) FILTER(WHERE status='offen'),
      'revenueCents',coalesce(sum(amount_cents) FILTER(WHERE status='bezahlt'),0),
      'openCents',coalesce(sum(amount_cents) FILTER(WHERE status='offen'),0),
      'cancelledOrders',count(*) FILTER(WHERE status='storniert')) AS m
    FROM public.datencockpit_orders WHERE batch_id=p_batch_id
    GROUP BY to_char(order_date,'YYYY-MM')
  ) AS grouped;
  SELECT jsonb_build_object('orders',count(*),
    'openOrders',count(*) FILTER(WHERE status='offen'),
    'revenueCents',coalesce(sum(amount_cents) FILTER(WHERE status='bezahlt'),0),
    'openCents',coalesce(sum(amount_cents) FILTER(WHERE status='offen'),0),
    'cancelledOrders',count(*) FILTER(WHERE status='storniert')) INTO v_totals
    FROM public.datencockpit_orders WHERE batch_id=p_batch_id;
  RETURN jsonb_build_object('batchId',p_batch_id,'months',v_months,'totals',v_totals);
END;
$$;

CREATE OR REPLACE FUNCTION public.datencockpit_delete(p_batch_id uuid,p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE v_id uuid;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Import nicht gefunden oder abgelaufen.' USING ERRCODE='P0002';
  END IF;
  DELETE FROM public.datencockpit_batches
    WHERE id=p_batch_id AND expires_at>now()
      AND token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex')
    RETURNING id INTO v_id;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Import nicht gefunden oder abgelaufen.' USING ERRCODE='P0002'; END IF;
  RETURN jsonb_build_object('deleted',true);
END;
$$;

REVOKE ALL ON FUNCTION public.datencockpit_status() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.datencockpit_import(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.datencockpit_report(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.datencockpit_delete(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.datencockpit_status() TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.datencockpit_import(jsonb) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.datencockpit_report(uuid,text) TO anon,authenticated;
GRANT EXECUTE ON FUNCTION public.datencockpit_delete(uuid,text) TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;

SELECT public.datencockpit_status() AS verbindung;
