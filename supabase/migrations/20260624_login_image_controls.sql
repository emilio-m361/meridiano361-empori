-- Nuovi controlli per l'immagine di sfondo della pagina di accesso
INSERT INTO public.app_settings (key, value) VALUES
  ('login_left_image_position', 'center center'),
  ('login_left_image_size',     'cover'),
  ('login_left_overlay_color',  '#000000'),
  ('login_left_overlay_opacity','0'),
  ('login_left_img_brightness', '100'),
  ('login_left_img_blur',       '0')
ON CONFLICT (key) DO NOTHING;
