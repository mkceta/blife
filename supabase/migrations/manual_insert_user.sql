INSERT INTO public.users (id, email, alias_inst, uni)
VALUES (
  'f8c800b9-81e6-428c-99ef-613f2e73702b',
  'guillermo.failde@udc.es',
  'guillermo.failde@udc',
  'udc.es'
)
ON CONFLICT (id) DO NOTHING;
