-- Sample listings for demo. Remove before launch:  delete from listings where is_sample;
alter table public.listings disable trigger listings_guard;

insert into public.listings
(status, verified, is_sample, name, city, micro_market, address, lat, lng, primary_type, storage_types, building_type,
 area_total, area_available, area_min, description, dist_highway_km, dist_airport_km, dist_railway_km, road_width_ft,
 inside_midc, container_40ft, landmarks, grade, flooring, clear_height_m, eave_height_m, floor_load_mt, docks, dock_levelers,
 truck_parking, office_sqft, amenities, power_kva, power_backup, fire_safety, fire_noc, rent_psf, cam_psf, deposit_months,
 escalation_pct, lock_in_months, available_from, flex_enabled, flex_rate_pallet, photos)
values
('live', true, true, 'Chakan Phase II Grade-A Park', 'Pune', 'Chakan MIDC Phase II', 'Plot A-14, MIDC Phase II, Chakan', 18.7562, 73.8187,
 'General / Dry storage', '{"General / Dry storage","Auto parts","3PL"}', 'PEB', 120000, 52000, 15000,
 'Grade-A PEB warehouse with FM2 flooring, 12 m centre height and 8 dock levelers. Ideal for auto-component and 3PL operations serving Volkswagen and Mahindra plants.',
 2.5, 32, 18, 60, true, true, '{"Volkswagen","Mahindra"}', 'A', 'FM2 / Laser screed', 12, 9, 5, 8, true, 20, 2500,
 '{"CCTV","24x7 security","Weighbridge","Canteen","Driver rest room"}', 250, 'DG 100%', 'Hydrants + sprinklers', true,
 26, 3, 6, 5, 36, current_date + 15, true, 650,
 '{"https://images.unsplash.com/photo-1565793298595-6a879b1d9492","https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d","https://images.unsplash.com/photo-1553413077-190dd305871c","https://images.unsplash.com/photo-1616401784845-180882ba9ba8"}'),

('live', true, true, 'Mahalunge Fulfillment Hub', 'Pune', 'Mahalunge', 'Survey 112, Mahalunge-Ingale', 18.7222, 73.8314,
 'E-commerce fulfillment', '{"E-commerce fulfillment","General / Dry storage"}', 'PEB', 60000, 28000, 8000,
 'Fulfilment-ready space with mezzanine, high-speed docks and large truck yard. 10 minutes from Pune–Nashik highway.',
 1.2, 28, 15, 40, false, true, '{"Bajaj Auto"}', 'A', 'VDF trimix', 11, 8, 4, 6, true, 12, 1800,
 '{"CCTV","24x7 security","Mezzanine","Racking"}', 180, 'DG 70%', 'Hydrants + sprinklers', true,
 24, 2.5, 6, 5, 24, current_date + 7, true, 600,
 '{"https://images.unsplash.com/photo-1587293852726-70cdb56c2866","https://images.unsplash.com/photo-1580674285054-bed31e145f59","https://images.unsplash.com/photo-1504307651254-35680f356dfd"}'),

('live', true, true, 'Talegaon Industrial Yard', 'Pune', 'Talegaon MIDC', 'Phase IV, Talegaon Dabhade', 18.7286, 73.6795,
 'Open yard', '{"Open yard","Cross-docking"}', 'Open land + shed', 80000, 50000, 20000,
 'Compacted open yard with 10,000 sq ft covered shed. Suited for containers, steel coils and heavy machinery.',
 3, 45, 6, 60, true, true, '{"Mercedes-Benz"}', 'B', 'Concrete paver', 9, 7, 8, 2, false, 40, 600,
 '{"Boundary wall","24x7 security","Weighbridge"}', 100, 'DG 50%', 'Extinguishers + hydrants', true,
 17, 1.5, 3, 5, 12, current_date, false, null,
 '{"https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3","https://images.unsplash.com/photo-1578575437130-527eed3abbec","https://images.unsplash.com/photo-1519003722824-194d4455a60c"}'),

('live', true, true, 'Bhosari Auto Parts Store', 'Pune', 'Bhosari MIDC', 'J-Block, Bhosari MIDC', 18.6301, 73.8455,
 'Auto parts', '{"Auto parts","General / Dry storage"}', 'RCC', 25000, 18000, 6000,
 'Compact RCC store close to Tata Motors Pimpri. Racking included, 2 docks, 24x7 access.',
 1.5, 14, 4, 30, true, false, '{"Tata Motors"}', 'B', 'Trimix', 8, 6.5, 3, 2, false, 6, 900,
 '{"Racking","CCTV","24x7 access"}', 75, 'DG 50%', 'Extinguishers + hydrants', true,
 28, 2, 6, 5, 12, current_date + 30, true, 700,
 '{"https://images.unsplash.com/photo-1567789884554-0b844b597180","https://images.unsplash.com/photo-1624927637280-f033784c1279","https://images.unsplash.com/photo-1586528116493-a029325540fa"}'),

('live', false, true, 'Ranjangaon Climate Warehouse', 'Pune', 'Ranjangaon MIDC', 'Sector 2, Ranjangaon MIDC', 18.7570, 74.2468,
 'Climate-controlled', '{"Climate-controlled","Pharma-grade","Food grade"}', 'PEB', 40000, 40000, 10000,
 'Insulated PEB with 18–25 °C control, epoxy floor and pharma-ready layout. Documents under review.',
 4, 55, 22, 40, true, true, '{"IndoSpace"}', 'A', 'Epoxy', 10, 8, 4, 4, true, 10, 1500,
 '{"Temperature control","CCTV","Pest control","Backup power"}', 300, 'DG 100%', 'Hydrants + sprinklers', false,
 34, 4, 6, 5, 36, current_date + 45, false, null,
 '{"https://images.unsplash.com/photo-1590496793929-36417d3117de","https://images.unsplash.com/photo-1553413077-190dd305871c"}'),

('live', true, true, 'Chakan Phase I Cross-Dock', 'Pune', 'Chakan MIDC Phase I', 'Plot C-3, MIDC Phase I, Chakan', 18.7680, 73.8605,
 'Cross-docking', '{"Cross-docking","3PL","General / Dry storage"}', 'PEB', 45000, 22000, 10000,
 'Drive-through cross-dock with 12 docks on both sides. Minutes from Chakan chowk on NH-60.',
 0.8, 30, 17, 60, true, true, '{"Bajaj Auto","Volkswagen"}', 'A', 'FM2 / Laser screed', 11, 9, 5, 12, true, 25, 1200,
 '{"CCTV","24x7 security","Driver rest room","Canteen"}', 160, 'DG 100%', 'Hydrants + sprinklers', true,
 25, 3, 6, 5, 24, current_date + 10, true, 620,
 '{"https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d","https://images.unsplash.com/photo-1616401784845-180882ba9ba8","https://images.unsplash.com/photo-1587293852726-70cdb56c2866"}'),

('live', true, true, 'Kuruli Budget Storage', 'Pune', 'Kuruli', 'Near Kuruli Phata, Alandi road', 18.7400, 73.8500,
 'General / Dry storage', '{"General / Dry storage"}', 'Shed', 15000, 15000, 5000,
 'Affordable shed for small manufacturers and traders. Flexible short-term terms available.',
 2, 26, 14, 25, false, false, '{"Mahindra"}', 'C', 'Concrete', 7, 5.5, 2, 1, false, 4, 300,
 '{"CCTV","Boundary wall"}', 40, 'None', 'Extinguishers', true,
 16, 1, 3, 5, 6, current_date, true, 450,
 '{"https://images.unsplash.com/photo-1580674285054-bed31e145f59","https://images.unsplash.com/photo-1624927637280-f033784c1279"}'),

('live', true, true, 'Sanaswadi Logistics Park', 'Pune', 'Sanaswadi', 'Pune–Ahmednagar Highway, Sanaswadi', 18.6720, 74.0540,
 '3PL', '{"3PL","E-commerce fulfillment","General / Dry storage"}', 'PEB', 200000, 85000, 25000,
 'Large-format logistics park with 14 m height, 16 docks and dedicated trailer parking. Built-to-suit options.',
 0.5, 35, 20, 80, false, true, '{"IndoSpace"}', 'A', 'FM2 / Laser screed', 14, 11, 6, 16, true, 45, 4000,
 '{"CCTV","24x7 security","Weighbridge","Canteen","Driver rest room","Racking"}', 400, 'DG 100%', 'Hydrants + sprinklers', true,
 23, 3, 6, 5, 60, current_date + 60, false, null,
 '{"https://images.unsplash.com/photo-1504307651254-35680f356dfd","https://images.unsplash.com/photo-1565793298595-6a879b1d9492","https://images.unsplash.com/photo-1586528116493-a029325540fa"}');

alter table public.listings enable trigger listings_guard;
